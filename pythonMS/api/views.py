from rest_framework.decorators import api_view, parser_classes
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from .serializers import RunPythonSerializer
from .services import run_python_script, ScriptExecutionError

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
