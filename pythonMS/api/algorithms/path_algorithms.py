import heapq

def dijkstra_pathfinding(vertices, edges, source, target):
    """
    Computes the shortest path from source to target using Dijkstra's Algorithm.
    Returns a dict containing:
        - 'path_edges': list of (u, v) along the shortest path
        - 'distance': total path cost
        - 'path_nodes': ordered list of vertices on the path
    """

    # Build adjacency list with weights
    adj = {str(v["id"]): [] for v in vertices}
    for e in edges:
        u = e["from"]
        v = e["to"]
        w = float(e.get("weight", 1))
        if u in adj:
            adj[u].append((v, w))
        # comment this line if your graph is directed
        if v in adj:
            adj[v].append((u, w))

    # Priority queue (distance, node)
    pq = [(0, str(source))]
    dist = {str(v["id"]): float("inf") for v in vertices}
    prev = {}
    dist[str(source)] = 0

    while pq:
        current_dist, u = heapq.heappop(pq)
        if current_dist > dist[u]:
            continue

        if u == str(target):
            break  # we found shortest path to target

        for v, w in adj.get(u, []):
            alt = current_dist + w
            if alt < dist[v]:
                dist[v] = alt
                prev[v] = u
                heapq.heappush(pq, (alt, v))

    # Reconstruct path
    path_nodes = []
    u = str(target)
    while u in prev or u == str(source):
        path_nodes.append(u)
        if u == str(source):
            break
        u = prev.get(u)
    path_nodes.reverse()

    # Build path edges
    path_edges = [(path_nodes[i], path_nodes[i + 1]) for i in range(len(path_nodes) - 1)]

    total_distance = dist[str(target)] if dist[str(target)] != float("inf") else None

    return {
        "path_nodes": path_nodes,
        "path_edges": path_edges,
        "distance": total_distance,
    }