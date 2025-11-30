import sys
import json
import math
import time
import numpy as np
from docplex.mp.model import Model
from numba import njit, prange, uint64, int32, int64

# ==============================================================================
# PART 1: NUMBA-OPTIMIZED SOLVER ENGINE (Limitless & Fast)
# Source: Adapted from samu.py logic
# ==============================================================================

@njit(inline='always')
def set_bit(blocks, idx):
    """Sets the bit at idx in the bitset blocks."""
    blocks[idx >> 6] |= (uint64(1) << uint64(idx & 63))

@njit(inline='always')
def get_set_bits(blocks, num_blocks, out_buf):
    """Extracts indices of set bits into out_buf."""
    cnt = 0
    for i in range(num_blocks):
        blk = blocks[i]
        if blk == 0: continue
        base = i * 64
        for b in range(64):
            if (blk >> uint64(b)) & 1:
                out_buf[cnt] = base + b
                cnt += 1
    return cnt

@njit
def check_diameter_numba(path, k, grid_mat, max_dia):
    """
    Checks if the subgraph (path) satisfies diameter constraint using 
    pre-computed grid distances.
    """
    for i in range(k):
        for j in range(i + 1, k):
            dist = grid_mat[path[i], path[j]]
            if dist > max_dia:
                return False
    return True

@njit
def _recurse_find(
    k, max_dia, curr_len, 
    path, extension, forbidden, 
    adj_bits, grid_mat, num_blocks, num_nodes,
    res_buf, res_ptr, max_cap, store_data
):
    """
    Recursive Backtracking to find connected induced subgraphs.
    """
    # Base Case: Target size reached
    if curr_len == k:
        if check_diameter_numba(path, k, grid_mat, max_dia):
            idx = res_ptr[0]
            # Increment atomic counter (simulated via pointer array)
            res_ptr[0] += 1
            
            # Pass 2 Logic: Store data if enabled and space exists
            if store_data and idx < max_cap:
                for i in range(k):
                    res_buf[idx, i] = path[i]
        return

    # Generate Candidates
    ext_list = np.zeros(num_nodes, dtype=np.int32)
    ext_cnt = get_set_bits(extension, num_blocks, ext_list)

    for i in range(ext_cnt):
        w = ext_list[i]
        
        # Prepare next step structures
        new_path = path.copy()
        new_path[curr_len] = w
        
        new_forbidden = forbidden.copy()
        set_bit(new_forbidden, w)
        
        new_ext = np.zeros(num_blocks, dtype=np.uint64)
        
        # Add remaining current extensions
        for j in range(i + 1, ext_cnt): 
            set_bit(new_ext, ext_list[j])
        
        # Add valid neighbors of w
        for b in range(num_blocks): 
            new_ext[b] |= (adj_bits[w, b] & (~new_forbidden[b]))

        _recurse_find(
            k, max_dia, curr_len + 1,
            new_path, new_ext, new_forbidden,
            adj_bits, grid_mat, num_blocks, num_nodes,
            res_buf, res_ptr, max_cap, store_data
        )
        
        # Backtrack: mask w in forbidden for current level
        set_bit(forbidden, w)

@njit(parallel=True)
def run_solver_parallel(
    adj_bits, grid_mat, num_blocks, num_nodes,
    target_size, max_dia,
    res_buf, res_ptr, max_cap, store_data
):
    """
    Parallel wrapper. Note: When store_data=True, simple parallel writes to 
    shared res_buf can be unsafe without atomics.
    However, for 'Counting' (Pass 1), parallel is safe if we sum thread results 
    (here simplified to shared ptr for speed, assuming atomic add is handled or acceptable collision risk).
    For 'Storing' (Pass 2), we use the serial wrapper below to guarantee data integrity.
    """
    for start_node in prange(num_nodes):
        path = np.zeros(target_size, dtype=np.int32)
        path[0] = start_node
        
        forbidden = np.zeros(num_blocks, dtype=np.uint64)
        for i in range(start_node + 1): 
            set_bit(forbidden, i)
            
        extension = np.zeros(num_blocks, dtype=np.uint64)
        for b in range(num_blocks): 
            extension[b] = adj_bits[start_node, b] & (~forbidden[b])

        _recurse_find(
            target_size, max_dia, 1,
            path, extension, forbidden,
            adj_bits, grid_mat, num_blocks, num_nodes,
            res_buf, res_ptr, max_cap, store_data
        )

@njit
def run_solver_serial(
    adj_bits, grid_mat, num_blocks, num_nodes,
    target_size, max_dia,
    res_buf, res_ptr, max_cap, store_data
):
    """Serial wrapper for safe data storage."""
    for start_node in range(num_nodes):
        path = np.zeros(target_size, dtype=np.int32)
        path[0] = start_node
        forbidden = np.zeros(num_blocks, dtype=np.uint64)
        for i in range(start_node + 1): set_bit(forbidden, i)
        extension = np.zeros(num_blocks, dtype=np.uint64)
        for b in range(num_blocks): extension[b] = adj_bits[start_node, b] & (~forbidden[b])

        _recurse_find(
            target_size, max_dia, 1,
            path, extension, forbidden,
            adj_bits, grid_mat, num_blocks, num_nodes,
            res_buf, res_ptr, max_cap, store_data
        )

# ==============================================================================
# PART 2: TWO-PASS MANAGER (Limitless Logic)
# ==============================================================================

def get_limitless_subgraphs(adj_bits, grid_mat, num_blocks, num_nodes, size, max_dia):
    # --- Pass 1: Count (Parallel for speed) ---
    # We use a dummy buffer and just count.
    dummy_buf = np.zeros((1, size), dtype=np.int32)
    ptr_count = np.zeros(1, dtype=np.int64)
    
    # Run counting (Parallel allows faster space exploration)
    # Using serial here to match store safety logic, but could be parallel if just counting
    run_solver_serial(
        adj_bits, grid_mat, num_blocks, num_nodes,
        size, max_dia, 
        dummy_buf, ptr_count, 0, False # store_data=False
    )
    
    total_count = ptr_count[0]
    
    if total_count == 0:
        return []

    # --- Pass 2: Store (Limitless Allocation) ---
    # Exact allocation based on Pass 1 count
    final_buf = np.zeros((total_count, size), dtype=np.int32)
    ptr_store = np.zeros(1, dtype=np.int64)
    
    # Run storage (Serial to ensure safe buffer writing)
    run_solver_serial(
        adj_bits, grid_mat, num_blocks, num_nodes,
        size, max_dia, 
        final_buf, ptr_store, total_count, True # store_data=True
    )
    
    return final_buf

# ==============================================================================
# PART 3: DATA PREPARATION & MATRIX BUILDERS
# Source: Adapted from Cplex_Cover_Demand.py
# ==============================================================================

def prepare_optimized_graph(node_ids, edges):
    """Degeneracy ordering + Bitset Adjacency creation."""
    num_nodes = len(node_ids)
    id_to_idx = {nid: i for i, nid in enumerate(node_ids)}
    
    adj_temp = [[] for _ in range(num_nodes)]
    for e in edges:
        u, v = id_to_idx[e['from']], id_to_idx[e['to']]
        adj_temp[u].append(v)
        adj_temp[v].append(u)

    # Degeneracy Ordering
    degrees = np.array([len(adj_temp[u]) for u in range(num_nodes)])
    new_order = np.argsort(degrees)

    old_to_new = np.zeros(num_nodes, dtype=np.int32)
    new_to_old = np.zeros(num_nodes, dtype=np.int32)
    for new_id, old_id in enumerate(new_order):
        old_to_new[old_id] = new_id
        new_to_old[new_id] = old_id

    # Bitset Construction
    num_blocks = (num_nodes + 63) // 64
    adj_bits = np.zeros((num_nodes, num_blocks), dtype=np.uint64)
    
    for u_old in range(num_nodes):
        u_new = old_to_new[u_old]
        for v_old in adj_temp[u_old]:
            v_new = old_to_new[v_old]
            set_bit(adj_bits[u_new], v_new)

    return adj_bits, num_blocks, old_to_new, new_to_old

def build_matrix(vertices, edges):
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

def build_grid_matrix(vertices, edges, walk):
    mat, id_to_idx = build_matrix(vertices, edges)
    Nodes = [v['id'] for v in vertices]
    n = len(Nodes)
    col_size = int(math.ceil(math.sqrt(n)))
    row_count = int(math.ceil(n / col_size))
    Pos = {}
    Pos_reverse = {}
    idx = 0
    for r in range(row_count):
        for c in range(col_size):
            if idx >= n: break
            Pos[idx] = (r, c)
            Pos_reverse[(r, c)] = idx
            idx += 1
            
    def has_pos(p): return p in Pos_reverse

    for outer in range(n):
        for inner in range(n):
            if inner == outer or mat[outer, inner] != np.inf: continue
            if (walk == 1) and (Pos[inner][0] - Pos[outer][0] != 1): continue
            x, y = 0.0, 0.0
            pos = Pos[inner]
            outPos = Pos[outer]
            aborted = False
            while pos[1] != outPos[1]:
                step = -1 if pos[1] > outPos[1] else 1
                next_pos = (pos[0], pos[1] + step)
                if not has_pos(pos) or not has_pos(next_pos):
                    aborted = True; break
                x += mat[Pos_reverse[pos], Pos_reverse[next_pos]]
                pos = next_pos
            if aborted: continue
            pos = Pos[inner]
            while pos[0] != outPos[0]:
                step = -1 if pos[0] > outPos[0] else 1
                next_pos = (pos[0] + step, pos[1])
                if not has_pos(pos) or not has_pos(next_pos):
                    aborted = True; break
                y += mat[Pos_reverse[pos], Pos_reverse[next_pos]]
                pos = next_pos
            if aborted: continue
            w = float(np.sqrt(x * x + y * y).round(2))
            mat[inner, outer] = w
            mat[outer, inner] = w
            
    if walk == 1:  
        for k in range(mat.shape[0]):
            for i in range(mat.shape[0]):
                for j in range(mat.shape[0]):
                    if mat[i, k] + mat[k, j] < mat[i, j]:
                        mat[i, j] = mat[i, k] + mat[k, j]
    return mat, id_to_idx

# ==============================================================================
# PART 4: CPLEX MODEL BUILDER
# Source: Cplex_Cover_Demand.py
# ==============================================================================

def add_rainbow_coverage_constraints(model, x, u, V, S, G_indexed, non_res_types, r_type="R"):
    G_idx_flat = {t: {frozenset(g): gi for gi, g in G_indexed[t]} for t in non_res_types}
    for vi, v in enumerate(V):
        for ti, t in enumerate(non_res_types):
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
                model.add_constraint(model.sum(valid_terms) >= x[v, r_type], ctname=f"rainbow_{v}_{t}")
            else:
                model.add_constraint(0 >= x[v, r_type], ctname=f"coverage_none_{v}_{t}")

def add_group_size_constraints(model, x, u, G_indexed, non_res_types):
    for t in non_res_types:
        for gi, g in G_indexed[t]:
            for v in g:
                model.add_constraint(u[(t, gi)] <= x[v, t], ctname=f"group_size_{t}_{gi}_{v}")

def add_group_cross_constraints(model, x, u, Nodes, G_indexed, non_res_types):
    v_in_groups = {v: {} for v in Nodes}
    for t in non_res_types:
        for gi, g in G_indexed[t]:
            for v in g:
                v_in_groups[v].setdefault(t, []).append(gi)
    for v in Nodes:
        for t in non_res_types:
            gis = v_in_groups[v].get(t, [])
            if not gis:
                model.add_constraint(x[v, t] == 0, ctname=f"x_zero_{v}_{t}")
                continue
            model.add_constraint(x[v, t] <= model.sum(u[(t, gi)] for gi in gis), ctname=f"x_le_sum_u_{v}_{t}")
            model.add_constraint(model.sum(u[(t, gi)] for gi in gis) <= 1, ctname=f"sum_u_le_1_{v}_{t}")

def add_assignment_equalities(model, y, x, S, G_indexed, non_res_types, r_type="R"):
    G_idx_map = {t: {frozenset(g): gi for gi, g in G_indexed[t]} for t in non_res_types}
    for v_t, groups in S.items():
        v, t = v_t
        if t not in non_res_types: continue
        y_terms = []
        if groups:
            for g in groups:
                fsg = frozenset(g)
                gi = G_idx_map[t].get(fsg, None)
                if gi is None: continue
                key = (v, (t, gi))
                if key in y: y_terms.append(y[key])
            if y_terms:
                model.add_constraint(model.sum(y_terms) == x[v, r_type], ctname=f"assign_eq_{v}_{t}")
            else:
                model.add_constraint(x[v, r_type] == 0, ctname=f"assign_none_{v}_{t}")
        else:
            model.add_constraint(x[v, r_type] == 0, ctname=f"assign_none_{v}_{t}")

def add_demand_constraints(model, y, u, x, Capacity, non_res_types, r_type="R"):
    for t in non_res_types:
        cap = Capacity[t]
        group_indices = set(gi for (_, (tt, gi)) in y.keys() if tt == t)
        for gi in group_indices:
            terms = [var for (v,(tt,ggi)), var in y.items() if tt==t and ggi==gi]
            if terms:
                model.add_constraint(model.sum(terms) <= cap * u[(t, gi)], ctname=f"capacity_{t}_{gi}")
    for (v, (t, gi)), y_var in y.items():
        model.add_constraint(y_var <= u[(t, gi)], ctname=f"y_le_u_{v}_{t}_{gi}")
        model.add_constraint(y_var <= x[v, r_type], ctname=f"y_le_xr_{v}_{t}_{gi}")

def build_model(V, T, G, A, S, non_res_types, r_type='R', name='residential_ilp'):
    model = Model(name=name)
    
    # Configure Time Limit (300 seconds = 5 minutes)
    model.parameters.timelimit = 21600  # 6 hours for testing, adjust as needed
    
    G_indexed = {}
    for t in non_res_types:
        groups = G.get(t, [])
        G_indexed[t] = list(enumerate(groups))

    x = {}
    for v in V:
        for t in T: x[v, t] = model.binary_var(name=f"x_{v}_{t}")

    u = {}
    for t in non_res_types:
        for gi, g in G_indexed[t]: u[(t, gi)] = model.binary_var(name=f"u_{t}_{gi}")

    y = {}
    for v in V:
        for t in non_res_types:
            candidate_groups = S.get((v, t), [])
            if not candidate_groups: continue
            g_to_index = {g: gi for gi, g in G_indexed[t]}
            for g in candidate_groups:
                if g not in g_to_index: continue
                gi = g_to_index[g]
                y[v, (t, gi)] = model.binary_var(name=f"y_{v}_{t}_{gi}")

    model.maximize(model.sum(x[v, r_type] for v in V))

    for v in V: model.add_constraint(model.sum(x[v, t] for t in T) == 1, ctname=f"single_type_{v}")

    add_rainbow_coverage_constraints(model, x, u, V, S, G_indexed, non_res_types, r_type)
    add_assignment_equalities(model, y, x, S, G_indexed, non_res_types, r_type)
    add_group_size_constraints(model, x, u, G_indexed, non_res_types)
    add_group_cross_constraints(model, x, u, Nodes, G_indexed, non_res_types)
    add_demand_constraints(model, y, u, x, Capacity, non_res_types, r_type)
    
    return model, G_indexed

# ==============================================================================
# PART 5: MAIN EXECUTION
# ==============================================================================

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python script.py <input.json>")
        sys.exit(1)

    with open(sys.argv[1], "r", encoding="utf-8") as f:
        data = json.load(f)

    vertices = data["vertices"]
    edges = data["edges"]
    entries = data.get("entries", [])
    
    Nodes = [v['id'] for v in vertices]
    T_Without_R = [entry['name'] for entry in entries]
    Capacity = { entry['name'] : entry['capacity'] for entry in entries }
    Type_distances = { entry['name'] : entry['distance'] for entry in entries }
    Type_colors = { entry['name'] : entry['color'] for entry in entries }
    BuildingSize = { entry['name'] : entry['size'] for entry in entries }
    T = T_Without_R + ["R"]
    
    BuildingSize.update( {"R": 1} )
    Type_colors.update({"R": "white"})

    # 1. Build Matrices
    print("--- 1. Building Grid/Walk Matrix ---")
    grid_start = time.time() 
    grid_mat_walk, id_to_idx_walk = build_grid_matrix(vertices, edges, 1)

    print(f"The grid fly time is {time.time()-grid_start}")

    print(grid_mat_walk)

    grid_start = time.time()
    grid_mat_fly, id_to_idx_fly = build_grid_matrix(vertices, edges, 0) 
    print(f"The grid fly time is {time.time()-grid_start}")


    print(grid_mat_fly)
    

    # 2. Graph Optimization
    print("--- 2. Optimizing Graph Structure (Bitsets) ---")
    adj_bits, num_blocks, old_to_new, new_to_old = prepare_optimized_graph(Nodes, edges)
    n_nodes = len(Nodes)

    # Remap Grid Matrix to Optimized Indices for fast lookup
    grid_mat_opt = np.zeros((n_nodes, n_nodes), dtype=np.float64)
    for i in range(n_nodes):
        for j in range(n_nodes):
            grid_mat_opt[i, j] = grid_mat_fly[new_to_old[i], new_to_old[j]]

    # 3. Enumeration
    print("\n--- 3. Enumerating Subgraphs (Limitless Mode) ---")
    SubGraphs = {}
    
    for entry in entries:
        name = entry.get('name')
        size = int(entry.get('size'))
        max_dia = float(entry.get('diameter'))
        
        t0 = time.time()
        # Call the two-pass limitless generator
        indices_list = get_limitless_subgraphs(
            adj_bits, grid_mat_opt, num_blocks, n_nodes,
            size, max_dia
        )
        
        # Convert indices back to original IDs
        valid_subgraphs = []
        for row in indices_list:
            original_nodes = [Nodes[new_to_old[idx]] for idx in row]
            valid_subgraphs.append(frozenset(original_nodes))
            
        # ... (previous code) ...
        SubGraphs[name] = valid_subgraphs
        print(f"  > Finished '{name}' (Size={size}, Dia={max_dia}) -> Found {len(valid_subgraphs)} in {time.time()-t0:.2f}s")

        # FIX STARTS HERE
        # 1. Use min() to ensure we don't crash if fewer than 5 results exist
        limit = min(5, len(valid_subgraphs))
        
        for i in range(limit):
            # 2. Convert the frozenset to a list so it becomes indexable
            current_group = list(valid_subgraphs[i])
            
            # Now you can iterate over the list or access by index
            for node in current_group:
                print(f"{node}", end="-")
            print("") 
        # FIX ENDS HERE
    # 4. S Construction (Distance Filter)
    
    print("\n--- 4. Calculating S (Distance Validity) ---")
    def check_group_vertex_validation(G, v, t):
        # G is frozenset of Node IDs
        for u in G:
            if (grid_mat_walk[id_to_idx_walk[u], id_to_idx_walk[v]] <= Type_distances[t]):
                return True
        return False

    S_0 =time.time() 
    S = { (v,t) : [g for g in SubGraphs[t] if check_group_vertex_validation(g, v, t)] 
          for v in Nodes for t in T_Without_R }
    
    print(f"S calculation time {time.time()-S_0}")
    
    # 5. Model Build & Solve
    print("\n--- 5. Building & Solving CPLEX Model (5min limit) ---")
    time_build =time.time() 
    model, G_indexed = build_model(
        Nodes, T, SubGraphs, BuildingSize, S, T_Without_R, r_type='R'
    )
    print("Building time : ", time.time() - time_build)
    # model.export_as_lp('residential_model.lp')
 
    try:
        sol_0 = time.time() 
        sol = model.solve() # Çözüm burada aranıyor
        solve_time = time.time() - sol_0
        print(f"Solve time {solve_time}")


        # Gap Value:
        details = model.solve_details
        print(f"Solution gap: {details.mip_relative_gap}")

        gap_value = details.mip_relative_gap
        best_bound = details.best_bound
        status = details.status

        gap_info = {
            "solve_time_seconds": solve_time,
            "gap_relative": gap_value,    # 0.10 -> %10
            "best_bound": best_bound,     # Teorik olarak ulaşılabilecek en yüksek skor
            "status": status,
            "entities": {
                "timestamp": time.strftime("%Y-%m-%d %H:%M:%S", time.gmtime()),
                "time_limit_seconds": model.parameters.timelimit,
                "num_vertices": len(vertices),
                "num_edges": len(edges),
                "num_types": len(T),
                "num_non_res_types": len(T_Without_R),
                "subgraphs_per_type": { t: len(SubGraphs[t]) for t in T_Without_R }
            }
        }
        
        if sol:
            gap_info["objective_value"] = sol.objective_value
            print(f"\n>> Final MIP Gap: {gap_value:.4f} ({(gap_value*100):.2f}%)")
        else:
            gap_info["objective_value"] = None
            print("\n>> No solution found, saving available stats.")

        # Dosyaya kaydet (gap_report.json)
        with open("gap_report.json", "a", encoding="utf-8") as f:
            f.write(json.dumps(gap_info) + "\n")

        print(">> Gap report saved to 'gap_report.json'")
        # ==========================================

        if sol:
            print("\n*** SOLUTION FOUND ***")
            assigned_non_res = {}
            for t in T_Without_R:
                total = 0
                for v in Nodes:
                    candidate_groups = S.get((v, t), [])
                    if not candidate_groups: continue
                    g_to_index = {g: gi for gi, g in G_indexed[t]}
                    for g in candidate_groups:
                        if g not in g_to_index: continue
                        gi = g_to_index[g]
                        val = model.solution.get_value(f"y_{v}_{t}_{gi}")
                        if val: total += val
                assigned_non_res[t] = int(round(total))
            
            # Helper for clean output
            vertex_colors = {vertex['id'] : "black" for vertex in vertices}
            for v in Nodes:
                for t in T:
                    if model.solution.get_value(f"x_{v}_{t}") > 0.5:
                        vertex_colors[v] = Type_colors[t]

            print("$$$")
            print(json.dumps(vertex_colors))
        else:
            print("No solution found within time limit.")
            
    except Exception as e:
        print(f"Solve failed or skipped: {e}")