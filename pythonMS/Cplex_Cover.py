
import pulp
import json
import sys
import numpy as np
<<<<<<< HEAD

=======
>>>>>>> 7991ab8501c7a413a64a971057ab040eeef0fbdb
from docplex.mp.model import Model
from typing import Dict, Iterable, Tuple, List, Set

vertices_json = sys.argv[1]
edges_json = sys.argv[2]
entries_json = sys.argv[3] if len(sys.argv) > 3 else "[]"

vertices = json.loads(vertices_json)
edges = json.loads(edges_json)
entries = json.loads(entries_json) if entries_json else []

edge_set = {(edge["from"], edge["to"]) : edge["weight"] for edge in edges}  # For mix euclidien 
<<<<<<< HEAD
print("Vertices:", vertices[0])
print("Edges:", edges)
print("Entries:", entries)
=======
# print("Vertices:", vertices[0])
# print("Edges:", edges)
# print("Entries:", entries)
>>>>>>> 7991ab8501c7a413a64a971057ab040eeef0fbdb

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

<<<<<<< HEAD
print("Types:", T_Without_R)
print("Demands:", Capacity)
print("Type_distances:", Type_distances)
print("Type_colors:", Type_colors)
print("Type_Diameter:", Type_Diameter)
print("BuildingSize:", BuildingSize)
print("TypesWithR:", T)
=======
# print("Types:", T_Without_R)
# print("Demands:", Capacity)
# print("Type_distances:", Type_distances)
# print("Type_colors:", Type_colors)
# print("Type_Diameter:", Type_Diameter)
# print("BuildingSize:", BuildingSize)
# print("TypesWithR:", T)
>>>>>>> 7991ab8501c7a413a64a971057ab040eeef0fbdb

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

<<<<<<< HEAD
    print(f"col size : {col_size}")
=======
    #print(f"col size : {col_size}")
>>>>>>> 7991ab8501c7a413a64a971057ab040eeef0fbdb
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

<<<<<<< HEAD

=======
>>>>>>> 7991ab8501c7a413a64a971057ab040eeef0fbdb
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

<<<<<<< HEAD

=======
>>>>>>> 7991ab8501c7a413a64a971057ab040eeef0fbdb
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
<<<<<<< HEAD
        if (grid_mat_walk[id_to_idx_walk[u], id_to_idx_walk[v]] <= Type_distances[t] ):
            return True
    
=======
        if (grid_mat_walk[id_to_idx_walk[u], id_to_idx_walk[v]] <= Type_distances[t]):
            return True
>>>>>>> 7991ab8501c7a413a64a971057ab040eeef0fbdb
    return False


mat, id_to_idx = build_matrix(vertices, edges)
grid_mat_walk, id_to_idx_walk = build_grid_matrix(vertices, edges, 1)

<<<<<<< HEAD
grid_mat_dist, id_to_idx_dist = build_grid_matrix(vertices, edges, 0)

=======
#print("Adjacency Matrix:\n", mat)
#print("Grid Matrix (Walk):\n", grid_mat_walk)
>>>>>>> 7991ab8501c7a413a64a971057ab040eeef0fbdb


node_ids = list(id_to_idx.keys())

SubGraphs = {}

# Precompute DP results for all requested sizes to reuse across types
target_sizes = [entry.get('size') for entry in entries]
<<<<<<< HEAD
=======

>>>>>>> 7991ab8501c7a413a64a971057ab040eeef0fbdb
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

<<<<<<< HEAD
print("SubGraphs:", SubGraphs) 

S = { (v,t) : [g for g in SubGraphs[t] if check_group_vertex_validation(g, v, t)] for v in Nodes for t in T_Without_R }

print(f"S: {S}")
=======
#print("SubGraphs:", SubGraphs) 

S = { (v,t) : [g for g in SubGraphs[t] if check_group_vertex_validation(g, v, t)] for v in Nodes for t in T_Without_R }

#print(f"S: {S}")
>>>>>>> 7991ab8501c7a413a64a971057ab040eeef0fbdb

# x_st: t türü bina s konumuna yerleştirilirse 1 olur.
container_types = []
for t in T:
    for v in Nodes:
        container_types.append((v, t))

<<<<<<< HEAD
print(f"container types2 : {container_types}")
=======
#print(f"container types2 : {container_types}")
>>>>>>> 7991ab8501c7a413a64a971057ab040eeef0fbdb

subGraph_types = []
for t in T_Without_R:
    for g in SubGraphs[t]:
        subGraph_types.append((g, t))

#####       Model Başlangıç    ##############


def build_model(V: List[str],
                T: List[str],
                G: Dict[str, List[Tuple[str, ...]]],
                A: Dict[str, int],
                S: Dict[Tuple[str, str], List[Tuple[str, ...]]],
                non_res_types: List[str],
                r_type: str = "R",
                name: str = 'residential_ilp') -> Model:
    """
    Build the DOcplex model.

    Parameters
    ----------
    V : iterable of vertex ids (hashable, e.g. str or int)
    T : iterable of type ids (include residential type `r_type`)
    G : dict mapping type -> list of groups. Each group is represented by a tuple of vertices.
        Example: G['c'] = [("v1","v2"),("v3","v4","v5"), ...]
        Groups must be disjoint or overlapping as your instance requires.
    A : dict mapping type -> integer group size A_t (for t != r_type).
    S : dict mapping (v, t) -> list of groups (these groups must be members of G[t])
        that are within distance D_t from v. The keys are tuples (v, t). The values are
        lists of group tuples from G[t].
    r_type : label identifying residential type in T (default 'r')

    Returns
    -------
    model : docplex.mp.model.Model with variables and constraints created.
    """

    model = Model(name=name)

    # Map groups to a canonical id string so we can index variables easily
    # We'll index groups as (t, g_index) where g_index is integer index in G[t]
    G_indexed: Dict[str, List[Tuple[int, Tuple[str, ...]]]] = {}
    for t in non_res_types:
        groups = G.get(t, [])
        G_indexed[t] = list(enumerate(groups))

    # Decision variables
    x = {}  # x[v,t]
    for v in V:
        for t in T:
            x[v, t] = model.binary_var(name=f"x_{v}_{t}")

    # u[g,t] where g is indexed
    u = {}
    for t in non_res_types:
        for gi, g in G_indexed[t]:
            u[(t, gi)] = model.binary_var(name=f"u_{t}_{gi}")

    # y[v,g,t] : residential vertex v assigned to group g of type t (if needed)
    # We create y only for t in non-residential types and for groups that appear in S[(v,t)]
    y = {}
    for v in V:
        for t in non_res_types:
            # S may be missing some keys; default to empty list
            candidate_groups = S.get((v, t), [])
            if not candidate_groups:
                continue
            # For each candidate group find its index in G_indexed[t]
            # We assume group tuples are exactly the same objects used in G[t]
            # To speed up lookups build a group->index map for this t
            g_to_index = {g: gi for gi, g in G_indexed[t]}
            for g in candidate_groups:
                if g not in g_to_index:
                    raise KeyError(f"Group {g} in S[({v},{t})] not found in G[{t}].")
                gi = g_to_index[g]
                y[v, (t, gi)] = model.binary_var(name=f"y_{v}_{t}_{gi}")

    # Objective: maximize sum_{v in V} x[v, r_type]
    model.maximize(model.sum(x[v, r_type] for v in V))

    # Constraints
    # 1) Single type per vertex: sum_t x[v,t] <= 1
    for v in V:
        model.add_constraint(model.sum(x[v, t] for t in T) <= 1,
                             ctname=f"single_type_{v}")

    # 2) Neighborhood Coverage (Rainbow Constraint): for each v and each non-residential t:
    #    sum_{g in S_{v,t}} u_{g,t} >= x_{v,r}
    # We interpret S[(v,t)] as list of group tuples; we map them to indices
    for v in V:
        for t in non_res_types:
            candidate_groups = S.get((v, t), [])
            if not candidate_groups:
                # If no available groups for (v,t) then the constraint becomes 0 >= x[v,r]
                # which forces x[v,r] == 0. We add this constraint explicitly.
                model.add_constraint(0 >= x[v, r_type], ctname=f"coverage_none_{v}_{t}")
                continue
            # map groups to indices
            g_to_index = {g: gi for gi, g in G_indexed[t]}
            model.add_constraint(model.sum(u[(t, g_to_index[g])] for g in candidate_groups) >= x[v, r_type],
                                 ctname=f"rainbow_{v}_{t}")

    # 3) Group Size Consistency: for each group g in G[t] and v in g, u[g,t] <= x[v,t] 
    for t in non_res_types:
        for gi, g in G_indexed[t]:
            # g is a tuple/list of vertex ids
            for v in g:
                model.add_constraint(u[(t, gi)] <= x[v,t], ctname=f"group_size_{t},_{gi}")


    # 4) Group cross/free vertices preventing
    for t in non_res_types:
        for v in Nodes:
            model.add_constraint(x[v,t] <= model.sum(u[(t, gi)] for gi, g in G_indexed[t] if v in g))
            model.add_constraint(model.sum(u[(t, gi)] for gi, g in G_indexed[t] if v in g) <= 1)

    return model, G_indexed


model, G_indexed = build_model(Nodes, T, SubGraphs, BuildingSize, S, T_Without_R ,r_type='R')

# Optionally write LP file for CPLEX (or pass model to CPLEX solver via DOcplex)
model.export_as_lp('residential_model.lp')

# Solve (requires CPLEX/DOcplex solver available). If you have CPLEX installed and
# properly configured, you can call model.solve(). Otherwise use the local DOcplex
# heuristic or write .lp and solve with cplex command line.
try:
    sol = model.solve()
    if sol:
        print("Objective:", model.objective_value)
        for v in Nodes:
            print(v, {t: x for t, x in ((t, model.solution.get_value(f"x_{v}_{t}")) for t in T)})
        for t in T_Without_R:
            print(f"t : {t}")
            for gi , g in G_indexed[t]:
                print(g, {t: model.solution.get_value(f"u_{t}_{gi}") })
    else:
        print("No solution found by DOcplex solve()")
except Exception as e:
    print("Solve skipped or failed (no CPLEX engine available in this environment):", e)
    print("LP written to residential_model.lp")



###        Model Bitiş         ###############


vertex_colors = {vertex['id'] : "black" for vertex in vertices}

for v in Nodes:
    for t in T:
        if model.solution.get_value(f"x_{v}_{t}") > 0:
            vertex_colors[v] = Type_colors[t]

<<<<<<< HEAD


""" 
for v in Nodes:
    for t in T:
        if x_vt[v, t].value():
            vertex_colors[v] = Type_colors[t]

=======
>>>>>>> 7991ab8501c7a413a64a971057ab040eeef0fbdb
def display_res():
    # Başlığı dinamik olarak T listesinden oluştur
    header = "Node  | " + " | ".join(f"{t:<6}" for t in T)
    print(header)
    print("-" * len(header))

    for v in Nodes:
        print(f"{v:<5} | ", end="")
        values = []
        for t in T:
<<<<<<< HEAD
            val = x_vt[v, t].value()
=======
            val = model.solution.get_value(f"x_{v}_{t}")
>>>>>>> 7991ab8501c7a413a64a971057ab040eeef0fbdb
            # None yerine 0.0 göstermek daha okunaklı olur
            val_str = f"{val if val is not None else 0.0:<6.1f}"
            values.append(val_str)
        print(" | ".join(values))
<<<<<<< HEAD
  """

=======

#display_res()
>>>>>>> 7991ab8501c7a413a64a971057ab040eeef0fbdb

print("$$$")
print(json.dumps(vertex_colors))
