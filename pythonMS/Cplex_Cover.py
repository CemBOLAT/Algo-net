import pulp
import json
import sys
import numpy as np
from docplex.mp.model import Model
from typing import Dict, Iterable, Tuple, List, Set
import math
import sys

from numba import jit, njit

if len(sys.argv) < 2:
    print("Missing input file argument", file=sys.stderr)
    sys.exit(1)

with open(sys.argv[1], "r", encoding="utf-8") as f:
    data = json.load(f)

vertices = data["vertices"]
edges = data["edges"]
entries = data.get("entries", [])




""" vertices_json = sys.argv[1]
edges_json = sys.argv[2]
entries_json = sys.argv[3] if len(sys.argv) > 3 else "[]"

vertices = json.loads(vertices_json)
edges = json.loads(edges_json)
entries = json.loads(entries_json) if entries_json else []
"""
edge_set = {(edge["from"], edge["to"]) : edge["weight"] for edge in edges}  # For mix euclidien 
#print("Vertices:", vertices[0])
#print("Edges:", edges)
#print("Entries:", entries)

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

# print("Types:", T_Without_R)
# print("Demands:", Capacity)
# print("Type_distances:", Type_distances)
# print("Type_colors:", Type_colors)
# print("Type_Diameter:", Type_Diameter)
# print("BuildingSize:", BuildingSize)
# print("TypesWithR:", T)

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

    n = len(Nodes)
    # Robust grid sizing: use square-ish layout to avoid fragile sequential-edge logic
    col_size = int(math.ceil(math.sqrt(n)))
    row_count = int(math.ceil(n / col_size))

    # Build positions row-major for n nodes
    Pos = {}
    Pos_reverse = {}
    idx = 0
    for r in range(row_count):
        for c in range(col_size):
            if idx >= n:
                break
            Pos[idx] = (r, c)
            Pos_reverse[(r, c)] = idx
            idx += 1

    # Helper to check if a grid coordinate exists
    def has_pos(p):
        return p in Pos_reverse

    # Calculating x and y axes weights to calculate euclidian with just between vertices in same street
    for outer in range(n):
        for inner in range(n):
            if inner == outer or mat[outer, inner] != np.inf:
                continue

            # If walk==1 only consider vertical-adjacent rows (?) original logic tried to filter — keep similar check
            if walk == 1 and (Pos[inner][0] - Pos[outer][0] != 1) and (Pos[inner][0] != Pos[outer][0]):
                # if not in same row or next row, skip trying euclidean fill
                continue

            x = 0.0
            y = 0.0
            pos = Pos[inner]
            outPos = Pos[outer]

            aborted = False

            # move horizontally from inner towards outer
            while pos[1] != outPos[1]:
                # determine next column step
                step = -1 if pos[1] > outPos[1] else 1
                next_pos = (pos[0], pos[1] + step)
                if not has_pos(pos) or not has_pos(next_pos):
                    aborted = True
                    break
                x += mat[Pos_reverse[pos], Pos_reverse[next_pos]]
                pos = next_pos

            if aborted:
                continue

            # reset to original inner for vertical computation
            pos = Pos[inner]
            # move vertically from inner towards outer
            while pos[0] != outPos[0]:
                step = -1 if pos[0] > outPos[0] else 1
                next_pos = (pos[0] + step, pos[1])
                if not has_pos(pos) or not has_pos(next_pos):
                    aborted = True
                    break
                y += mat[Pos_reverse[pos], Pos_reverse[next_pos]]
                pos = next_pos

            if aborted:
                continue

            w = float(np.sqrt(x * x + y * y).round(2))
            mat[inner, outer] = w
            mat[outer, inner] = w

    # Applying Floyd-Warshall algorithm with added euclidian values if requested
    if walk == 1:
        for k in range(mat.shape[0]):
            for i in range(mat.shape[0]):
                for j in range(mat.shape[0]):
                    if mat[i, k] + mat[k, j] < mat[i, j]:
                        mat[i, j] = mat[i, k] + mat[k, j]

    return mat, id_to_idx

#Define a function that takes all subgraphs for that size and type and returns the valid ones according to diameter constraints
# numba olabilir
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

@njit
def filter_valid_subgraphs_numba(subgraphs, max_diameter, grid_mat):
    """
    Numba-optimized version of filter_valid_subgraphs.
    subgraphs: list of np.array node indices (integers)
    grid_mat: numpy 2D array of distances
    """
    valid_mask = np.zeros(len(subgraphs), dtype=np.bool_)
    for i in range(len(subgraphs)):
        sg = subgraphs[i]
        max_dist = 0.0
        for a in range(len(sg)):
            for b in range(a + 1, len(sg)):
                dist = grid_mat[sg[a], sg[b]]
                if dist > max_dist:
                    max_dist = dist
                if max_dist > max_diameter:
                    break
            if max_dist > max_diameter:
                break
        if max_dist <= max_diameter:
            valid_mask[i] = True
    return valid_mask


class ConnectedSubgraphDPCache:
    """
    Cache connected induced subgraphs by size for a given adjacency matrix.
    Uses canonical growth (only add vertices with index > max(S)) to avoid duplicates.
    Subsequent requests for larger sizes extend previous results instead of recomputing from scratch.
    """
    def __init__(self, mat: np.ndarray, node_ids: List[str]):
        # Build adjacency boolean from mat
        adjacency = np.isfinite(mat) & (mat > 0)
        np.fill_diagonal(adjacency, False)
        self.neighbors_list = [set(np.where(adjacency[i])[0]) for i in range(adjacency.shape[0])]
        self.n = len(node_ids)
        self.node_ids = node_ids
        # results_idx[size] -> list of frozenset(indices)
        self.results_idx = {1: [frozenset([i]) for i in range(self.n)]}
        self.max_computed = 1

    def _extend_to(self, k: int):
        if k <= self.max_computed:
            return
        for size in range(self.max_computed + 1, k + 1):
            prev_sets = self.results_idx.get(size - 1, [])
            new_sets = set()
            for S in prev_sets:
                boundary = set()
                for u in S:
                    boundary |= self.neighbors_list[u]
                boundary -= set(S)
                max_idx = max(S)
                for v in boundary:
                    if v <= max_idx:
                        continue
                    new_S = frozenset(set(S) | {v})
                    if len(new_S) == size:
                        new_sets.add(new_S)
            self.results_idx[size] = list(new_sets)
        self.max_computed = k

    def get_sizes(self, target_sizes: Iterable[int]) -> Dict[int, List[Set[str]]]:
        sizes = sorted({int(s) for s in target_sizes if s is not None})
        if not sizes:
            return {}
        max_k = sizes[-1]
        self._extend_to(max_k)
        idx_to_id = dict(enumerate(self.node_ids))
        results = {}
        for k in sizes:
            results[k] = [set(idx_to_id[i] for i in S) for S in self.results_idx.get(k, [])]
        return results


def check_group_vertex_validation(G, v, t):
    for u in G:
        if (grid_mat_walk[id_to_idx_walk[u], id_to_idx_walk[v]] <= Type_distances[t]):
            return True
    return False


mat, id_to_idx = build_matrix(vertices, edges)
grid_mat_walk, id_to_idx_walk = build_grid_matrix(vertices, edges, 1)

#print("Adjacency Matrix:\n", mat)
#print("Grid Matrix (Walk):\n", grid_mat_walk)


node_ids = list(id_to_idx.keys())

SubGraphs = {}
id_to_idx_np = {node_id: i for node_id, i in id_to_idx.items()}

# Precompute DP results for all requested sizes to reuse across types
target_sizes = [entry.get('size') for entry in entries]
# Add "R" size if needed
target_sizes += [1]  # Since "R" buildings are size 1

# Use cached incremental DP enumerator instead of recomputing per-type
dp_cache = ConnectedSubgraphDPCache(mat, node_ids)
dp_by_size = dp_cache.get_sizes(target_sizes)

for entry in sorted(entries, key=lambda e: e.get('size', 0)):
    name = entry.get('name')
    size = entry.get('size')
    # Use precomputed connected subgraphs for this size
    subgraphs_of_size = dp_by_size.get(int(size), [])
    # Apply diameter constraint on shortest-path grid
    max_diameter = entry.get('diameter')

    # Convert subgraphs from sets of IDs → arrays of integer indices
    subgraphs_np = [np.array([id_to_idx_np[n] for n in sg], dtype=np.int32)
                    for sg in subgraphs_of_size]

    # Call numba JIT function
    valid_mask = filter_valid_subgraphs_numba(subgraphs_np, max_diameter, grid_mat_walk)

    # Convert back to original node ID sets
    valid_subgraphs = [
        subgraphs_of_size[i]
        for i in range(len(subgraphs_of_size))
        if valid_mask[i]
    ]
    
    #valid_subgraphs = filter_valid_subgraphs(subgraphs_of_size, max_diameter, grid_mat_walk, id_to_idx)
    SubGraphs[name] = [frozenset(s) for s in valid_subgraphs]

#print("SubGraphs:", SubGraphs) 
# length of SubGraphs equal to number of types
print(f"length of SubGraphs: {len(SubGraphs)}")
for t in SubGraphs:
    print(f"length of SubGraphs[{t}]: {len(SubGraphs[t])}")
    # for g in SubGraphs[t]:
    #     print(f"  SubGraph: {g}")
    print("-----------------------------")

S = { (v,t) : [g for g in SubGraphs[t] if check_group_vertex_validation(g, v, t)] for v in Nodes for t in T_Without_R }

# No problem on S v_t it properly gooes for number of vertices times types.
#print(f"S length: {len(S)}") 
# for key in S:
#     print(f"S[{key}]: {S[key]}")

# x_st: t türü bina s konumuna yerleştirilirse 1 olur.
container_types = []
for t in T:
    for v in Nodes:
        container_types.append((v, t))

#print(f"container types2 : {container_types}")

subGraph_types = []
for t in T_Without_R:
    for g in SubGraphs[t]:
        subGraph_types.append((g, t))

#####       Model Başlangıç    ##############


def add_rainbow_coverage_constraints(
    model: Model,
    x: dict,
    u: dict,
    V: list[str],
    S: dict[tuple[str, str], list[tuple[str, ...]]],
    G_indexed: dict[str, list[tuple[int, tuple[str, ...]]]],
    non_res_types: list[str],
    r_type: str = "R"
):
    """
    Efficiently adds rainbow coverage constraints:
        sum(u[t, g]) >= x[v, r_type]
    for each (v, t) combination that has valid candidate groups in S.

    If S[(v, t)] is empty → adds 0 >= x[v, r_type].
    """

    # --- 1. Preindex for fast access ---
    v_to_idx = {v: i for i, v in enumerate(V)}
    t_to_idx = {t: i for i, t in enumerate(non_res_types)}

    # Flatten G[t] to frozenset->index mapping
    G_idx_flat = {
        t: {frozenset(g): gi for gi, g in G_indexed[t]}
        for t in non_res_types
    }

    # --- 2. Build numeric mask for valid (v,t) pairs using numba ---
    @njit
    def build_candidate_mask(v_size, t_size, S_keys_v, S_keys_t, S_values_len):
        mask = np.zeros((v_size, t_size), dtype=np.bool_)
        for i in range(len(S_keys_v)):
            v_idx = S_keys_v[i]
            t_idx = S_keys_t[i]
            if S_values_len[i] > 0:
                mask[v_idx, t_idx] = True
        return mask

    # Prepare S arrays for numba
    S_keys_v, S_keys_t, S_values_len = [], [], []
    for (v, t), groups in S.items():
        if v in v_to_idx and t in t_to_idx:
            S_keys_v.append(v_to_idx[v])
            S_keys_t.append(t_to_idx[t])
            S_values_len.append(len(groups))

    if S_keys_v:
        S_mask = build_candidate_mask(
            len(V),
            len(non_res_types),
            np.array(S_keys_v, dtype=np.int32),
            np.array(S_keys_t, dtype=np.int32),
            np.array(S_values_len, dtype=np.int32),
        )
    else:
        S_mask = np.zeros((len(V), len(non_res_types)), dtype=np.bool_)

    # --- 3. Build constraints efficiently ---
    for vi, v in enumerate(V):
        for ti, t in enumerate(non_res_types):
            # Quick skip if no candidate groups
            if not S_mask[vi, ti]:
                model.add_constraint(0 >= x[v, r_type], ctname=f"coverage_none_{v}_{t}")
                continue

            candidate_groups = S.get((v, t), [])
            if not candidate_groups:
                model.add_constraint(0 >= x[v, r_type], ctname=f"coverage_none_{v}_{t}")
                continue

            g_to_index = G_idx_flat[t]

            valid_terms = []
            for g in candidate_groups:
                fsg = frozenset(g)
                if fsg in g_to_index:
                    valid_terms.append(u[(t, g_to_index[fsg])])

            if valid_terms:
                model.add_constraint(
                    model.sum(valid_terms) >= x[v, r_type],
                    ctname=f"rainbow_{v}_{t}"
                )
            else:
                model.add_constraint(0 >= x[v, r_type], ctname=f"coverage_none_{v}_{t}")


def add_group_size_constraints(model, x, u, G_indexed, non_res_types):
    """
    Efficiently adds u[t,gi] <= x[v,t] constraints for each v in group g.
    """
    # --- Preindex groups numerically ---
    t_to_idx = {t: i for i, t in enumerate(non_res_types)}

    # Flatten all group relationships into arrays for optional numba filtering
    group_t_idx = []
    group_gi = []
    group_member_idx = []
    group_member_v = []

    v_to_idx = {}
    idx_to_v = []
    next_vid = 0

    # Build numeric indices for vertices (to avoid string lookup inside loop)
    for t in non_res_types:
        for gi, g in G_indexed[t]:
            for v in g:
                if v not in v_to_idx:
                    v_to_idx[v] = next_vid
                    idx_to_v.append(v)
                    next_vid += 1
                group_t_idx.append(t_to_idx[t])
                group_gi.append(gi)
                group_member_idx.append(v_to_idx[v])
                group_member_v.append(v)

    group_t_idx = np.array(group_t_idx, dtype=np.int32)
    group_gi = np.array(group_gi, dtype=np.int32)
    group_member_idx = np.array(group_member_idx, dtype=np.int32)

    # --- Optional numba prefiltering (purely for speed) ---
    @njit
    def build_valid_mask(t_idx, gi_idx, v_idx):
        # Placeholder in case you later want to filter invalid combinations
        return np.ones(len(t_idx), dtype=np.bool_)

    valid_mask = build_valid_mask(group_t_idx, group_gi, group_member_idx)

    # --- Efficient constraint addition loop ---
    for i in range(len(valid_mask)):
        if not valid_mask[i]:
            continue
        t = non_res_types[group_t_idx[i]]
        gi = int(group_gi[i])
        v = group_member_v[i]
        model.add_constraint(u[(t, gi)] <= x[v, t], ctname=f"group_size_{t}_{gi}_{v}")


def add_group_cross_constraints(model, x, u, Nodes, G_indexed, non_res_types):
    """
    For each vertex v and type t:
        - x[v,t] <= sum(u[t,gi] for gi where v in group gi)
        - sum(u[t,gi] for gi where v in group gi) <= 1
    Ensures group membership consistency and uniqueness.
    """

    # Precompute group membership per vertex for faster lookup
    v_in_groups = {v: {} for v in Nodes}  # v_in_groups[v][t] = list of gi
    for t in non_res_types:
        for gi, g in G_indexed[t]:
            for v in g:
                v_in_groups[v].setdefault(t, []).append(gi)

    # Add constraints
    for v in Nodes:
        for t in non_res_types:
            gis = v_in_groups[v].get(t, [])
            if not gis:
                # If vertex v is not in any group of type t, enforce x[v,t] = 0
                model.add_constraint(x[v, t] == 0, ctname=f"x_zero_{v}_{t}")
                continue

            model.add_constraint(
                x[v, t] <= model.sum(u[(t, gi)] for gi in gis),
                ctname=f"x_le_sum_u_{v}_{t}"
            )

            model.add_constraint(
                model.sum(u[(t, gi)] for gi in gis) <= 1,
                ctname=f"sum_u_le_1_{v}_{t}"
            )



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
    add_rainbow_coverage_constraints(
        model=model,
        x=x,
        u=u,
        V=V,
        S=S,
        G_indexed=G_indexed,
        non_res_types=non_res_types,
        r_type=r_type
    )

    # 3) Group Size Consistency: for each group g in G[t] and v in g, u[g,t] <= x[v,t] 
    add_group_size_constraints(
        model,
        x,
        u,
        G_indexed,
        non_res_types
    )

    # 4) Group cross/free vertices preventing
    add_group_cross_constraints(model,
                                x,
                                u, 
                                Nodes, 
                                G_indexed, 
                                non_res_types)
    return model, G_indexed


model, G_indexed = build_model(Nodes, T, SubGraphs, BuildingSize, S, T_Without_R ,r_type='R')

# # Optionally write LP file for CPLEX (or pass model to CPLEX solver via DOcplex)
# model.export_as_lp('residential_model.lp')

# # Solve (requires CPLEX/DOcplex solver available). If you have CPLEX installed and
# # properly configured, you can call model.solve(). Otherwise use the local DOcplex
# # heuristic or write .lp and solve with cplex command line.
""" try:
    #sol = model.solve()
#     if sol:
#         print("Objective:", model.objective_value)
#         for v in Nodes:
#             print(v, {t: x for t, x in ((t, model.solution.get_value(f"x_{v}_{t}")) for t in T)})
#         for t in T_Without_R:
#             print(f"t : {t}")
#             for gi , g in G_indexed[t]:
#                 print(g, {t: model.solution.get_value(f"u_{t}_{gi}") })
#     else:
#         print("No solution found by DOcplex solve()")
except Exception as e:
    print("Solve skipped or failed (no CPLEX engine available in this environment):", e)
    print("LP written to residential_model.lp") """



###        Model Bitiş         ###############


vertex_colors = {vertex['id'] : "black" for vertex in vertices}

""" for v in Nodes:
    for t in T:
        if model.solution.get_value(f"x_{v}_{t}") > 0:
            vertex_colors[v] = Type_colors[t] """

# def display_res():
#     # Başlığı dinamik olarak T listesinden oluştur
#     header = "Node  | " + " | ".join(f"{t:<6}" for t in T)
#     print(header)
#     print("-" * len(header))

#     for v in Nodes:
#         print(f"{v:<5} | ", end="")
#         values = []
#         for t in T:
#             val = model.solution.get_value(f"x_{v}_{t}")
#             # None yerine 0.0 göstermek daha okunaklı olur
#             val_str = f"{val if val is not None else 0.0:<6.1f}"
#             values.append(val_str)
#         print(" | ".join(values))

#display_res()
print("Model eğitimi olmadan bitti")
print("$$$")
print(json.dumps(vertex_colors))
