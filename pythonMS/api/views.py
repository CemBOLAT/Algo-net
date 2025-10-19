from rest_framework.decorators import api_view, parser_classes
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from .serializers import RunPythonSerializer, ColorSerializer, SearchSerializer, LayoutPlanningSerializer
from .services import run_python_script, ScriptExecutionError
from .services import run_fixed_python_script
from django.conf import settings
import os
import threading
from .algorithms import coloring_algorithms, searching_algorithms, path_algorithms

import smtplib, ssl, json, datetime, requests
from email.mime.text import MIMEText
import base64

# --- TEMEL YARDIMCI FONKSİYONLAR (ÇOĞUNLUKLA DEĞİŞİKLİK YOK) ---

def _send_gmail(to_email: str, subject: str, body: str):
    user = os.getenv("GMAIL_USER")
    pwd = os.getenv("GMAIL_PASS")
    if not (user and pwd and to_email):
        return
    msg = MIMEText(body, "plain", "utf-8")
    msg["Subject"] = subject
    msg["From"] = user
    msg["To"] = to_email
    ctx = ssl.create_default_context()
    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465, context=ctx) as server:
            server.login(user, pwd)
            server.sendmail(user, [to_email], msg.as_string())
    except Exception as ex:
        print(f"Error sending email to {to_email}: {ex}")

def _mk_name_with_suffix(base: str):
    now = datetime.datetime.now()
    return f"{base}_{now.day}:{now.month}:{now.year}"

def _to_backend_payload(vertices, edges, name: str, legend_entries=None):
    nodes = []
    for v in vertices:
        nodes.append({
            "nodeId": str(v.get("id")),
            "label": v.get("label") or str(v.get("id")),
            "size": v.get("size") or 15,
            "color": v.get("color") or "#2563eb",
            "positionX": v.get("x"),
            "positionY": v.get("y"),
        })
    edges_out = []
    for e in edges:
        edges_out.append({
            "edgeId": str(e.get("id")) if e.get("id") is not None else f"{e.get('from')}-{e.get('to')}",
            "fromNode": e.get("from"),
            "toNode": e.get("to"),
            "weight": e.get("weight", 1),
            "isDirected": e.get("directed", False),
            "showWeight": e.get("showWeight", True),
        })
    payload = {
        "name": name,
        "nodes": nodes,
        "edges": edges_out,
    }
    if legend_entries:
        payload["hasLegend"] = True
        payload["legendEntries"] = legend_entries
    else:
        payload["hasLegend"] = False
        payload["legendEntries"] = []
    return payload

def _save_graph_to_backend_safe(auth_header, payload):
    backend_base = os.getenv("JAVA_BACKEND_BASE", "http://localhost:8080")
    url = f"{backend_base}/api/graphs/save"
    headers = {}
    if auth_header:
        headers["Authorization"] = auth_header
    try:
        r = requests.post(url, headers=headers, json=payload, timeout=15)
        r.raise_for_status()
    except Exception as ex:
        print("save graph error (async safe):", ex)

def _get_email_from_auth(auth_header: str):
    """
    Authorization: Bearer <jwt>
    Extract email from JWT payload without verification (best-effort).
    """
    try:
        if not auth_header or " " not in auth_header:
            return None
        token = auth_header.split(" ", 1)[1].strip()
        parts = token.split(".")
        if len(parts) < 2:
            return None
        payload_b64 = parts[1]
        # fix padding
        padding = "=" * (-len(payload_b64) % 4)
        decoded = base64.urlsafe_b64decode(payload_b64 + padding)
        payload = json.loads(decoded.decode("utf-8"))
        return payload.get("email")
    except Exception:
        return None

# --- KRİTİK DÜZELTME BURADA ---

def _extract_color_map(result):
    """
    GÜNCELLENDİ: Artık 'red', 'blue' gibi renk isimlerini de kabul ediyor.
    Sadece '#' ile başlayanları değil, string olan her şeyi renk olarak kabul eder.
    """
    obj = result.get("result") if isinstance(result, dict) and isinstance(result.get("result"), dict) else result
    if not isinstance(obj, (dict, list)): return {}
    color_map = {}
    
    # Case A: explicit colors dict
    if isinstance(obj, dict) and isinstance(obj.get("colors"), dict):
        for k, v in obj["colors"].items():
            if isinstance(v, str): color_map[str(k)] = v
        return color_map
        
    # Case B: top-level dict like { "1": "red", "2": "#00ff00", ... } OR { "1": {"color":"blue"}, ... }
    if isinstance(obj, dict):
        for k, v in obj.items():
            # DÜZELTME: v.startswith("#") KONTROLÜ KALDIRILDI!
            if isinstance(v, str): 
                color_map[str(k)] = v # Artık "red", "blue" vb. kabul edilir.
            elif isinstance(v, dict) and isinstance(v.get("color"), str): 
                color_map[str(k)] = v["color"]
                
    # Case C: list like [ {"id": "1","color":"#..."}, ...]
    if isinstance(obj, list):
        for item in obj:
            if not isinstance(item, dict): continue
            vid, col = item.get("id"), item.get("color")
            if vid is not None and isinstance(col, str): color_map[str(vid)] = col
            
    return color_map

def _extract_positions(result):
    """(Değişiklik yok)"""
    obj = result.get("result") if isinstance(result, dict) and isinstance(result.get("result"), dict) else result
    if not isinstance(obj, (dict, list)): return {}
    pos_map = {}
    if isinstance(obj, dict) and isinstance(obj.get("positions"), dict):
        for k, v in obj["positions"].items():
            if isinstance(v, dict): pos_map[str(k)] = {"x": v.get("x"), "y": v.get("y")}
        return pos_map
    if isinstance(obj, dict):
        for k, v in obj.items():
            if isinstance(v, dict) and ("x" in v or "y" in v): pos_map[str(k)] = {"x": v.get("x"), "y": v.get("y")}
    if isinstance(obj, list):
        for item in obj:
            if not isinstance(item, dict): continue
            vid = item.get("id")
            if vid is None: continue
            pos_map[str(vid)] = {"x": item.get("x"), "y": item.get("y")}
    return pos_map

def _apply_result_to_vertices(vertices, result):
    """
    (Değişiklik yok)
    Artık düzeltilmiş _extract_color_map fonksiyonunu çağırıyor.
    """
    color_map, pos_map = _extract_color_map(result), _extract_positions(result)
    if not color_map and not pos_map: 
        print("Delta application found no colors or positions to apply.")
        return vertices # Eğer hiçbir değişiklik yoksa orijinali döndür
        
    print(f"Applying delta: {len(color_map)} colors, {len(pos_map)} positions.")
    out = []
    for v in vertices:
        vid = str(v.get("id"))
        nv = dict(v)
        if vid in color_map: nv["color"] = color_map[vid]
        if vid in pos_map:
            p = pos_map[vid]
            if p.get("x") is not None: nv["x"] = p["x"]
            if p.get("y") is not None: nv["y"] = p["y"]
        out.append(nv)
    return out

# --- KALDIRILAN FONKSİYONLAR ---
# _is_full_graph_result (Kaldırıldı)
# _extract_full_graph (Kaldırıldı)

# --- YENİDEN YAPILANDIRILAN ASENKRON FONKSİYONLAR ---

def _perform_async_side_effects(auth_header, save_graph, graph_name, original_vertices, original_edges, result, should_notify, user_email, legend_entries=None):
    """
    GÜNCELLENDİ: Artık 'result'ın *her zaman* bir delta (renk/pozisyon) olduğunu varsayar
    ve bunu orijinal 'vertices' üzerine uygulamaya çalışır.
    """
    try:
        final_vertices, final_edges = original_vertices, original_edges
        
        if save_graph:
            # Talep üzerine 'full graph' kontrolü kaldırıldı.
            # Her zaman 'result'ı bir delta olarak uygula.
            print("Applying result as a delta (color/position map)...")
            final_vertices = _apply_result_to_vertices(original_vertices, result)
            final_edges = original_edges # Deltalar edge'leri değiştirmez

            # Kaydetme işlemi
            name = _mk_name_with_suffix(graph_name)
            payload = _to_backend_payload(final_vertices, final_edges, name, legend_entries=legend_entries)
            print(f"Saving graph '{name}' with {len(final_vertices)} nodes.")
            _save_graph_to_backend_safe(auth_header, payload)
        
        # Bildirim gönderme
        if should_notify and user_email:
            _send_gmail(user_email, "AlgoNet Bildirim", "Algoritmanız tamamlandı. Sonuçlar sisteme kaydedildi.")
    except Exception as ex:
        print("post-completion hooks error (async):", ex)

def _run_script_and_handle_side_effects(script_file, script_path, vertices, edges, entries, auth_header, save_graph, graph_name, should_notify, user_email):
    """
    (Değişiklik yok)
    Bu ana fonksiyon, artık güncellenmiş _perform_async_side_effects'i çağırır.
    """
    script_type = "custom" if script_file else "layout"
    try:
        if script_type == "custom":
            result = run_python_script(script_file, vertices, edges)
        else:
            result = run_fixed_python_script(script_path, vertices, edges, entries)
        
        # TANI İÇİN BU PRINT'LERİ TUTABİLİRSİNİZ
        print("--- SCRIPT'TEN DÖNEN GERÇEK SONUÇ ---")
        try:
            print(json.dumps(result, indent=2))
        except TypeError:
            print(str(result)) # JSON olmayan çıktılar için
        # --- TANI SONU ---

        if not result:
            raise ScriptExecutionError("Script returned an empty result")

        # Artık yenilenmiş _perform_async_side_effects'i çağırıyoruz.
        _perform_async_side_effects(auth_header, save_graph, graph_name, vertices, edges, result, should_notify, user_email, entries if script_type == "layout" else None)

    except (ScriptExecutionError, Exception) as e:
        print(f"async script error ({script_type}):", e)
        error_message = f"Algoritma ({script_type}) çalıştırılırken hata oluştu:\n\n{str(e)}"
        if should_notify and user_email:
            _send_gmail(user_email, "AlgoNet Hata Bildirimi", error_message)
        
        # Layout için Fallback mantığı
        if script_type == "layout" and save_graph:
            print("Running layout fallback (async)...")
            try:
                palette = [str(e.get("color") or "").strip() for e in entries if str(e.get("color") or "").strip()] or coloring_algorithms.COLOR_PALETTE
                color_map = {str(v.get("id")): palette[i % len(palette)] for i, v in enumerate(vertices) if v.get("id")}
                fallback_result = {"colors": color_map}
                _perform_async_side_effects(auth_header, True, f"{graph_name} (Fallback)", vertices, edges, fallback_result, False, None, entries)
                if should_notify and user_email:
                     _send_gmail(user_email, "AlgoNet Bildirim (Fallback)", "Layout planning hatası sonrası fallback çalıştırıldı ve sonuç kaydedildi.")
            except Exception as fallback_ex:
                print("Error during async fallback execution:", fallback_ex)


# --- API ENDPOINT'LERİ (DEĞİŞİKLİK YOK) ---
# View fonksiyonlarının mantığı (senkron/asenkron ayrımı) zaten doğruydu.
# Sadece çağırdıkları yardımcı fonksiyonlar güncellendi.

@api_view(["POST"])
@parser_classes([MultiPartParser, FormParser])
def run_python(request):
    serializer = RunPythonSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    data = serializer.validated_data
    should_notify = request.data.get("shouldNotify") in ("true", "True", True)
    user_email = request.data.get("userEmail")
    if should_notify and not user_email:
        user_email = _get_email_from_auth(request.META.get("HTTP_AUTHORIZATION"))

    if should_notify and user_email:
        thread_args = (
            data["file"], None, data["vertices"], data["edges"], None,
            request.META.get("HTTP_AUTHORIZATION"),
            request.data.get("saveGraph") in ("true", "True", True),
            request.data.get("graphName") or "Graph",
            True, user_email
        )
        threading.Thread(target=_run_script_and_handle_side_effects, args=thread_args).start()
        return Response({"result": {"message": "Algoritma arka planda çalıştırıldı. Tamamlandığında e-posta ile bildirim alacaksınız."}})
    
    try:
        result = run_python_script(data["file"], data["vertices"], data["edges"])
        if request.data.get("saveGraph") in ("true", "True", True):
            thread_args = (
                request.META.get("HTTP_AUTHORIZATION"), True, request.data.get("graphName") or "Graph",
                data["vertices"], data["edges"], result, False, None, None
            )
            threading.Thread(target=_perform_async_side_effects, args=thread_args).start()
        return Response({"result": result})
    except ScriptExecutionError as e:
        return Response({"result": {"error": str(e)}}, status=500)

@api_view(["POST"])
@parser_classes([MultiPartParser, FormParser])
def run_algorithm_layoutplanning(request):
    serializer = LayoutPlanningSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    data = serializer.validated_data
    should_notify = request.data.get("shouldNotify") in ("true", "True", True)
    user_email = request.data.get("userEmail")
    if should_notify and not user_email:
        user_email = _get_email_from_auth(request.META.get("HTTP_AUTHORIZATION"))
    script_path = os.path.join(settings.BASE_DIR, os.environ.get("LAYOUT_PLANNING_SCRIPT", "deneme.py"))

    if should_notify and user_email:
        thread_args = (
            None, script_path, data["vertices"], data["edges"], data.get("entries", []),
            request.META.get("HTTP_AUTHORIZATION"),
            request.data.get("saveGraph") in ("true", "True", True),
            request.data.get("graphName") or "Graph",
            True, user_email
        )
        threading.Thread(target=_run_script_and_handle_side_effects, args=thread_args).start()
        return Response({"result": {"message": "Algoritma arka planda çalıştırıldı. Tamamlandığında e-posta ile bildirim alacaksınız."}})

    try:
        result = run_fixed_python_script(script_path, data["vertices"], data["edges"], data.get("entries", []))
        if not result: raise ScriptExecutionError("Empty result from script")
        if request.data.get("saveGraph") in ("true", "True", True):
             thread_args = (
                request.META.get("HTTP_AUTHORIZATION"), True, request.data.get("graphName") or "Graph",
                data["vertices"], data["edges"], result, False, None, data.get("entries", [])
            )
             threading.Thread(target=_perform_async_side_effects, args=thread_args).start()
        return Response({"result": result})
    except ScriptExecutionError as e:
        print("layout planning error (sync):", e)
        palette = [str(entry.get("color") or "").strip() for entry in data.get("entries", []) if str(entry.get("color") or "").strip()] or coloring_algorithms.COLOR_PALETTE
        color_map = {str(v.get("id")): palette[i % len(palette)] for i, v in enumerate(data["vertices"]) if v.get("id")}
        if request.data.get("saveGraph") in ("true", "True", True):
            thread_args = (
                request.META.get("HTTP_AUTHORIZATION"), True, f"{request.data.get('graphName') or 'Graph'} (Fallback)",
                data["vertices"], data["edges"], {"colors": color_map}, False, None, data.get("entries", [])
            )
            threading.Thread(target=_perform_async_side_effects, args=thread_args).start()
        return Response({"result": color_map})


# --- DİĞER ALGORİTMA ENDPOINT'LERİ (DEĞİŞİKLİK YOK) ---
@api_view(["POST"])
@parser_classes([MultiPartParser, FormParser])
def run_algorithm_color(request):
    serializer = ColorSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data
    if data["selectedAlgo"] == "ordered_coloring":
        result = coloring_algorithms.greedy_coloring(data["vertices"], data["edges"])
        return Response({"result": result})
    return Response({"result": {}})

@api_view(["POST"])
@parser_classes([MultiPartParser, FormParser])
def run_algorithm_search(request):
    serializer = SearchSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data
    if data["selectedAlgo"] == "dfs":
        result = searching_algorithms.dfs(data["vertices"], data["edges"], data["edgeFrom"], data["edgeTo"])
        return Response({"result": result})
    return Response({"result": {}})

@api_view(["POST"])
@parser_classes([MultiPartParser, FormParser])
def run_algorithm_path(request):
    serializer = SearchSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data
    if data["selectedAlgo"] == "dijkstra":
        result = path_algorithms.dijkstra_pathfinding(data["vertices"], data["edges"], data["edgeFrom"], data["edgeTo"])
        return Response({"result": result})
    return Response({"result": {}})

@api_view(["GET"])
def health(request):
    return Response({"status": "ok", "service": "pythonMS"})