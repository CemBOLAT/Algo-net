from rest_framework.decorators import api_view, parser_classes
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
import subprocess, tempfile, os, json

@api_view(["POST"])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def run_python(request):
    """
    Frontend sends:
      - file: Python script (.py)
      - vertices: JSON string
      - edges: JSON string
    """
    try:
        # --- 1. Get uploaded Python file ---
        uploaded_file = request.FILES.get("file")
        if not uploaded_file:
            return Response({"error": "Python file is required"}, status=400)

        # Save Python file to a temp dir
        with tempfile.NamedTemporaryFile(delete=False, suffix=".py") as tmp_file:
            for chunk in uploaded_file.chunks():
                tmp_file.write(chunk)
            script_path = tmp_file.name

        print(f"script_path : {script_path}")
        # --- 2. Get vertices & edges JSON ---
        vertices_json = request.data.get("Vertices")
        edges_json = request.data.get("Edges")
        
        # Validate JSON strings
        try:
            vertices = json.loads(vertices_json)
            edges = json.loads(edges_json)
        except json.JSONDecodeError as e:
            return Response({"error": f"Invalid JSON: {str(e)}"}, status=400)

        print(f"vertices : {vertices}")
        print(f"edges : {edges}", end="\n\n")

        # --- 3. Run Python script with subprocess ---
        process = subprocess.Popen(
            ["python", script_path, json.dumps(vertices), json.dumps(edges)],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        stdout, stderr = process.communicate()
        print(f"out : {stdout}")
        if process.returncode != 0:
            return Response({"error": stderr}, status=500)

        # --- 4. Parse script output (dict expected) ---
        try:
            result = json.loads(stdout.strip())
        except json.JSONDecodeError:
            result = {"raw_output": stdout.strip()}

        # --- 5. Cleanup ---
        os.remove(script_path)

        print(f"result : {result}")
        return Response({"result": result})

    except Exception as e:
        return Response({"error": str(e)}, status=500)
