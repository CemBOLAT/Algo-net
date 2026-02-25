import networkx as nx
import random

def generate_random_graph(graph_type, num_nodes, **kwargs):
    """
    Generate a random graph using NetworkX.
    Supported types: erdos_renyi, watts_strogatz, barabasi_albert
    Returns dict mapping node/edge configurations to be consumed by Frontend.
    """
    if num_nodes <= 0:
        return {"nodes": [], "edges": []}

    try:
        # Determine generation method
        if graph_type == 'erdos_renyi':
            prob = kwargs.get('prob', 0.2)
            G = nx.erdos_renyi_graph(num_nodes, prob)
        elif graph_type == 'watts_strogatz':
            k = kwargs.get('k', min(4, num_nodes - 1))
            p = kwargs.get('prob', 0.1)
            G = nx.watts_strogatz_graph(num_nodes, k, p)
        elif graph_type == 'barabasi_albert':
            m = kwargs.get('m', max(1, min(2, num_nodes - 1)))
            G = nx.barabasi_albert_graph(num_nodes, m)
        else:
            # Default fallback: simply connect a path or small tree for visual
            G = nx.path_graph(num_nodes)

        # Force a spring layout for initial coordinates
        pos = nx.spring_layout(G, scale=200, center=(300, 300))

        # Build response formatted for the app
        nodes = []
        for i in G.nodes():
            nodes.append({
                "id": str(i + 1),
                "label": f"V{i + 1}",
                "x": float(pos[i][0]),
                "y": float(pos[i][1]),
                "color": "#1976d2",
                "size": 15
            })

        edges = []
        for i, (u, v) in enumerate(G.edges()):
            # Weight is random 1 to 20 just to populate demo visually
            edges.append({
                "id": f"e_rnd_{i}",
                "from": str(u + 1),
                "to": str(v + 1),
                "weight": random.randint(1, 20),
                "directed": False,
                "color": "#BDBDBD"
            })

        return {
            "nodes": nodes,
            "edges": edges
        }
    except Exception as e:
        print(f"Error generating graph: {e}")
        return {"nodes": [], "edges": [], "error": str(e)}
