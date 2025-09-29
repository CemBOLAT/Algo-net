package com.example.backend.service;

import com.example.backend.entity.Graph;
import com.example.backend.entity.Node;
import com.example.backend.entity.Edge;
import com.example.backend.entity.User;
import com.example.backend.repository.GraphRepository;
import com.example.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class GraphService {

    @Autowired
    private GraphRepository graphRepository;

    @Autowired
    private UserRepository userRepository;

    @Transactional
    public Graph saveGraph(String name, List<Map<String, Object>> nodes, List<Map<String, Object>> edges, Long userId) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (!userOpt.isPresent()) {
            throw new RuntimeException("User not found");
        }

        User user = userOpt.get();
        Graph graph = new Graph(name, user);

        // Save nodes
        for (Map<String, Object> nodeData : nodes) {
            Node node = new Node();
            node.setNodeId((String) nodeData.get("id"));
            node.setLabel((String) nodeData.get("label"));
            node.setSize((Integer) nodeData.getOrDefault("size", 20));
            node.setColor((String) nodeData.getOrDefault("color", "#1976d2"));
            node.setPositionX((Double) nodeData.get("x"));
            node.setPositionY((Double) nodeData.get("y"));
            node.setGraph(graph);
            graph.getNodes().add(node);
        }

        // Save edges
        for (Map<String, Object> edgeData : edges) {
            Edge edge = new Edge();
            edge.setEdgeId((String) edgeData.get("id"));
            edge.setFromNode((String) edgeData.get("from"));
            edge.setToNode((String) edgeData.get("to"));
            edge.setWeight(((Number) edgeData.getOrDefault("weight", 1.0)).doubleValue());
            edge.setIsDirected((Boolean) edgeData.getOrDefault("directed", false));
            edge.setShowWeight((Boolean) edgeData.getOrDefault("showWeight", true));
            edge.setGraph(graph);
            graph.getEdges().add(edge);
        }

        return graphRepository.save(graph);
    }

    public List<Graph> getUserGraphs(Long userId) {
        return graphRepository.findByUserIdOrderByUpdatedAtDesc(userId);
    }

    public Optional<Graph> getGraphById(Long id) {
        return graphRepository.findById(id);
    }

    public void deleteGraph(Long id) {
        graphRepository.deleteById(id);
    }
}
