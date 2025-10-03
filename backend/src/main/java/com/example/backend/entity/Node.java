package com.example.backend.entity;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonBackReference;

@Entity
@Table(name = "nodes")
public class Node {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "node_id", nullable = false)
    private String nodeId; // This is the frontend node id

    @Column(nullable = false)
    private String label;

    @Column(nullable = false)
    private Integer size = 20;

    @Column(nullable = false)
    private String color = "#1976d2";

    @Column(name = "position_x")
    private Double positionX;

    @Column(name = "position_y")
    private Double positionY;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "graph_id", nullable = false)
    @JsonBackReference
    private Graph graph;

    public Node() {}

    public Node(String nodeId, String label, Graph graph) {
        this.nodeId = nodeId;
        this.label = label;
        this.graph = graph;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getNodeId() { return nodeId; }
    public void setNodeId(String nodeId) { this.nodeId = nodeId; }

    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }

    public Integer getSize() { return size; }
    public void setSize(Integer size) { this.size = size; }

    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }

    public Double getPositionX() { return positionX; }
    public void setPositionX(Double positionX) { this.positionX = positionX; }

    public Double getPositionY() { return positionY; }
    public void setPositionY(Double positionY) { this.positionY = positionY; }

    public Graph getGraph() { return graph; }
    public void setGraph(Graph graph) { this.graph = graph; }
}
