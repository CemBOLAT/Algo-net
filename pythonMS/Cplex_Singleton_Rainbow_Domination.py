import json
import os
import sys
import colorsys
import pulp
from pulp import LpProblem, LpVariable, LpBinary, lpSum, LpMinimize

COLOR_PALETTE = [
    "#e6194b", "#3cb44b", "#ffe119", "#4363d8", "#f58231",
    "#911eb4", "#46f0f0", "#f032e6", "#bcf60c", "#fabebe",
    "#008080", "#e6beff", "#9a6324", "#fffac8", "#800000",
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
    K = data.get("k", 3)

    node_ids, adjacency = build_graph(vertices, edges)
    n = len(node_ids)

    if n == 0:
        print("$$$")
        print(json.dumps({}))
        sys.exit(0)

    V = range(1, n + 1)
    Colors = range(1, K + 1)

    adj = [[0] * n for _ in range(n)]
    for u in range(n):
        for v in adjacency.get(u, []):
            adj[u][v] = 1

    model = LpProblem(name="k_rainbow_domination", sense=LpMinimize)

    # f[v][k] = 1 if color k is in the set assigned to vertex v
    f = {(v, k): LpVariable(name=f"f_{v}_{k}", cat=LpBinary) for v in V for k in Colors}

    # z[v] = 1 if vertex v has a non-empty color set
    z = {v: LpVariable(name=f"z_{v}", cat=LpBinary) for v in V}

    # Objective: minimize number of vertices with non-empty sets
    model += lpSum(z[v] for v in V)

    # Constraint 1 - Domination:
    # If v's set is empty (z[v]=0), then for every color k,
    # at least one neighbor of v must have k in its set.
    for v in V:
        for k in Colors:
            neighbors_of_v = [u for u in V if adj[u - 1][v - 1] == 1]
            model += lpSum(f[u, k] for u in neighbors_of_v) >= 1 - z[v]

    # Constraint 2 - Linking:
    # If f[v][k] = 1 then z[v] must be 1
    for v in V:
        for k in Colors:
            model += z[v] >= f[v, k]

    # Constraint 3 - Reverse Linking:
    # If z[v] = 1 then at least one color must be assigned to v
    for v in V:
        model += lpSum(f[v, k] for k in Colors) >= z[v]

    # Constraint 4 - Singleton:
    # Each vertex can have at most one color in its set
    for v in V:
        model += lpSum(f[v, k] for k in Colors) <= 1

    solve_with_fallback(model)

    if model.status != pulp.LpStatusOptimal:
        print("$$$")
        print(json.dumps({}))
        sys.exit(0)

    full_assignments = {}
    max_color = 0
    for v in V:
        vertex_colors = []
        for k in Colors:
            if f[v, k].value() is not None and f[v, k].value() > 0.5:
                vertex_colors.append(k)
        if vertex_colors:
            full_assignments[node_ids[v - 1]] = vertex_colors
            if vertex_colors[0] > max_color:
                max_color = vertex_colors[0]

    color_map = {vid: color_for(cols[0], max(max_color, K)) for vid, cols in full_assignments.items()}

    print("$$$")
    print(json.dumps({"colors": color_map, "assignments": full_assignments}))