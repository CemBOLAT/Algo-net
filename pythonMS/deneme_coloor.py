import json
import sys
import random

# If run via Django / ProcessBuilder with CLI args

vertices_json = sys.argv[1]
edges_json = sys.argv[2]
entrys_json = sys.argv[3] if len(sys.argv) > 3 else "[]"

vertices = json.loads(vertices_json)
edges = json.loads(edges_json)
entries = json.loads(entrys_json)

print("Vertices:", vertices[0])
print("Edges:", edges)
print("Entries:", entries)

# Define a list of colors to assign
colors_list = ["red", "blue", "green", "yellow", "purple", "orange"]

# Assign a random color to each vertex
vertex_colors = {}
for vertex in vertices:
    id = vertex.get("id")
    vertex_colors[id] = random.choice(colors_list)


#print(f"vertex_colors : {vertex_colors}")
# Print JSON to stdout so Django can capture it
print(json.dumps(vertex_colors))
