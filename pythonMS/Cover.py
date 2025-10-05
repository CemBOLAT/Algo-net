import pulp
import json
import sys
import numpy as np




vertices_json = sys.argv[1]
edges_json = sys.argv[2]

vertices = json.loads(vertices_json)
edges = json.loads(edges_json)

# Getting vertex ID's as a list
Nodes = [vertex["id"] for vertex in vertices]

# Getting edges as a weight matrix 
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


# Printing the final matrix table
print("")
print("       ", end="")
for key in Weights.keys():
    print(key, end=" - ")
print("")

for key in Weights.keys():
    print(f"{key} -> ", end="  ")
    for key_inner in Weights.keys():
        print(f"{Weights[key][key_inner]}", end=" - ")
    print("") 


# The function for getting cardinal S the set consist of available adjacent vertices per selected type limit distance
def DistanceNeighbors(u, t):
    return [v for v in Weights[u].keys() if u != v and Weights[u][v] <= Type_distances[t]]





Types = ["R", "T1", "T2", "T3"]
Type_distances = { "T1": 10, "T2": 15, "T3" : 7}
Type_colors = {"R": "white", "T1": "red", "T2": "yellow", "T3": "green"}

# Prepared distance-neighboor sets.
S = { (v,t) : [u for u in Nodes if u != v and Weights[u][v] <= Type_distances[t]] for v in Nodes for t in ["T1", "T2", "T3"] }

model = pulp.LpProblem("Cover", pulp.LpMaximize)

Xt = { (v, t) : pulp.LpVariable(f"x_{v}_{t}", cat=pulp.LpBinary) for v in Nodes for t in Types }


model += pulp.lpSum(Xt[v, "R"] for v in Nodes) , "Objective"

# Constraint for every vertex can be only one type of container
for v in Nodes:
    model += pulp.lpSum(Xt[v, t] for t in Types)== 1

# Constraint for every residental type vertex has a open neighborhood which union of types of adjacent vertices is all types
# Checking types of neihgbor vertices by type-distance relation
for v in Nodes:
    for t in list(set(Types) - {"R"}):
        model += sum(Xt[u, t] for u in S[(v,t)]) >= Xt[v, "R"] 
model.solve()



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
        if Xt[v, t]:
            vertex_colors[v] = Type_colors[t]

print("$$$")
print(json.dumps(vertex_colors))
