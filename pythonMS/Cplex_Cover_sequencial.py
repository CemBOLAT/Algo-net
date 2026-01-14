import sys
import json
import math
import time
import random
import os
import sys
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

def add_rainbow_coverage_constraints(model, x, y, V, S, non_res_types, r_type="R"):
    """
    Stronger formulation: A vertex is a resident only if it is 
    assigned to exactly one group for EVERY non-residential type.
    """
    for v in V:
        for t in non_res_types:
            # Get all y variables for this vertex and this type
            # y variables should have been created only for valid (v, g, t) pairs
            assigned_groups = [y[vi, (ti, g_idx)] for (vi, (ti, g_idx)) in y.keys() if vi == v and ti == t]
            
            if assigned_groups:
                # v can only be a resident if it is assigned to exactly one group of type t
                model.add_constraint(model.sum(assigned_groups) == x[v, r_type], 
                                     ctname=f"y_rainbow_{v}_{t}")
            else:
                # If no groups of type t can reach v, v CANNOT be a resident
                model.add_constraint(x[v, r_type] == 0, ctname=f"y_impossible_{v}_{t}")

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
    
    # 1. Focus on finding feasible solutions, not proving bounds
    model.parameters.emphasis.mip = 4  # 1 = Feasibility, 4 = Hidden Feasibility

    # 2. Aggressive Heuristics
    model.parameters.mip.strategy.heuristicfreq = 50   # Run heuristics every 50 nodes
    model.parameters.mip.submip.nodelimit = 500      # Search deeper (500 nodes) inside each heuristic run

    # 3. Symmetry Breaking (To stop the 625 vs 33 gap)
    model.parameters.preprocessing.symmetry = 5      # Aggressive symmetry breaking

    # Configure Time Limit (300 seconds = 5 minutes)
    model.parameters.timelimit = 7200  # 2 hours for sequencial solving
    
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

    add_rainbow_coverage_constraints(model, x, y, V, S, non_res_types, r_type)
    #add_assignment_equalities(model, y, x, S, G_indexed, non_res_types, r_type)
    add_group_size_constraints(model, x, u, G_indexed, non_res_types)
    add_group_cross_constraints(model, x, u, V, G_indexed, non_res_types)
    add_demand_constraints(model, y, u, x, Capacity, non_res_types, r_type)
    
    return model, G_indexed, x, u, y

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
    
    # 2. Sort the list in place (descending order)
    T_Without_R.sort(key=lambda x: BuildingSize[x], reverse=True)
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
    
    output_file = "gap_report.jsonl"
    seq_solve = True

    warm_start_u_content = []
    warm_start_x_content = []
    warm_start_y_content = []

    if (seq_solve):

        used_vertices = set()
        vertex_colors = {v_id : "black" for v_id in Nodes}

        # Ensure T_Without_R is sorted by group size descending (9 -> 4 -> 1)
        for res_type in T_Without_R:
            # A. Correctly filter available vertices
            empty_vertices = [v for v in Nodes if v not in used_vertices]
            
            # B. Correctly filter S (only keep groups that aren't blocked)
            # S_type[(v, type)] = groups where EVERY vertex in the group is available
            S_type = {}
            for v in empty_vertices:
                original_groups = S.get((v, res_type), [])
                valid_groups = [g for g in original_groups if all(node in empty_vertices for node in g)]
                if valid_groups:
                    S_type[(v, res_type)] = valid_groups

            # C. Correctly filter SubGraphs (The group definitions)
            # Only include a group if it is still physically possible (no used vertices)
            SubGraphs_type = { 
                res_type: [g for g in SubGraphs.get(res_type, []) if all(node in empty_vertices for node in g)]
            }
            
            T_type = [res_type, "R"]
            T_Without_R_type = [res_type]  
            
            try:
                print(f"--- Solving for {res_type} (Vertices available: {len(empty_vertices)}) ---")
                
                # Build model with only THIS non-res type
                model, G_indexed, x, u, y = build_model(
                    empty_vertices, T_type, SubGraphs_type, BuildingSize, S_type, T_Without_R_type, r_type='R'
                )
                
                model.parameters.emphasis.mip = 1 # Focus on feasibility
                sol_0 =time.time() 
                sol = model.solve()
                solve_time = time.time() - sol_0 
                if sol:

                    # --- 1. FACILITIES (Non-Res) ---
                    # These are permanent. Capture them NOW while G_indexed is valid.
                    for (t, gi), var in u.items():
                        if t == res_type and sol.get_value(var) > 0.5:
                            # Capture the fingerprint (v_list) immediately
                            v_list = list(G_indexed[t][gi])
                            warm_start_u_content.append({"t": t, "v_list": v_list})
                            
                            # Mark nodes as physically occupied for future loops
                            for v in v_list:
                                used_vertices.add(v)

                    for (v, t), var in x.items():
                        if t == res_type and sol.get_value(var) > 0.5:
                            warm_start_x_content.append({"v": v, "t": t})

                    # --- 2. RESIDENTS & COVERAGE (Smart Update) ---
                    # These move every loop. We use a temporary master dict to track them.
                    
                    # Reset the temporary master resident list for this iteration
                    # (We only keep the X-Residential from the NEWEST solve)
                    temp_x_residents = [] 
                    for (v, t), var in x.items():
                        if t == 'R' and sol.get_value(var) > 0.5:
                            temp_x_residents.append({"v": v, "t": 'R'})
                    
                    # Update the global x_content for residents (overwriting previous loop's R)
                    # Filter out any existing 'R' and add the new ones
                    warm_start_x_content = [item for item in warm_start_x_content if item['t'] != 'R']
                    warm_start_x_content.extend(temp_x_residents)

                    # Update Coverage (y)
                    # We must capture the v_list NOW because G_indexed[res_type] will disappear next loop
                    new_y_coverage = []
                    for (v, (ti, gi)), var in y.items():
                        if ti == res_type and sol.get_value(var) > 0.5:
                            new_y_coverage.append({
                                "v": v, 
                                "t": ti, 
                                "v_list": list(G_indexed[ti][gi]) # Captured!
                            })
                    
                    # Pruning logic: Only keep coverage for vertices that are CURRENTLY residents
                    active_resident_ids = {item['v'] for item in temp_x_residents}
                    
                    # Keep old coverage only if the resident still exists; add the new coverage
                    warm_start_y_content = [item for item in warm_start_y_content if item['v'] in active_resident_ids]
                    warm_start_y_content.extend(new_y_coverage)

                    print(f"   > {res_type} fixed. {len(temp_x_residents)} residents synchronized.")
                    

                    details = model.solve_details
                    gap_value = details.mip_relative_gap
                    best_bound = details.best_bound
                    status = details.status
                    
                    # Calculate Objective safely
                    obj_val = sol.objective_value
                    
                    # --- 3. Build Data Record ---
                    run_data = {
                        "Solved Type": res_type, 
                        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S", time.gmtime()),
                        "solve_time_seconds": solve_time,
                        "objective_value": obj_val,
                        "gap_relative": float(gap_value) if gap_value is not None else None,
                        "best_bound": float(best_bound) if best_bound is not None else None,
                        "status": str(status),
                        "time_limit_seconds": model.parameters.timelimit.get(),
                        "stats": {
                            "num_vertices": len(empty_vertices), 
                        },
                        
                    }

                    # --- 4. Write to File ---
                    try:
                        with open(output_file, "a", encoding="utf-8") as f:
                            f.write(json.dumps(run_data) + "\n")
                        print(f">> Results saved to {output_file}")
                    except Exception as e:
                        print(f"!! Error writing to file: {e}")

                    # E. Mark New Non-Residential usage
                    for gi, g in G_indexed[res_type]:
                        if sol.get_value(u[(res_type, gi)]) > 0.5:
                            for v in g:
                                used_vertices.add(v)
                    
                    # CRITICAL: For the next solve, "Nodes" effectively becomes only active_residents
                    # plus any currently empty spots.
                    # Nodes = list(active_residents) + list(remaining_empty)

                else:
                    print(f"!! Warning: No solution found for type {res_type}")
                    
            except Exception as e:
                print(f"!! CRITICAL FAILURE on {res_type}: {e}")
            finally:
                if 'model' in locals() and model:
                    model.end()
        
        # --- 1. Define the Encoder (Place this before the save) ---
        class SetEncoder(json.JSONEncoder):
            def default(self, obj):
                if isinstance(obj, (set, frozenset)):
                    return list(obj)
                return super().default(obj)

        # --- 2. Build the payload ---
        draft_payload = {
            "u": warm_start_u_content,
            "x": warm_start_x_content,
            "y": warm_start_y_content
        }

        # --- 3. Save to File (USE cls=SetEncoder HERE) ---
        with open("sequential_complete_draft.json", "w", encoding="utf-8") as f:
            # You must include cls=SetEncoder
            json.dump(draft_payload, f, cls=SetEncoder, indent=4)
    
    else:
        # --- Load the Draft ---
        with open("sequential_complete_draft.json", "r", encoding="utf-8") as f:
            data = json.load(f) 

        def extract_fset(raw_list):
            """Extracts the list of vertex strings from the nested JSON structure."""
            # If the item is a list and the second element is also a list, 
            # that second element contains the actual vertex IDs (v313, etc.)
            if len(raw_list) > 1 and isinstance(raw_list[1], list):
                return frozenset(raw_list[1])
            # Fallback for flat lists
            return frozenset(raw_list)

        # --- 2. Convert 'u' ---
        warm_start_u_content = []
        for item in data['u']:
            warm_start_u_content.append({
                "t": item['t'],
                "v_list": extract_fset(item['v_list'])
            })

        warm_start_x_content = data['x']

        # --- 3. Convert 'y' ---
        warm_start_y_content = []
        for item in data['y']:
            warm_start_y_content.append({
                "v": item['v'],
                "t": item['t'],
                "v_list": extract_fset(item['v_list'])
            })
        
        print(">>> Draft layout loaded and fingerprints extracted. Ready for Global Solve.")


    # --- FINAL STEP: WARM START GLOBAL SOLVE ---
    print("\n>>> STARTING GLOBAL WARM START OPTIMIZATION <<<")

    # 1. Build the FULL model (all types, all Nodes)
    full_model, G_full, x_full, u_full, y_full = build_model(
        Nodes, T, SubGraphs, BuildingSize, S, T_Without_R, r_type='R'
    )

    # Map frozenset(vertices) -> index (gi) for each type
    group_fingerprint_to_gi = {
        t: {frozenset(g): gi for gi, g in G_full[t]} 
        for t in T_Without_R
    }

    
   # --- 2. Create the MIP Start structure ---
    mip_start = full_model.new_solution()

    # A. Map u variables
    for item in warm_start_u_content:
        t = item['t']
        # FORCE conversion to frozenset here to ensure it's hashable
        # This works whether item['v_list'] is a list or already a frozenset
        f_set = frozenset(item['v_list']) 
        
        if t in group_fingerprint_to_gi and f_set in group_fingerprint_to_gi[t]:
            gi = group_fingerprint_to_gi[t][f_set]
            mip_start.add_var_value(u_full[(t, gi)], 1.0)

    # B. Map x variables (No changes needed, strings/ints are already hashable)
    for item in warm_start_x_content:
        v, t = item['v'], item['t']
        if (v, t) in x_full:
            mip_start.add_var_value(x_full[(v, t)], 1.0)

    # C. Map y variables
    for item in warm_start_y_content:
        v, t = item['v'], item['t']
        # FORCE conversion to frozenset here as well
        f_set = frozenset(item['v_list']) 
        
        if t in group_fingerprint_to_gi and f_set in group_fingerprint_to_gi[t]:
            gi = group_fingerprint_to_gi[t][f_set]
            # Use the corrected nested tuple key: (v, (t, gi))
            key = (v, (t, gi))
            if key in y_full:
                mip_start.add_var_value(y_full[key], 1.0)
                

    full_model.add_mip_start(mip_start)
    full_model.context.solver.log_output = True

    # 3. Configure and Solve
    full_model.parameters.timelimit = 14400 # 4 hours for the final "cleanup"
    full_model.parameters.emphasis.mip = 2 # Shift to 2 (Optimality) to close the gap
    full_model.parameters.mip.strategy.probe = 1 # Less intense probing
    time_0 =time.time() 
    final_sol = full_model.solve()
    solve_time = time.time() - time_0 

    if final_sol:
        print(f"Final Optimized Objective: {final_sol.objective_value}")

        # 1. Reset colors to black to erase the "Greedy" sequential results
        vertex_colors = {v_id : "black" for v_id in Nodes}

        details = full_model.solve_details
        gap_value = details.mip_relative_gap
        best_bound = details.best_bound
        status = details.status
        
        # Calculate Objective safely
        obj_val = final_sol.objective_value
        
        # --- 3. Build Data Record ---
        run_data = {
            "Solved Type": "Warm start", 
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S", time.gmtime()),
            "solve_time_seconds": solve_time,
            "objective_value": obj_val,
            "gap_relative": float(gap_value) if gap_value is not None else None,
            "best_bound": float(best_bound) if best_bound is not None else None,
            "status": str(status),
            "time_limit_seconds": full_model.parameters.timelimit.get(),
            "stats": {
                "num_vertices": len(Nodes),
                "num_edges" : len(edges) 
            },
            
        }

        # --- 4. Write to File ---
        try:
            with open(output_file, "a", encoding="utf-8") as f:
                f.write(json.dumps(run_data) + "\n")
            print(f">> Results saved to {output_file}")
        except Exception as e:
            print(f"!! Error writing to file: {e}")

        # THE FIX: Iterate through x_full and get values from final_sol
        for (v, t), var in x_full.items():
            try:
                if final_sol.get_value(var) > 0.5:
                    vertex_colors[v] = Type_colors.get(t, "black")
            except Exception:
                continue # Safety for variables not in the solution


        # Update vertex_colors with final_sol logic here if needed
    
    
    print("$$$")
    print(json.dumps(vertex_colors))