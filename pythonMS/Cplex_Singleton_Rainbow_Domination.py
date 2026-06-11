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


def solve_with_fallback(problem, time_limit=None):
    # Cap solve time so the MIP returns its best incumbent instead of running
    # until the HTTP gateway times out (504). Configurable via SOLVER_TIME_LIMIT.
    if time_limit is None:
        try:
            time_limit = float(os.environ.get("SOLVER_TIME_LIMIT", "30"))
        except (TypeError, ValueError):
            time_limit = 30.0

    try_cplex_env = os.environ.get("INSTALL_CPLEX", "false").lower() in ("1", "true", "yes")
    if try_cplex_env:
        try:
            import cplex
            solver = pulp.CPLEX_PY(msg=False, timeLimit=time_limit)
            return problem.solve(solver)
        except Exception:
            pass
    try:
        solver = pulp.PULP_CBC_CMD(msg=False, timeLimit=time_limit)
        return problem.solve(solver)
    except Exception:
        pass
    try:
        solver = pulp.GLPK_CMD(msg=False, options=["--tmlim", str(int(time_limit))])
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


def is_feasible(assignment, neighbors, V, K):
    """Valid k-rainbow domination iff every UNCOLORED vertex has all K colors
    present among its neighbors."""
    needed = set(range(1, K + 1))
    for v in V:
        if assignment.get(v):
            continue  # colored vertices are always satisfied
        seen = set()
        for u in neighbors[v]:
            seen.update(assignment.get(u, ()))
        if not needed.issubset(seen):
            return False
    return True


def greedy_rainbow(neighbors, V, K):
    """Always-valid fallback: color a vertex (one color) whenever it is uncolored
    and its neighborhood does not yet cover all K colors. The result is guaranteed
    to be a valid (singleton) k-rainbow dominating function, though not optimal."""
    needed = set(range(1, K + 1))
    assignment = {}
    for v in V:
        seen = set()
        for u in neighbors[v]:
            seen.update(assignment.get(u, ()))
        if not needed.issubset(seen):
            assignment[v] = [1]
    return assignment


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

    # Precompute neighbor lists ONCE (1-indexed) from the sparse adjacency.
    # Previously this was rebuilt inside the v×k loop → O(n^2 * K) Python overhead.
    neighbors = {v: [u + 1 for u in adjacency.get(v - 1, ())] for v in V}

    model = LpProblem(name="singleton_k_rainbow_domination", sense=LpMinimize)

    # f[v][k] = 1 if color k is assigned to vertex v.
    f = {(v, k): LpVariable(name=f"f_{v}_{k}", cat=LpBinary) for v in V for k in Colors}

    # Objective: minimize the total weight Σ_v Σ_k f[v,k].
    # With the singleton constraint below, this equals the number of colored
    # vertices, i.e. the singleton k-rainbow domination number.
    # NOTE: the previous z[v] variables plus the linking / reverse-linking
    # constraints were redundant — singleton already makes Σ_k f[v,k] act as z[v],
    # so they are dropped. This roughly halves the model size.
    model += lpSum(f[v, k] for v in V for k in Colors)

    # Domination: if v has no color (Σ_k f[v,k] = 0), every color must appear
    # among its neighbors. If v is colored, the RHS becomes <= 0 (trivially true).
    for v in V:
        nb = neighbors[v]
        own = lpSum(f[v, j] for j in Colors)
        for k in Colors:
            model += lpSum(f[u, k] for u in nb) >= 1 - own

    # Singleton: at most one color per vertex.
    for v in V:
        model += lpSum(f[v, k] for k in Colors) <= 1

    solve_with_fallback(model)

    # Read the (possibly time-limited) ILP solution, rounding values to integers.
    # Singleton: keep at most one color per vertex.
    assignment = {}
    for v in V:
        cols = [k for k in Colors if (f[v, k].value() or 0) > 0.5]
        if cols:
            assignment[v] = cols[:1]

    # The time limit can make the solver stop on a fractional / partial solution
    # whose rounding violates the rainbow condition (an uncolored vertex whose
    # neighbors don't cover all colors). Verify and, if invalid, fall back to a
    # construction that is guaranteed to be a valid k-rainbow domination.
    if not is_feasible(assignment, neighbors, V, K):
        assignment = greedy_rainbow(neighbors, V, K)

    full_assignments = {}
    max_color = 0
    for v in V:
        cols = assignment.get(v)
        if cols:
            full_assignments[node_ids[v - 1]] = cols
            if cols[0] > max_color:
                max_color = cols[0]

    color_map = {vid: color_for(cols[0], max(max_color, K)) for vid, cols in full_assignments.items()}

    print("$$$")
    print(json.dumps({"colors": color_map, "assignments": full_assignments}))