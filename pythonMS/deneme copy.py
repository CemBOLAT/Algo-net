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
#     {'name': 'cemak', 'color': '#17fd32', 'capacity': 1, 'distance': 1, 'diameter': 1, 'size': 3}, 
#     {'name': 'hastane', 'color': '#d21919', 'capacity': 1, 'distance': 1, 'diameter': 1, 'size': 2}, 
#     {'name': 'okul', 'color': '#b319d2', 'capacity': 1, 'distance': 1, 'diameter': 1, 'size': 4}
# ]

T_Without_R = [ entry['name'] for entry in entries ]
Capacity = { entry['name'] : entry['capacity'] for entry in entries }
Type_distances = { entry['name'] : entry['distance'] for entry in entries }
Type_colors = { entry['name'] : entry['color'] for entry in entries }
Type_Diameter = { entry['name'] : entry['diameter'] for entry in entries }
BuildingSize = { entry['name'] : entry['size'] for entry in entries }
T = T_Without_R + ["R"]

print("Types:", T_Without_R)
print("Demands:", Capacity)
print("Type_distances:", Type_distances)
print("Type_colors:", Type_colors)
print("Type_Diameter:", Type_Diameter)
print("BuildingSize:", BuildingSize)
print("TypesWithR:", T)


def build_matrix(vertices, edges):
    """
    Build an adjacency matrix (numpy array) from vertex and edge lists.
    Returns (matrix, index_map)
    """
    ids = [v['id'] for v in vertices]
    id_to_idx = {v_id: i for i, v_id in enumerate(ids)}

    n = len(ids)
    mat = np.full((n, n), np.inf, dtype=float)
    np.fill_diagonal(mat, 0)
    
    for e in edges:
        i, j = id_to_idx[e['from']], id_to_idx[e['to']]
        mat[i, j] = e.get('weight', 1)
        if not e.get('directed', False):
            mat[j, i] = e.get('weight', 1)

    return mat, id_to_idx

def enumerate_connected_subgraphs_matrix(mat, node_ids, x):
    """
    Enumerate all connected induced subgraphs of size x using adjacency matrix.
    mat: np.ndarray (n x n)
    node_ids: list of node labels (e.g. ['A','B','C',...])
    """
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

def enumerate_connected_subgraphs_dp(mat, node_ids, target_sizes):
    n = len(node_ids)
    sizes_sorted = sorted(set(int(s) for s in target_sizes if s is not None))
    if not sizes_sorted:
        return {}

    neighbors_list = [set(np.where(mat[i] > 0)[0]) for i in range(n)]
    results_idx = {1: [frozenset([i]) for i in range(n)]}
    max_k = sizes_sorted[-1]

    for k in range(2, max_k + 1):
        prev_sets = results_idx.get(k - 1, [])
        new_sets = set()
        for S in prev_sets:
            boundary = set()
            for u in S:
                boundary |= neighbors_list[u]
            boundary -= set(S)
            for v in boundary:
                new_S = frozenset(set(S) | {v})
                if len(new_S) == k:
                    new_sets.add(new_S)
        results_idx[k] = list(new_sets)

    idx_to_id = dict(enumerate(node_ids))
    results = {}
    for k in sizes_sorted:
        results[k] = [set(idx_to_id[i] for i in S) for S in results_idx.get(k, [])]
    return results

def build_grid_matrix(vertices, edges):
    # Convert it to fully completed with floyd-warshall
    mat, id_to_idx = build_matrix(vertices, edges)
    n = mat.shape[0]
    for k in range(n):
        for i in range(n):
            for j in range(n):
                if mat[i, j] > mat[i, k] + mat[k, j]:
                    mat[i, j] = mat[i, k] + mat[k, j]
    return mat, id_to_idx

#Define a function that takes all subgraphs for that size and type and returns the valid ones according to diameter constraints
def filter_valid_subgraphs(subgraphs, max_diameter, grid_mat, id_to_idx):
    valid_subgraphs = []
    for subgraph in subgraphs:
        indices = [id_to_idx[node_id] for node_id in subgraph]
        max_dist = 0
        for i in range(len(indices)):
            for j in range(i + 1, len(indices)):
                dist = grid_mat[indices[i], indices[j]]
                print(f"dist-max_dist: {dist}-{max_dist}")
                if dist > max_dist:
                    max_dist = dist
        if max_dist <= max_diameter:
            valid_subgraphs.append(subgraph)
    return valid_subgraphs


mat, id_to_idx = build_matrix(vertices, edges)
grid_mat, id_to_idx = build_grid_matrix(vertices, edges)

node_ids = list(id_to_idx.keys())

SubGraphs = {}

for entry in entries:
    name = entry.get('name')
    size = entry.get('size')
    # print("Finding subgraphs for", name, "with size:", size)
    subgraphs_of_size = list(enumerate_connected_subgraphs_matrix(mat, node_ids, x=size))
    # print(f"Total subgraphs of size {size} for {name}:", len(subgraphs_of_size))

    # Now filter by diameter
    max_diameter = entry.get('diameter')
    #print(f"Filtering subgraphs for {name} with max diameter:", max_diameter)
    valid_subgraphs = filter_valid_subgraphs(subgraphs_of_size, max_diameter, grid_mat, id_to_idx)
    SubGraphs[name] = [frozenset(s) for s in valid_subgraphs]   
    #print(f"Valid subgraphs for {name} after diameter filter:", len(valid_subgraphs))

for name, subgraphs in SubGraphs.items():
    print(f"Subgraphs for {name}:", subgraphs)
 
Nodes = [v['id'] for v in vertices]

model = pulp.LpProblem("Maximize_Residences", pulp.LpMaximize)

# x_st: t türü bina s konumuna yerleştirilirse 1 olur.
building_vars = []
for t in T_Without_R:
    for s in SubGraphs[t]:
        building_vars.append((t, s))
        
x_st = pulp.LpVariable.dicts("type_t_pos_s_its1", building_vars, cat='Binary')

y_j = pulp.LpVariable.dicts("if_residential_its1", Nodes, cat='Binary')

model += pulp.lpSum(y_j[j] for j in Nodes), "Total_Residences"

# Constraint 1: Node Assignment Constraint
for j in Nodes:
    model += pulp.lpSum(x_st[(t, s)] for t, s in building_vars if j in s) + y_j[j] <= 1

# Kısıt 2: Kapsama Kısıtı (Rainbow Coverage)

vertex_colors = {vertex['id'] : "" for vertex in vertices}

for v in Nodes:
    for t in T_Without_R:
        # Use solved value
        vertex_colors[v] = Type_colors[t]

print("$$$")
print(json.dumps(vertex_colors))
