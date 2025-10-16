from rest_framework.decorators import api_view, parser_classes
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from .serializers import RunPythonSerializer, ColorSerializer, SearchSerializer, LayoutPlanningSerializer
from .services import run_python_script, ScriptExecutionError
from .services import run_fixed_python_script
from django.conf import settings
import os

from .algorithms import coloring_algorithms, searching_algorithms, path_algorithms


@api_view(["POST"])
@parser_classes([MultiPartParser, FormParser])
def run_python(request):
    serializer = RunPythonSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    file = serializer.validated_data["file"]
    vertices = serializer.validated_data["vertices"]
    edges = serializer.validated_data["edges"]

    try:
        result = run_python_script(file, vertices, edges)
    except ScriptExecutionError as e:
        return Response({"error": str(e)}, status=500)

    return Response({"result": result})

@api_view(["POST"])
@parser_classes([MultiPartParser, FormParser])
def run_algorithm_color(request):

    serializer = ColorSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    
    selectedAlgo = serializer.validated_data["selectedAlgo"]
    vertices = serializer.validated_data["vertices"]
    edges = serializer.validated_data["edges"]

    print("I am started")
    print(selectedAlgo)
    result = {}

    print(f"running : {selectedAlgo}")
    if ( selectedAlgo == "ordered_coloring"):
        print("Bankaiii")
        result = coloring_algorithms.greedy_coloring(vertices, edges)

        return Response({"result": result})

@api_view(["POST"])
@parser_classes([MultiPartParser, FormParser])
def run_algorithm_search(request):

    serializer = SearchSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    
    edgeFrom = serializer.validated_data["edgeFrom"]
    edgeTo = serializer.validated_data["edgeTo"]
    selectedAlgo = serializer.validated_data["selectedAlgo"]
    vertices = serializer.validated_data["vertices"]
    edges = serializer.validated_data["edges"]

    print("I am started")
    
    result = {}

    print(f"running : {selectedAlgo}")
    if ( selectedAlgo == "dfs"):
        print("Bankaiii")
        result = searching_algorithms.dfs(vertices, edges, edgeFrom, edgeTo)
        return Response({"result": result})

@api_view(["POST"])
@parser_classes([MultiPartParser, FormParser])
def run_algorithm_path(request):

    serializer = SearchSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    
    edgeFrom = serializer.validated_data["edgeFrom"]
    edgeTo = serializer.validated_data["edgeTo"]
    selectedAlgo = serializer.validated_data["selectedAlgo"]
    vertices = serializer.validated_data["vertices"]
    edges = serializer.validated_data["edges"]

    print("I am started")
    
    result = {}

    print(f"running : {selectedAlgo}")
    if ( selectedAlgo == "dijkstra"):
        
        result = path_algorithms.dijkstra_pathfinding(vertices, edges, edgeFrom, edgeTo)
        print(result)
        return Response({"result": result})

@api_view(["POST"])
@parser_classes([MultiPartParser, FormParser])
def run_algorithm_layoutplanning(request):
    """
    Accepts Vertices, Edges, and entries, runs a fixed python script (engineer-defined)
    and returns its JSON result in {"result": ...}. Falls back to simple color map if needed.
    """
    serializer = LayoutPlanningSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    vertices = serializer.validated_data["vertices"]
    edges = serializer.validated_data["edges"]
    entries = serializer.validated_data.get("entries", [])

    print("I am started layout planning")
    print(vertices)
    print("edges:", edges)
    print("entries:", entries)

    # Determine script path (same folder as .env): BASE_DIR/deneme.py
    script_name = os.environ.get("LAYOUT_PLANNING_SCRIPT", "cover.py")
    script_path = os.path.join(settings.BASE_DIR, script_name)

    try:
        result = run_fixed_python_script(script_path, vertices, edges, entries)
        # If script returns nothing useful, fall back to cyclic coloring
        if not result:
            raise ScriptExecutionError("Empty result from script")
        return Response({"result": result})
    except ScriptExecutionError as e:
        # Fallback: simple cyclic coloring using provided palette or default
        palette = [str(e.get("color") or "").strip() for e in entries if str(e.get("color") or "").strip()]
        if not palette:
            palette = coloring_algorithms.COLOR_PALETTE

        color_map = {}
        for i, v in enumerate(vertices):
            vid = str(v.get("id"))
            if not vid:
                continue
            color_map[vid] = palette[i % len(palette)]
        return Response({"result": color_map})

@api_view(["GET"])
def health(request):
    return Response({"status": "ok", "service": "pythonMS"})
