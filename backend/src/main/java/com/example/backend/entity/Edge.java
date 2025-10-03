package com.example.backend.entity;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonBackReference;

@Entity
@Table(name = "edges")
public class Edge {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "edge_id", nullable = false)
    private String edgeId; // This is the frontend edge id

    @Column(nullable = false)
    private Double weight = 1.0;

    @Column(name = "is_directed", nullable = false)
    private Boolean isDirected = false;

    @Column(name = "from_node", nullable = false)
    private String fromNode;

    @Column(name = "to_node", nullable = false)
    private String toNode;

    @Column(name = "show_weight", nullable = false)
    private Boolean showWeight = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "graph_id", nullable = false)
    @JsonBackReference
    private Graph graph;

    public Edge() {}

    public Edge(String edgeId, String fromNode, String toNode, Graph graph) {
        this.edgeId = edgeId;
        this.fromNode = fromNode;
        this.toNode = toNode;
        this.graph = graph;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getEdgeId() { return edgeId; }
    public void setEdgeId(String edgeId) { this.edgeId = edgeId; }

    public Double getWeight() { return weight; }
    public void setWeight(Double weight) { this.weight = weight; }

    public Boolean getIsDirected() { return isDirected; }
    public void setIsDirected(Boolean isDirected) { this.isDirected = isDirected; }

    public String getFromNode() { return fromNode; }
    public void setFromNode(String fromNode) { this.fromNode = fromNode; }

    public String getToNode() { return toNode; }
    public void setToNode(String toNode) { this.toNode = toNode; }

    public Boolean getShowWeight() { return showWeight; }
    public void setShowWeight(Boolean showWeight) { this.showWeight = showWeight; }

    public Graph getGraph() { return graph; }
    public void setGraph(Graph graph) { this.graph = graph; }
}
