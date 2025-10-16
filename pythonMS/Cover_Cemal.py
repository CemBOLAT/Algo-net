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
#     {'name': 'cemak', 'color': '#17fd32', 'capacity': 1, 'distance': 1, 'unitDistance': 1}, 
#     {'name': 'hastane', 'color': '#d21919', 'capacity': 1, 'distance': 1, 'unitDistance': 1}, 
#     {'name': 'okul', 'color': '#b319d2', 'capacity': 1, 'distance': 1, 'unitDistance': 1}
# ]

# # Getting vertex ID's as a list
# Nodes = [vertex["id"] for vertex in vertices]

# # Getting edges as a weight matrix
# Weights = { id : { id : 0 for id in Nodes} for id in Nodes }

# for edge in edges:
#     Weights[edge['from']][edge['to']] = edge['weight']
#     if not edge.get('directed', False): # Daima atama yapma.
#         Weights[edge['to']][edge['from']] = edge['weight']

# # Applying Floyd-Warshall algorithm for missing edges and their weights
# for outer in Nodes:
#     for inner in Nodes:
#         if outer != inner and Weights[outer][inner] == 0:
#             Weights[outer][inner] = np.inf

# for k in Nodes:
#     for outer in Nodes:
#         for inner in Nodes:
#             if Weights[outer][inner] > Weights[outer][k] + Weights[k][inner]:
#                 Weights[outer][inner] = Weights[outer][k] + Weights[k][inner]

# # Printing the final matrix table
# print("")
# print("       ", end="")
# for key in Weights.keys():
#     print(key, end=" - ")
# print("")

# for key in Weights.keys():
#     print(f"{key} -> ", end="  ")
#     for key_inner in Weights.keys():
#         print(f"{Weights[key][key_inner]}", end=" - ")
#     print("") 

# Types = ["R", "T1", "T2", "T3"]
# Type_distances = { "T1": 10, "T2": 6, "T3" : 12} # 1 3 2
# Type_colors = {"R": "white", "T1": "red", "T2": "yellow", "T3": "green"}

# # Prepared distance-neighboor sets.
# S = {}
# for v in Nodes:
#     for t in ["T1", "T2", "T3"]:
#         neighbors = []
#         for u in Nodes:
#             if u == v:
#                 continue
#             if Weights[u][v] <= Type_distances[t]:
#                 neighbors.append(u)
#         S[(v, t)] = neighbors

# # -- Initialize the assignment variables Xt -- 
# Xt = {}
# for v in Nodes:
#     for t in Types:
#         Xt[v, t] = pulp.LpVariable(f"x_{v}_{t}", cat=pulp.LpBinary)

# # -- Initialize the assignment variables Yuvt -- (u,v) ordered pairs
# Yuvt = {}
# for u in Nodes:
#     for v in Nodes:
#         if u == v:
#             continue
#         for t in ["T1", "T2", "T3"]:
#             if v in S[(u, t)]:
#                 Yuvt[u, v, t] = pulp.LpVariable(f"Y_{u}_{v}_{t}", cat="Binary")

# model = pulp.LpProblem("Cover", pulp.LpMaximize)
# lambda_param = 1

# # --- Initialize dictionary for Z variables ---
# Z = {}

# for t in [tt for tt in Types if tt != "R"]:
#     for v1 in Nodes:
#         for v2 in Nodes:
#             if v1 >= v2:  # ensure unique unordered pairs
#                 continue

#             # Define Z[v1, v2, t]
#             Z[v1, v2, t] = pulp.LpVariable(f"Z_{v1}_{v2}_{t}", cat="Binary")

#             # Linearization constraints
#             model += Z[v1, v2, t] <= Xt[v1, t]
#             model += Z[v1, v2, t] <= Xt[v2, t]
#             model += Z[v1, v2, t] >= Xt[v1, t] + Xt[v2, t] - 1


# objective1 = pulp.lpSum(Xt[v, "R"] for v in Nodes)

# # Ignore infinite distances in objective
# def finite_weight(a, b):
#     w = Weights[a][b]
#     try:
#         if np.isinf(w) or math.isinf(float(w)):
#             return 0.0
#     except Exception:
#         return 0.0
#     return float(w)

# objective2 = pulp.lpSum(
#     finite_weight(v1, v2) * Z[v1, v2, t]
#     for t in [tt for tt in Types if tt != "R"]
#     for v1 in Nodes for v2 in Nodes
#     if v1 < v2
# )


# model += objective1 - lambda_param * objective2, "Objective"

# # Constraint for every vertex can be only one type of container
# for v in Nodes:
#     model += pulp.lpSum(Xt[v, t] for t in Types) == 1

# # # Constraint for every residental type vertex has a open neighborhood which union of types of adjacent vertices is all types
# # # Checking types of neihgbor vertices by type-distance relation
# for v in Nodes:
#     for t in list(set(Types) - {"R"}):
#         model += sum(Xt[u, t] for u in S[(v,t)]) >= Xt[v, "R"] 

# # Constraint for every type of container has a limited capacity to cover residents
# Demand = { "T1": 1, "T2": 3, "T3": 2} # Number of residents that can be covered by one container of that type
# for v in Nodes:
#     for t in ["T1","T2","T3"]:
#         # v üzerindeki t tipi konteynere atanmış R sayısı
#         assigned_R = pulp.lpSum(Yuvt[r,v,t] for r in Nodes if r != v and (r,v,t) in Yuvt)
#         M_vt = len(Nodes)  # big-M
#         # Eğer Xt[v,t] = 1 ise kapasite kısıtı aktif
#         model += assigned_R <= Demand[t] + M_vt*(1 - Xt[v,t])

# # --- Residential vertexler için atama kısıtı ---
# # Her R tipi vertex, her tip için en fazla 1 konteynere atanabilir
# for r in Nodes:
#     for t in ["T1","T2","T3"]:
#         model += pulp.lpSum(Yuvt[r,v,t] for v in Nodes if v != r and (r,v,t) in Yuvt) <= 1

# model.solve()

# The function for displaing the result understandable way
def display_res():
    print("       R   |  T1   |  T2   |  T3")
    for v in Nodes:
        print(v, "   ", end="")
        for t in Types:
            print(Xt[v, t].value(), "    ", end="")
        print("")

display_res()

vertex_colors = {vertex['id'] : "" for vertex in vertices}

for v in Nodes:
    for t in Types:
        # Use solved value
        if (Xt[v, t].value() or 0) >= 1:
            vertex_colors[v] = Type_colors[t]

print("$$$")
print(json.dumps(vertex_colors))
