import pulp
import json
import sys
import numpy as np
from docplex.mp.model import Model
from typing import Dict, Iterable, Tuple, List, Set
import math
import sys

from numba import jit, njit, prange

if len(sys.argv) < 2:
    print("Missing input file argument", file=sys.stderr)
    sys.exit(1)

with open(sys.argv[1], "r", encoding="utf-8") as f:
    data = json.load(f)

vertices = data["vertices"]
edges = data["edges"]
entries = data.get("entries", [])
row_col = data.get("row_col", []) 



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

## ESU
ROWS = row_col[0]
COLS = row_col[1]  
N_NODES = ROWS * COLS
edge_weight = edge_set[(Nodes[0]), Nodes[1]]


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







""" def check_group_vertex_validation(G, v, t):
    for u in G:
        if (grid_mat_walk[id_to_idx_walk[u], id_to_idx_walk[v]] <= Type_distances[t]):
            return True
    return False """



#grid_mat_walk, id_to_idx_walk = build_grid_matrix(vertices, edges, 1)

### Finding Neighbors    #######

neighbors = np.full((N_NODES, 4), -1, dtype=np.int32)
edge_weights = np.full((N_NODES, 4), edge_weight, dtype=np.int32)
for r in range(ROWS):
    for c in range(COLS):
        idx = r * COLS + c
        n_idx = 0
        # Yukarı, Aşağı, Sol, Sağ
        directions = [(-1, 0), (1, 0), (0, -1), (0, 1)]
        
        for dr, dc in directions:
            nr, nc = r + dr, c + dc
            if 0 <= nr < ROWS and 0 <= nc < COLS:
                n_node = nr * COLS + nc
                neighbors[idx, n_idx] = n_node
                
                n_idx += 1


### Numba Helpers    #######

@njit(fastmath=True)
def check_subgraph_diameter(subgraph_nodes, count, adj, w_adj, diameter):
    """
    Bulunan subgraph'in çapını (diameter) hesaplar.
    Küçük matrisler için Floyd-Warshall algoritması kullanılır.
    """
    # 1. Küçük bir mesafe matrisi oluştur (k x k)
    # Sonsuz yerine büyük bir sayı (99999) kullanıyoruz.
    dist = np.full((count, count), 99999, dtype=np.int32)
    
    # Köşegen 0
    for i in range(count):
        dist[i, i] = 0
        
    # 2. Subgraph içindeki kenarları ve ağırlıkları doldur
    # Bu "Induced Subgraph" mantığıdır. Seçilen node'lar arasında
    # orijinal graph'ta bir bağ varsa, o kullanılır.
    for i in range(count):
        u = subgraph_nodes[i]
        for j in range(count):
            if i == j: continue
            v = subgraph_nodes[j]
            
            # u'nun komşularında v var mı bak
            for k in range(4):
                if adj[u, k] == v:
                    dist[i, j] = w_adj[u, k]
                    break
    
    # 3. Floyd-Warshall Algoritması (All-Pairs Shortest Path)
    # k çok küçük olduğu için (örn: 4^3 = 64 işlem) çok hızlıdır.
    for k in range(count):
        for i in range(count):
            for j in range(count):
                if dist[i, k] + dist[k, j] < dist[i, j]:
                    dist[i, j] = dist[i, k] + dist[k, j]
                    
    # 4. Maksimum mesafeyi (Diameter) bul
    for i in range(count):
        for j in range(count):
            # Bağlantısız parça varsa (99999) onu yok sayamayız,
            # ama ESU zaten connected graph üretir.
            if dist[i, j] > diameter and dist[i, j] < 99999:
                return False
                
    return True

@njit
def _extend_and_check(adj, w_adj, k, max_diameter, current_size, ext_list, ext_count, forbidden):
    # Base Case: Hedef boyuta ulaştık
    if current_size == k:
        # Şimdi ÇAP (Diameter) kontrolü yapalım
        # Forbidden arrayinden subgraph'i çıkarmamız lazım, ama elimizde liste yok.
        # Bu yüzden recursion'da 'current_subgraph' listesini de taşımak daha iyidir.
        # Ancak performans için forbidden'dan 'True' olanları (ve > start_node olanları)
        # ayırt etmek zor. 
        # HIZ İÇİN: ESU'da subgraph'i toplamak yerine, recursion'a 'path' argümanı ekleyelim.
        # (Aşağıdaki wrapper fonksiyonda eklendi: 'current_path')
        return 0 # Bu fonksiyon aşağıda revize edildi
    return 0


### Main Searching Part    #######

@njit
def find_patterns(adj, w_adj, target_size, max_diameter):
    total_found = 0
    num_nodes = adj.shape[0]
    
    # Paralel işlem
    for start_node in prange(num_nodes):
        
        # --- Yerel Değişkenler ---
        # Mevcut subgraph (path)
        path = np.zeros(target_size, dtype=np.int32)
        path[0] = start_node
        
        # Extension Listesi
        ext_list = np.zeros(num_nodes, dtype=np.int32) # Buffer
        ext_count = 0
        
        # Forbidden Mask
        forbidden = np.zeros(num_nodes, dtype=np.bool_)
        for i in range(start_node + 1):
            forbidden[i] = True
            
        # İlk Extension (start_node komşuları, ID > start_node)
        for i in range(4):
            n = adj[start_node, i]
            if n != -1 and n > start_node:
                ext_list[ext_count] = n
                ext_count += 1
        
        # Recursion Başlat
        
        
        total_found += _recursive_search(adj, w_adj, target_size, max_diameter, 
                                         1, path, ext_list, ext_count, forbidden)
        
        
    return total_found

@njit
def _recursive_search(adj, w_adj, k, max_dia, curr_len, path, ext_list, ext_count, forbidden):
    # Base Case
    if curr_len == k:
        # Çap kontrolü yap
        return check_subgraph_diameter(path, k, adj, w_adj, max_dia) # Suited
        

    count = 0
    
    # Extension Loop
    for i in range(ext_count):
        w = ext_list[i]
        
        # Yeni Path
        new_path = path.copy()
        new_path[curr_len] = w
        
        # Yeni Forbidden
        new_forbidden = forbidden.copy()
        new_forbidden[w] = True
        
        # Yeni Extension Hazırla (Fixed Buffer)
        new_ext_buffer = np.zeros(400, dtype=np.int32)
        new_ext_len = 0
        
        # 1. Mevcut extension'dan kalanlar
        for j in range(i + 1, ext_count):
            val = ext_list[j]
            new_ext_buffer[new_ext_len] = val
            new_ext_len += 1
            
        # 2. w'nun komşularını ekle
        for n_idx in range(4):
            v = adj[w, n_idx]
            if v != -1:
                if not new_forbidden[v]:
                    # Zaten listede var mı kontrolü
                    found = False
                    for check_idx in range(new_ext_len):
                        if new_ext_buffer[check_idx] == v:
                            found = True
                            break
                    if not found:
                        new_ext_buffer[new_ext_len] = v
                        new_ext_len += 1
                        
        count += _recursive_search(adj, w_adj, k, max_dia, curr_len + 1, 
                                   new_path, new_ext_buffer, new_ext_len, new_forbidden)
        
        forbidden[w] = True
        
    return count


# Numba fonksiyonunu derlemek (Warmup) için boş bir çağrı yapalım
# (İlk çalıştırma yavaş olmasın diye)
_ = find_patterns(neighbors, edge_weights, 2, 100)

entry_count = [] 

for entry in entries:
    name = entry["name"]
    size = entry["size"]  
    diameter = entry["diameter"] 

    count = find_patterns(neighbors, edge_weights, size, diameter)

    
    print(f"name: {name:<10} - size: {size:<5} - diameter:{diameter:<8} == count:{count}") 

vertex_colors = {vertex['id'] : "black" for vertex in vertices}


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

#print("Model eğitimi olmadan bitti")
print("$$$")
print(json.dumps(vertex_colors))
