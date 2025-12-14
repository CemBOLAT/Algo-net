import itertools
import json
import os

import networkx as nx
import pulp
from pulp import LpMinimize, LpProblem, LpVariable, lpSum, LpBinary, LpInteger
import sys


def json_to_networkx_simple_undirected(json_data):
    if isinstance(json_data, str):
        data = json.loads(json_data)
    elif isinstance(json_data, dict):
        data = json_data
    else:
        raise TypeError("Input must be a JSON string or a dictionary.")

    G = nx.Graph()

    for node in data.get('vertices', []):
        node_id = node['id']
        attributes = {k: v for k, v in node.items() if k != 'id'}
        G.add_node(node_id, **attributes)

    for edge in data.get('edges', []):
        source = edge['from']
        target = edge['to']

        attributes = {k: v for k, v in edge.items() if k not in ['from', 'to']}
        G.add_edge(source, target, **attributes)

    return G

def solve_packing_coloring(G):
    """
    Solves the packing coloring problem on graph G.

    Parameters:
      - G: a NetworkX graph.

    Returns:
      - color_assignment: a dictionary mapping each vertex to its assigned color.
      - z_val: the packing chromatic number of the graph.
    """
    k = G.number_of_nodes()

    # Create the optimization model.
    model = LpProblem(name='PackingColoring', sense=LpMinimize)

    # Decision variables: x[(v, i)] equals 1 if vertex v is assigned color i, 0 otherwise.
    x = {(v, i): LpVariable(name=f"x_{v}_{i}", cat=LpBinary) for v in G.nodes for i in range(1, k + 1)}

    # Variable z representing the maximum color used (1 to k).
    z = LpVariable(name="z", lowBound=1, upBound=k, cat=LpInteger)

    # Objective: minimize z (the maximum color number used).
    model += z

    # Constraint (2): Each vertex must receive exactly one color.
    for v in G.nodes:
        model += lpSum(x[(v, i)] for i in range(1, k + 1)) == 1, f"OneColor_{v}"

    # Constraint (3): For every pair of distinct vertices (v,u) and each color i,
    # if the distance between v and u is <= i, they cannot both be assigned color i.
    for i in range(1, k + 1):
        for v, u in itertools.combinations(G.nodes, 2):
            try:
                d = nx.shortest_path_length(G, source=v, target=u)
            except nx.NetworkXNoPath:
                continue  # No path => no constraint needed
            if d <= i:
                model += x[(v, i)] + x[(u, i)] <= 1, f"Pack_{v}_{u}_color_{i}"

    # Constraint (4): If a vertex v is assigned color i then i must be <= z.
    for v in G.nodes:
        for i in range(1, k + 1):
            model += i * x[(v, i)] <= z, f"MaxColor_{v}_{i}"

    # Solve the model
    solve_with_fallback(model)

    if model.status == pulp.LpStatusOptimal:  # Optimal solution found
        z_val = z.varValue

        # Extract color assignment for each vertex.
        color_assignment = {}
        for v in G.nodes:
            for i in range(1, k + 1):
                if x[(v, i)].varValue > 0.5:
                    color_assignment[v] = i
                    break
        return color_assignment, z_val
    else:
        return None, None


def solve_with_fallback(problem):
    """
    Try to solve with CPLEX if available and requested; otherwise fallback to CBC, then GLPK.
    If no solver available, write LP and raise an informative error.
    """
    # Respect explicit env var to try CPLEX: INSTALL_CPLEX=true or '1'
    try_cplex_env = os.environ.get("INSTALL_CPLEX", "false").lower() in ("1", "true", "yes")
    if try_cplex_env:
        try:
            import cplex  # check if python cplex module exists
            solver = pulp.CPLEX_PY(msg=False)
            print("Attempting solve with CPLEX_PY...")
            return problem.solve(solver)
        except Exception as e:
            print(f"CPLEX requested but not available or failed: {e}. Falling back to CBC.")

    # Fallback 1: CBC (local binary). Ensure coinor-cbc installed in image.
    try:
        solver = pulp.PULP_CBC_CMD(msg=False)
        print("Attempting solve with PULP_CBC_CMD...")
        return problem.solve(solver)
    except Exception as e:
        print(f"CBC solver failed or not available: {e}. Trying GLPK...")

    # Fallback 2: GLPK if present
    try:
        solver = pulp.GLPK_CMD(msg=False)
        print("Attempting solve with GLPK_CMD...")
        return problem.solve(solver)
    except Exception as e:
        print(f"GLPK solver failed or not available: {e}.")

    # Final fallback: export LP and raise
    try:
        problem.writeLP("package_coloring_fallback.lp")
        print("No solver available. Wrote LP to 'package_coloring_fallback.lp'.")
    except Exception as e:
        print(f"Failed to write LP file: {e}")

    raise RuntimeError("No available MIP solver (CPLEX/CBC/GLPK). Install a solver or set INSTALL_CPLEX appropriately.")


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Missing input file argument", file=sys.stderr)
        sys.exit(1)

    with open(sys.argv[1], "r", encoding="utf-8") as f:
        data_variable = json.load(f)
        colors, pcn = solve_packing_coloring(json_to_networkx_simple_undirected(data_variable))
        print("$$$")
        print(json.dumps(colors))
