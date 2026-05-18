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
    k = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        try:
            vertices = json.loads(attrs["Vertices"])
            edges = json.loads(attrs["Edges"])
        except (TypeError, ValueError) as e:
            raise serializers.ValidationError(f"Invalid JSON: {e}")
        
        attrs["vertices"] = vertices
        attrs["edges"] = edges
        k_raw = attrs.get("k")
        if k_raw not in (None, ""):
            try:
                k_value = int(k_raw)
            except (TypeError, ValueError) as e:
                raise serializers.ValidationError(f"Invalid k value: {e}")
            if k_value < 1:
                raise serializers.ValidationError("k must be a positive integer")
            attrs["k"] = k_value
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

class LayoutPlanningSerializer(serializers.Serializer):
    selectedAlgo = serializers.CharField(required=False)
    Vertices = serializers.CharField(required=True)
    Edges = serializers.CharField(required=True)
    entries = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    def validate(self, attrs):
        try:
            vertices = json.loads(attrs["Vertices"])
            edges = json.loads(attrs["Edges"])
            entries_raw = attrs.get("entries")
            entries = json.loads(entries_raw) if entries_raw else []
        except (TypeError, ValueError) as e:
            raise serializers.ValidationError(f"Invalid JSON: {e}")

        attrs["vertices"] = vertices
        attrs["edges"] = edges
        attrs["entries"] = entries if isinstance(entries, list) else []
        return attrs
