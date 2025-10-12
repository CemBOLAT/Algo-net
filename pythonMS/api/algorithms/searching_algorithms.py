def dfs(vertices, edges, source, target):
    
    adj = {v["id"]: set() for v in vertices if "id" in v}
    for e in edges:
        a = e.get("from")
        b = e.get("to")
        if not a or not b:
            continue
        adj.setdefault(a, set()).add(b)

        
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