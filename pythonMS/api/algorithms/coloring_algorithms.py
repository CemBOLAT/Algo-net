COLOR_PALETTE = [
        "#e6194b", "#3cb44b", "#ffe119", "#4363d8", "#f58231",
        "#911eb4", "#46f0f0", "#f032e6", "#bcf60c", "#fabebe",
        "#008080", "#e6beff", "#9a6324", "#fffac8", "#800000",
    ]


def greedy_coloring(vertices, edges):
    # coloring_algorithms.py

    """
    Simple greedy coloring algorithm.
    Input:
        vertices: list of ids or objects with 'id' field
        edges: list of [u, v] or {source, target}
    Output:
        dict mapping { vertex_id: color }
    """
    adj = {v["id"]: set() for v in vertices if "id" in v}

    for e in edges:
        a = str(e.get("from"))
        b = str(e.get("to"))
        if not a or not b:
            continue

        if a not in adj:
            adj[a] = set()
        if b not in adj:
            adj[b] = set()

        # Undirected graph
        adj[a].add(b)
        adj[b].add(a)
    

    sorted_vertices = sorted(adj.keys(), key=lambda v: len(adj[v]), reverse=True)

    color_map = {}

    for v in sorted_vertices:
        used_colors = {color_map[n] for n in adj[v] if n in color_map}

        # pick first available color
        chosen_color = next((c for c in COLOR_PALETTE if c not in used_colors), None)

        if chosen_color is None:
            # fallback: deterministic color generation
            chosen_color = "#{:06x}".format(abs(hash(v)) % 0xFFFFFF)

        color_map[v] = chosen_color

    return color_map

    
    
