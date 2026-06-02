import json
import os
import sys
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
    k = data.get("k", 1)  # domination degree

    node_ids, adjacency = build_graph(vertices, edges)
    n = len(node_ids)

    if n == 0:
        print("$$$")
        print(json.dumps({}))
        sys.exit(0)

    V = range(n)

    model = LpProblem(name="k_domination", sense=LpMinimize)

    # x[v] = 1 if vertex v is in the domination set
    x = {v: LpVariable(name=f"x_{v}", cat=LpBinary) for v in V}

    # Objective: minimize the size of the domination set
    model += lpSum(x[v] for v in V)

    # k-domination constraint:
    # Every vertex must either be in the set, or have at least k neighbors in the set.
    # If x[v] = 1 then k*x[v] = k makes the constraint trivially satisfied.
    for v in V:
        neighbor_indices = list(adjacency.get(v, []))
        model += lpSum(x[u] for u in neighbor_indices) + k * x[v] >= k

    solve_with_fallback(model)

    if model.status != pulp.LpStatusOptimal:
        print("$$$")
        print(json.dumps({}))
        sys.exit(0)

    color_on = COLOR_PALETTE[0]
    color_map = {}

    # Only vertices in the domination set are colored.
    # Non-selected vertices are left untouched (default color) and therefore
    # do not appear in the "colors used" summary.
    for v in V:
        vid = node_ids[v]
        selected = x[v].value() is not None and x[v].value() > 0.5
        if selected:
            color_map[vid] = color_on

    print("$$$")
    print(json.dumps(color_map))
