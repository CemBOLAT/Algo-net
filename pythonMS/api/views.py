from rest_framework.decorators import api_view, parser_classes
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from .serializers import RunPythonSerializer, ColorSerializer, SearchSerializer
from .services import run_python_script, ScriptExecutionError

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
