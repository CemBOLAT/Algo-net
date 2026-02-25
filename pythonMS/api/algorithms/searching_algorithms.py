def dfs(vertices, edges, source, target):
    
    adj = {v["id"]: set() for v in vertices if "id" in v}
    for e in edges:
        a = e.get("from")
        b = e.get("to")
        is_directed = e.get("directed", False)
        if not a or not b:
            continue
        adj.setdefault(a, set()).add(b)
        if not is_directed:
            adj.setdefault(b, set()).add(a)
    visited = set()
    path = []
    stack = [(source, [source])]  # stack of (node, path_so_far)

    visited_order = []

    while stack:
        node, current_path = stack.pop()
        if node in visited:
            continue
        visited.add(node)
        visited_order.append(node)

        if node == target:
            return {
                "path": current_path,
                "visited_order": visited_order
            }

        for neighbor in sorted(adj.get(node, []), reverse=True):
            if neighbor not in visited:
                stack.append((neighbor, current_path + [neighbor]))

    # if target not reachable
    return {
        "path": [],
        "visited_order": visited_order
    }
def bfs(vertices, edges, source, target):
    adj = {v["id"]: set() for v in vertices if "id" in v}
    for e in edges:
        a = e.get("from")
        b = e.get("to")
        is_directed = e.get("directed", False)
        if not a or not b:
            continue
        adj.setdefault(a, set()).add(b)
        if not is_directed:
            adj.setdefault(b, set()).add(a)
            
    visited = set()
    queue = [(source, [source], 0)]  # queue of (node, path_so_far, depth)
    visited_order = []
    
    # Track depth of each node for coloring
    node_depths = {source: 0}
    max_depth = 0

    target_path = []

    while queue:
        node, current_path, current_depth = queue.pop(0)
        if node in visited:
            continue
        visited.add(node)
        visited_order.append(node)
        
        # Update node depth if seen first time or at lower depth
        if node not in node_depths or current_depth < node_depths[node]:
             node_depths[node] = current_depth
        max_depth = max(max_depth, current_depth)

        if node == target and not target_path:
            target_path = current_path
            # We don't return immediately, want to map all layers first
            # but we can stop expanding if we just want shortest path.
            # Usually BFS expands fully until queue empty to show all.

        # neighbors sorted to ensure deterministic behavior
        for neighbor in sorted(adj.get(node, [])):
            if neighbor not in visited:
                queue.append((neighbor, current_path + [neighbor], current_depth + 1))

    # Generate a distinct color map for each depth layer
    # BFS layer coloring (e.g. from Red -> Orange -> Yellow -> Green -> Blue)
    colors = {}
    
    if max_depth == 0:
        colors[source] = "#f44336"  # red
    else:
        for node, depth in node_depths.items():
            # Interpolate hue based on depth percentage 
            # Hue from 0 (red) to 240 (blue)
            ratio = min(depth / max_depth, 1.0)
            hue = int(ratio * 240)
            colors[node] = f"hsl({hue}, 80%, 50%)"

    return {
        "path": target_path,
        "visited_order": visited_order,
        "colors": colors
    }
