import pulp
import json
import sys
import numpy as np
import math

vertices_json = sys.argv[1]
edges_json = sys.argv[2]
entries_json = sys.argv[3] if len(sys.argv) > 3 else "[]"

vertices = json.loads(vertices_json)
edges = json.loads(edges_json)
entries = json.loads(entries_json) if entries_json else []

print("Vertices:", vertices[0])
print("Edges:", edges)
print("Entries:", entries)

# entries: [
#     {'name': 'cemak', 'color': '#17fd32', 'capacity': 1, 'distance': 1, 'diameter': 1}, 
#     {'name': 'hastane', 'color': '#d21919', 'capacity': 1, 'distance': 1, 'diameter': 1}, 
#     {'name': 'okul', 'color': '#b319d2', 'capacity': 1, 'distance': 1, 'diameter': 1}
# ]

T_Without_R = [ entry['name'] for entry in entries ]
DistanceLimit = { entry['name'] : entry['capacity'] for entry in entries }
Type_distances = { entry['name'] : entry['distance'] for entry in entries }
Type_colors = { entry['name'] : entry['color'] for entry in entries }
BuildingSize = { entry['name'] : entry['size'] for entry in entries }
T = T_Without_R + ["R"]

print("Types:", T_Without_R)
print("Demands:", DistanceLimit)
print("Type_distances:", Type_distances)
print("Type_colors:", Type_colors)
print("BuildingSize:", BuildingSize)
print("TypesWithR:", T)

def build_matrix(vertices, edges):

    ids = [v['id'] for v in vertices]
    id_to_idx = {v_id: i for i, v_id in enumerate(ids)}

    n = len(ids)
    mat = np.zeros((n, n), dtype=int)

    for e in edges:
        i, j = id_to_idx[e['from']], id_to_idx[e['to']]
        mat[i, j] = e.get('weight')
        if not e.get('directed', False):
            mat[j, i] = e.get('weight')

    return mat, id_to_idx

def enumerate_connected_subgraphs_matrix(mat, node_ids, x):

    n = len(node_ids)

    def neighbors(idx):
        """Return indices of neighbors of node idx"""
        return set(np.where(mat[idx] > 0)[0])

    def backtrack(root, S, ext):
        if len(S) == x:
            yield {node_ids[i] for i in S}
            return

        for v in list(ext):
            S.add(v)
            new_ext = (ext - {v}) | {w for w in neighbors(v) if w not in S and w > root}
            yield from backtrack(root, S, new_ext)
            S.remove(v)
            ext.remove(v)

    for u in range(n):
        S = {u}
        ext = {w for w in neighbors(u) if w > u}
        yield from backtrack(u, S, ext)

def build_grid_matrix(vertices, edges):
    # Right Now build same as build_matrix but with a differences. Here you will you euclidean distance between nodes as weights. So we will calculate distance between nodes based on paths weight

    Nodes = [vertex["id"] for vertex in vertices]
    Weights = { id : { id : 0 for id in Nodes} for id in Nodes}

    for edge in edges:
        Weights[edge['from']][edge['to']] = edge['weight']
        Weights[edge['to']][edge['from']] = edge['weight']

    # Applying Floyd-Warshall algorithm for missing edges and their weights
    for outer in Nodes:
        for inner in Nodes:
            if outer != inner and Weights[outer][inner] == 0:
                Weights[outer][inner] = np.inf
    for k in Nodes:
        for outer in Nodes:
            for inner in Nodes:
                if Weights[outer][inner] > Weights[outer][k] + Weights[k][inner]:
                    Weights[outer][inner] = Weights[outer][k] + Weights[k][inner]
    n = len(Nodes)
    mat = np.zeros((n, n), dtype=int)
    id_to_idx = {v_id: i for i, v_id in enumerate(Nodes)}
    for i in range(n):
        for j in range(n):
            mat[i, j] = Weights[Nodes[i]][Nodes[j]]
    return mat, id_to_idx
    

mat, id_to_idx = build_matrix(vertices, edges)

node_ids = list(id_to_idx.keys())

sub_graph = {}

for entry in entries:
    name = entry['name']
    size = entry.get('size')
    subgraphs_of_size = list(enumerate_connected_subgraphs_matrix(mat, node_ids, x=size))
    sub_graph[name] = subgraphs_of_size

for name, subgraphs in sub_graph.items():
    print(f"Subgraphs for {name}:", subgraphs)


vertex_colors = {vertex['id'] : "" for vertex in vertices}
Nodes = [vertex['id'] for vertex in vertices]
Types = T_Without_R

for v in Nodes:
    for t in Types:
        for subg in sub_graph[t]:
            if v in subg and vertex_colors[v] == "":
                vertex_colors[v] = Type_colors[t]
                break

print("$$$")
print(json.dumps(vertex_colors))
