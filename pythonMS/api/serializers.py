from rest_framework import serializers
import json

class RunPythonSerializer(serializers.Serializer):
    file = serializers.FileField(required=True)
    Vertices = serializers.CharField(required=True)
    Edges = serializers.CharField(required=True)

    def validate_file(self, file):
        name = getattr(file, "name", "")
        if not name.endswith(".py"):
            raise serializers.ValidationError("Only .py files are supported.")
        return file

    def validate(self, attrs):
        try:
            vertices = json.loads(attrs["Vertices"])
            edges = json.loads(attrs["Edges"])
        except (TypeError, ValueError) as e:
            raise serializers.ValidationError(f"Invalid JSON: {e}")
        attrs["vertices"] = vertices
        attrs["edges"] = edges
        return attrs

class ColorSerializer(serializers.Serializer):
    selectedAlgo = serializers.CharField(required=True)
    Vertices = serializers.CharField(required=True)
    Edges = serializers.CharField(required=True)

    def validate(self, attrs):
        try:
            vertices = json.loads(attrs["Vertices"])
            edges = json.loads(attrs["Edges"])
        except (TypeError, ValueError) as e:
            raise serializers.ValidationError(f"Invalid JSON: {e}")
        
        attrs["vertices"] = vertices
        attrs["edges"] = edges
        return attrs
    
class SearchSerializer(serializers.Serializer):
    selectedAlgo = serializers.CharField(required=True)
    edgeFrom = serializers.CharField(required=True)
    edgeTo = serializers.CharField(required=True)
    Vertices = serializers.CharField(required=True)
    Edges = serializers.CharField(required=True)

    def validate(self, attrs):
        try:
            vertices = json.loads(attrs["Vertices"])
            edges = json.loads(attrs["Edges"])
        except (TypeError, ValueError) as e:
            raise serializers.ValidationError(f"Invalid JSON: {e}")
        
        attrs["vertices"] = vertices
        attrs["edges"] = edges
        return attrs
