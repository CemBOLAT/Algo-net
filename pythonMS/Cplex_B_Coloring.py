import json
import os
import sys
import colorsys
import pulp
from pulp import LpProblem, LpVariable, LpBinary, lpSum, LpMaximize

# Distinctive, saturated colors. Blue / cyan / teal tones are intentionally left
# out because the default (uncolored) vertex color is blue — color classes must
# not be confused with uncolored nodes. Pale/low-contrast entries removed too.
COLOR_PALETTE = [
    "#e6194b",  # red
    "#f58231",  # orange
    "#ffe119",  # yellow
    "#bfef45",  # lime
    "#3cb44b",  # green
    "#f032e6",  # magenta
    "#911eb4",  # purple
    "#e67e22",  # carrot
    "#d6336c",  # rose
    "#9a6324",  # brown
    "#808000",  # olive
    "#800000",  # maroon
    "#c0392b",  # brick red
    "#6d4c41",  # dark brown
    "#ad1457",  # deep pink
]

def solve_with_fallback(problem):
    try_cplex_env = os.environ.get("INSTALL_CPLEX", "false").lower() in ("1", "true", "yes")
    if try_cplex_env:
        try:
            import cplex
            solver = pulp.CPLEX_PY(msg=False)
            return problem.solve(solver)
        except Exception:
            pass
    try:
        solver = pulp.PULP_CBC_CMD(msg=False)
        return problem.solve(solver)
    except Exception:
        pass
    try:
        solver = pulp.GLPK_CMD(msg=False)
        return problem.solve(solver)
    except Exception:
        pass
    raise RuntimeError("No available MIP solver (CPLEX/CBC/GLPK).")

def color_for(index, total_colors):
    if index <= len(COLOR_PALETTE):
        return COLOR_PALETTE[index - 1]
    hue = ((index - 1) * 360) / max(1, total_colors)
    r, g, b = colorsys.hls_to_rgb(hue / 360.0, 0.5, 0.7)
    return "#{:02x}{:02x}{:02x}".format(int(r * 255), int(g * 255), int(b * 255))

def build_graph(vertices, edges):
    node_ids = [str(v.get("id")) for v in vertices if v.get("id") is not None]
    id_to_index = {vid: i for i, vid in enumerate(node_ids)}
    adjacency = {i: set() for i in range(len(node_ids))}
    for e in edges:
        a = e.get("from")
        b = e.get("to")
        if a is None or b is None:
            continue
        a = str(a)
        b = str(b)
        if a not in id_to_index or b not in id_to_index:
            continue
        ia = id_to_index[a]
        ib = id_to_index[b]
        if ia == ib:
            continue
        adjacency[ia].add(ib)
        adjacency[ib].add(ia)
    return node_ids, adjacency

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Missing input file argument", file=sys.stderr)
        sys.exit(1)

    with open(sys.argv[1], "r", encoding="utf-8") as f:
        data = json.load(f)

    vertices = data.get("vertices", [])
    edges = data.get("edges", [])

    node_ids, adjacency = build_graph(vertices, edges)
    n = len(node_ids)

    if n == 0:
        print("$$$")
        print(json.dumps({}))
        sys.exit(0)

    V = range(1, n + 1)

    model = LpProblem(name="b_coloring", sense=LpMaximize)

    # x[i,j] = 1 if vertex j belongs to color class represented by i
    # x[i,i] = 1 if vertex i is a representative (b-vertex)
    x = {(i, j): LpVariable(name=f"x_{i}_{j}", cat=LpBinary) for i in V for j in V}

    model += lpSum(x[i, i] for i in V)

    adj = [[0] * n for _ in range(n)]
    for u in range(n):
        for v in adjacency.get(u, []):
            adj[u][v] = 1

    for j in V:
        valid_reps = [i for i in V if adj[i - 1][j - 1] == 0 or i == j]
        model += lpSum(x[i, j] for i in valid_reps) == 1

    for i in V:
        for j in V:
            for k in V:
                if j < k and adj[j - 1][k - 1] == 1:
                    model += x[i, j] + x[i, k] <= x[i, i]

    for i in V:
        for j in V:
            if i != j:
                model += x[i, j] <= x[i, i]

    for i in V:
        for j in V:
            if i != j:
                neighbors_of_j = [k for k in V if adj[j - 1][k - 1] == 1]
                if neighbors_of_j:
                    model += lpSum(x[i, k] for k in neighbors_of_j) >= x[i, i] + x[j, j] - 1
    solve_with_fallback(model)

    if model.status != pulp.LpStatusOptimal:
        print("$$$")
        print(json.dumps({}))
        sys.exit(0)

    assignments = {}
    max_color = 0
    for j in V:
        assigned = None
        for i in V:
            if x[i, j].value() is not None and x[i, j].value() > 0.5:
                assigned = i
                break
        if assigned is None:
            continue
        assignments[node_ids[j - 1]] = assigned
        if assigned > max_color:
            max_color = assigned

    color_map = {vid: color_for(col, max_color) for vid, col in assignments.items()}

    print("$$$")
    print(json.dumps(color_map))
