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

    node_ids, adjacency = build_graph(vertices, edges)
    n = len(node_ids)

    if n == 0:
        print("$$$")
        print(json.dumps({}))
        sys.exit(0)

    V = range(n)
    K = range(1, n + 1)

    model = LpProblem(name="graph_coloring", sense=LpMinimize)
    x = {(v, k): LpVariable(name=f"x_{v}_{k}", cat=LpBinary) for v in V for k in K}
    y = {k: LpVariable(name=f"y_{k}", cat=LpBinary) for k in K}

    model += lpSum(y[k] for k in K)

    for v in V:
        model += lpSum(x[v, k] for k in K) == 1

    for v in V:
        for u_idx in adjacency.get(v, []):
            if u_idx <= v:
                continue
            for k in K:
                model += x[v, k] + x[u_idx, k] <= 1

    for v in V:
        for k in K:
            model += x[v, k] <= y[k]

    for k in range(2, n + 1):
        model += y[k] <= y[k - 1]

    model += x[0, 1] == 1

    solve_with_fallback(model)

    if model.status != pulp.LpStatusOptimal:
        print("$$$")
        print(json.dumps({}))
        sys.exit(0)

    assignments = {}
    max_color = 0
    for v in V:
        assigned = None
        for k in K:
            if x[v, k].value() is not None and x[v, k].value() > 0.5:
                assigned = k
                break
        if assigned is None:
            continue
        assignments[node_ids[v]] = assigned
        if assigned > max_color:
            max_color = assigned

    color_map = {vid: color_for(col, max_color) for vid, col in assignments.items()}

    print("$$$")
    print(json.dumps(color_map))
