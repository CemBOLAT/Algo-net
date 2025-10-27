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

edge_set = {(edge["from"], edge["to"]) : edge["weight"] for edge in edges}  # For mix euclidien 
print("Vertices:", vertices[0])
print("Edges:", edges)
print("Entries:", entries)

# entries: [
#     {'name': 'cemak', 'color': '#17fd32', 'capacity': 1, 'distance': 1, 'diameter': 1, 'size': 3}, 
#     {'name': 'hastane', 'color': '#d21919', 'capacity': 1, 'distance': 1, 'diameter': 1, 'size': 2}, 
#     {'name': 'okul', 'color': '#b319d2', 'capacity': 1, 'distance': 1, 'diameter': 1, 'size': 4}
# ]

Nodes = [v['id'] for v in vertices]
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

BuildingSize.update( {"R": 1} )
Type_colors.update({"R": "white"})

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

def build_grid_matrix(vertices, edges, walk):
    # Convert it to fully completed with floyd-warshall
    mat, id_to_idx = build_matrix(vertices, edges)

    # Finding Fly distances according to existing weights
    col_size = 1

    for index in range(len(Nodes)):
        if (Nodes[index], Nodes[index+1]) in edge_set:
            col_size += 1
        else:
            break

    print(f"col size : {col_size}")
    row, col = 0, 0

    Pos = {}
    Pos_reverse = {}

    for v in range(len(Nodes)):
        if (col == col_size):
            col = 0
            row += 1
        Pos.update( {v: (row, col)})
        #print(f"{v} pos : {row}-{col}")
        Pos_reverse.update( {(row, col) : v})
        col += 1

    # Calculating x and y axes weights to calculate euclidian with just between vertices in same street
    for outer in range(len(Nodes)):
        for inner in range(len(Nodes)):
            if (inner != outer and mat[outer, inner] == np.inf ):
                if ( walk == 1 and Pos[inner][0] - Pos[outer][0] != 1):
                    continue
                x = 0
                y = 0
                pos = Pos[inner]
                outPos = Pos[outer]
                
                if (pos[1] > outPos[1]):
                    
                    while (pos[1] != outPos[1]):
                        x += mat[Pos_reverse[pos], Pos_reverse[(pos[0], pos[1]-1)]]
                        pos = (pos[0], pos[1]-1) 
                    
                    pos = Pos[inner]
                elif ( pos[1] < outPos[1]):
                    while (pos[1] != outPos[1]):
                        x += mat[Pos_reverse[pos], Pos_reverse[(pos[0], pos[1]+1)]]
                        pos = (pos[0], pos[1]+1) 
                    
                    pos = Pos[inner]
                
                
                if (pos[0] > outPos[0]):
                    while (pos[0] != outPos[0]):
                        y += mat[Pos_reverse[pos], Pos_reverse[(pos[0]-1, pos[1])]]
                        pos = (pos[0]-1, pos[1])
                elif (pos[0] < outPos[0]):
                    while (pos[0] != outPos[0]):
                        y += mat[Pos_reverse[pos], Pos_reverse[(pos[0]+1, pos[1])]]
                        pos = (pos[0]+1, pos[1]) 
                    pos = Pos[inner]



                w = np.sqrt(np.square(x) + np.square(y)).round(2)
                #print(f"{outer}-{inner} : x={x}, y={y}, w={w}")
                mat[inner, outer] = w
                mat[outer, inner] = w

    # Applying Flloyd-Marshall algorithm with added euclidian values
    if (walk == 1):
        for k in range(mat.shape[0]):
            for i in range(mat.shape[0]):
                for j in range(mat.shape[0]):
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
                #print(f"dist-max_dist: {dist}-{max_dist}")
                if dist > max_dist:
                    max_dist = dist
        if max_dist <= max_diameter:
            valid_subgraphs.append(subgraph)
    return valid_subgraphs


def enumerate_connected_subgraphs_dp(mat, node_ids, target_sizes):
    n = len(node_ids)
    sizes_sorted = sorted(set(int(s) for s in target_sizes if s is not None))
    if not sizes_sorted:
        return {}

    # Build proper adjacency: finite and positive weights only (exclude np.inf)
    adjacency = np.isfinite(mat) & (mat > 0)
    np.fill_diagonal(adjacency, False)
    neighbors_list = [set(np.where(adjacency[i])[0]) for i in range(n)]

    # Start with all singletons
    results_idx = {1: [frozenset([i]) for i in range(n)]}
    max_k = sizes_sorted[-1]

    # Build up by size, enforcing canonical order (v > max(S)) to avoid permutations
    for k in range(2, max_k + 1):
        prev_sets = results_idx.get(k - 1, [])
        new_sets = set()
        for S in prev_sets:
            boundary = set()
            for u in S:
                boundary |= neighbors_list[u]
            boundary -= set(S)
            max_idx = max(S)
            for v in boundary:
                if v <= max_idx:
                    continue  # canonical growth to eliminate permutations
                new_S = frozenset(set(S) | {v})
                if len(new_S) == k:
                    new_sets.add(new_S)
        results_idx[k] = list(new_sets)

    idx_to_id = dict(enumerate(node_ids))
    results = {}
    for k in sizes_sorted:
        results[k] = [set(idx_to_id[i] for i in S) for S in results_idx.get(k, [])]
    return results


def check_group_vertex_validation(G, v, t):
    for u in G:
        if (grid_mat_walk[id_to_idx_walk[u], id_to_idx_walk[v]] <= Type_distances[t] ):
            return True
    
    return False


mat, id_to_idx = build_matrix(vertices, edges)
grid_mat_walk, id_to_idx_walk = build_grid_matrix(vertices, edges, 1)

grid_mat_dist, id_to_idx_dist = build_grid_matrix(vertices, edges, 0)



node_ids = list(id_to_idx.keys())

SubGraphs = {}

# Precompute DP results for all requested sizes to reuse across types
target_sizes = [entry.get('size') for entry in entries]
# Add "R" size if needed
target_sizes += [1]  # Since "R" buildings are size 1
dp_by_size = enumerate_connected_subgraphs_dp(mat, node_ids, target_sizes)

for entry in sorted(entries, key=lambda e: e.get('size', 0)):
    name = entry.get('name')
    size = entry.get('size')
    # Use precomputed connected subgraphs for this size
    subgraphs_of_size = dp_by_size.get(int(size), [])
    # Apply diameter constraint on shortest-path grid
    max_diameter = entry.get('diameter')
    valid_subgraphs = filter_valid_subgraphs(subgraphs_of_size, max_diameter, grid_mat_walk, id_to_idx)
    SubGraphs[name] = [frozenset(s) for s in valid_subgraphs]

print("SubGraphs:", SubGraphs) 

S = { (v,t) : [g for g in SubGraphs[t] if check_group_vertex_validation(g, v, t)] for v in Nodes for t in T_Without_R }


model = pulp.LpProblem("Maximize_Residences", pulp.LpMaximize)

# x_st: t türü bina s konumuna yerleştirilirse 1 olur.
container_types = []
for t in T:
    for v in Nodes:
        container_types.append((v, t))

subGraph_types = []
for t in T_Without_R:
    for g in SubGraphs[t]:
        subGraph_types.append((g, t))

x_vt = pulp.LpVariable.dicts("Conteiner type", container_types, cat='Binary')

u_gt = pulp.LpVariable.dicts("Selecting group type", subGraph_types, cat='Binary')

y_vgt = pulp.LpVariable.dicts("vertex-group assigning", Nodes, cat='Binary')  # Will be used for demand

model += pulp.lpSum(x_vt[(v, "R")] for v in Nodes), "Total_Residences"

# Constraint 1: Node Assignment Constraint
for v in Nodes:
    model += pulp.lpSum(x_vt[(v, t)] for t in T) <= 1

# Constraint 2: Rainbow Coverage

for v in Nodes:
    for t in T_Without_R:
        model += pulp.lpSum(u_gt[(g,t)] for g in S[(v,t)]) >= x_vt[(v, 'R')]
        

# Kısıt 3 size constraint
for g, t in subGraph_types:
    model += sum(x_vt[(u,t)] for u in g) == BuildingSize[t] * u_gt[(g,t)]

#print("SubGraph_types length:", len(subGraph_types))
#print(f"Subgraphs", SubGraphs)

model.solve(pulp.PULP_CBC_CMD(msg=True))

vertex_colors = {vertex['id'] : "" for vertex in vertices}

for v in Nodes:
    for t in T:
        if x_vt[v, t].value():
            vertex_colors[v] = Type_colors[t]

print("Status:", pulp.LpStatus[model.status])

def display_res():
    # Başlığı dinamik olarak T listesinden oluştur
    header = "Node  | " + " | ".join(f"{t:<6}" for t in T)
    print(header)
    print("-" * len(header))

    for v in Nodes:
        print(f"{v:<5} | ", end="")
        values = []
        for t in T:
            val = x_vt[v, t].value()
            # None yerine 0.0 göstermek daha okunaklı olur
            val_str = f"{val if val is not None else 0.0:<6.1f}"
            values.append(val_str)
        print(" | ".join(values))

display_res()


print("$$$")
print(json.dumps(vertex_colors))
