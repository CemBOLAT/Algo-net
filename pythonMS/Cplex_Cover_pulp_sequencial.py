import sys
import json
import math
import time
import random
import os
import sys
import numpy as np
import pulp
from pulp import LpProblem, LpMaximize, LpVariable, lpSum, LpBinary, value, PULP_CBC_CMD
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
            assigned_groups = [y[vi, (ti, g_idx)] for (vi, (ti, g_idx)) in y.keys() if vi == v and ti == t]
            
            if assigned_groups:
                model += (lpSum(assigned_groups) == x[v, r_type], f"y_rainbow_{v}_{t}")
            else:
                model += (x[v, r_type] == 0, f"y_impossible_{v}_{t}")

def add_group_size_constraints(model, x, u, G_indexed, non_res_types):
    for t in non_res_types:
        for gi, g in G_indexed[t]:
            for v in g:
                model += (u[(t, gi)] <= x[v, t], f"group_size_{t}_{gi}_{v}")

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
                model += (x[v, t] == 0, f"x_zero_{v}_{t}")
                continue
            model += (x[v, t] <= lpSum(u[(t, gi)] for gi in gis), f"x_le_sum_u_{v}_{t}")
            model += (lpSum(u[(t, gi)] for gi in gis) <= 1, f"sum_u_le_1_{v}_{t}")

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
                model += (lpSum(y_terms) == x[v, r_type], f"assign_eq_{v}_{t}")
            else:
                model += (x[v, r_type] == 0, f"assign_none_{v}_{t}")
        else:
            model += (x[v, r_type] == 0, f"assign_none_{v}_{t}")

def add_demand_constraints(model, y, u, x, Capacity, non_res_types, r_type="R"):
    for t in non_res_types:
        cap = Capacity[t]
        group_indices = set(gi for (_, (tt, gi)) in y.keys() if tt == t)
        for gi in group_indices:
            terms = [var for (v,(tt,ggi)), var in y.items() if tt==t and ggi==gi]
            if terms:
                model += (lpSum(terms) <= cap * u[(t, gi)], f"capacity_{t}_{gi}")
    for (v, (t, gi)), y_var in y.items():
        model += (y_var <= u[(t, gi)], f"y_le_u_{v}_{t}_{gi}")
        model += (y_var <= x[v, r_type], f"y_le_xr_{v}_{t}_{gi}")

def build_model(V, T, G, A, S, non_res_types, r_type='R', name='residential_ilp'):
    model = LpProblem(name=name, sense=LpMaximize)
    
    G_indexed = {}
    for t in non_res_types:
        groups = G.get(t, [])
        G_indexed[t] = list(enumerate(groups))

    x = {}
    for v in V:
        for t in T: x[v, t] = LpVariable(name=f"x_{v}_{t}", cat=LpBinary)

    u = {}
    for t in non_res_types:
        for gi, g in G_indexed[t]: u[(t, gi)] = LpVariable(name=f"u_{t}_{gi}", cat=LpBinary)

    y = {}
    for v in V:
        for t in non_res_types:
            candidate_groups = S.get((v, t), [])
            if not candidate_groups: continue
            g_to_index = {g: gi for gi, g in G_indexed[t]}
            for g in candidate_groups:
                if g not in g_to_index: continue
                gi = g_to_index[g]
                y[v, (t, gi)] = LpVariable(name=f"y_{v}_{t}_{gi}", cat=LpBinary)

    model += lpSum(x[v, r_type] for v in V)

    for v in V: model += (lpSum(x[v, t] for t in T) == 1, f"single_type_{v}")

    add_rainbow_coverage_constraints(model, x, y, V, S, non_res_types, r_type)
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
                
                sol_0 = time.time() 
                status_code = model.solve(PULP_CBC_CMD(timeLimit=7200, msg=False))
                solve_time = time.time() - sol_0 

                if status_code == 1: # Optimal

                    # --- 1. FACILITIES (Non-Res) ---
                    for (t, gi), var in u.items():
                        if value(var) > 0.5 and t == res_type:
                            v_list = list(G_indexed[t][gi])
                            warm_start_u_content.append({"t": t, "v_list": v_list})
                            for v in v_list:
                                used_vertices.add(v)

                    for (v, t), var in x.items():
                        if value(var) > 0.5 and t == res_type:
                            warm_start_x_content.append({"v": v, "t": t})

                    # --- 2. RESIDENTS & COVERAGE (Smart Update) ---
                    temp_x_residents = [] 
                    for (v, t), var in x.items():
                        if value(var) > 0.5 and t == 'R':
                            temp_x_residents.append({"v": v, "t": 'R'})
                    
                    warm_start_x_content = [item for item in warm_start_x_content if item['t'] != 'R']
                    warm_start_x_content.extend(temp_x_residents)

                    new_y_coverage = []
                    for (v, (ti, gi)), var in y.items():
                        if value(var) > 0.5 and ti == res_type:
                            new_y_coverage.append({
                                "v": v, 
                                "t": ti, 
                                "v_list": list(G_indexed[ti][gi])
                            })
                    
                    active_resident_ids = {item['v'] for item in temp_x_residents}
                    warm_start_y_content = [item for item in warm_start_y_content if item['v'] in active_resident_ids]
                    warm_start_y_content.extend(new_y_coverage)

                    print(f"   > {res_type} fixed. {len(temp_x_residents)} residents synchronized.")
                    
                    obj_val = value(model.objective)
                    
                    run_data = {
                        "Solved Type": res_type, 
                        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S", time.gmtime()),
                        "solve_time_seconds": solve_time,
                        "objective_value": obj_val,
                        "status": pulp.LpStatus[status_code],
                        "stats": {"num_vertices": len(empty_vertices)},
                    }

                    try:
                        with open(output_file, "a", encoding="utf-8") as f:
                            f.write(json.dumps(run_data) + "\n")
                        print(f">> Results saved to {output_file}")
                    except Exception as e:
                        print(f"!! Error writing to file: {e}")

                    for gi, g in G_indexed[res_type]:
                        if value(u[(res_type, gi)]) > 0.5:
                            for v in g:
                                used_vertices.add(v)

                else:
                    print(f"!! Warning: No solution found for type {res_type} (Status: {pulp.LpStatus[status_code]})")
                    
            except Exception as e:
                print(f"!! CRITICAL FAILURE on {res_type}: {e}")
                import traceback
                traceback.print_exc()
            finally:
                pass
        
        class SetEncoder(json.JSONEncoder):
            def default(self, obj):
                if isinstance(obj, (set, frozenset)): return list(obj)
                return super().default(obj)

        draft_payload = {
            "u": warm_start_u_content,
            "x": warm_start_x_content,
            "y": warm_start_y_content
        }

        with open("sequential_complete_draft.json", "w", encoding="utf-8") as f:
            json.dump(draft_payload, f, cls=SetEncoder, indent=4)
    
    else: 
        pass 

    print("\n>>> STARTING GLOBAL SOLVE (Standard) <<<")

    full_model, G_full, x_full, u_full, y_full = build_model(
        Nodes, T, SubGraphs, BuildingSize, S, T_Without_R, r_type='R'
    )
    
    time_0 = time.time() 
    final_status = full_model.solve(PULP_CBC_CMD(timeLimit=14400, msg=True))
    solve_time = time.time() - time_0 
    
    if final_status is not None:
        print(f"Final Status: {pulp.LpStatus[final_status]}")
    
    vertex_colors = {v_id : "black" for v_id in Nodes}

    if final_status == 1:
        print(f"Final Optimized Objective: {value(full_model.objective)}")
        
        obj_val = value(full_model.objective)
        
        run_data = {
            "Solved Type": "Global", 
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S", time.gmtime()),
            "solve_time_seconds": solve_time,
            "objective_value": obj_val,
            "status": pulp.LpStatus[final_status],
            "stats": {
                "num_vertices": len(Nodes),
                "num_edges" : len(edges) 
            },
        }

        try:
            with open(output_file, "a", encoding="utf-8") as f:
                f.write(json.dumps(run_data) + "\n")
            print(f">> Results saved to {output_file}")
        except Exception as e:
            print(f"!! Error writing to file: {e}")

        for (v, t), var in x_full.items():
            try:
                if value(var) is not None and value(var) > 0.5:
                    vertex_colors[v] = Type_colors.get(t, "black")
            except Exception:
                continue 

    print("$$$")
    print(json.dumps(vertex_colors))