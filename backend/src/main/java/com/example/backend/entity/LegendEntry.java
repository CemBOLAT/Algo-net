package com.example.backend.entity;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonBackReference;

@Entity
@Table(name = "legend_entries")
public class LegendEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false) 
    private String name;

    @Column(nullable = false, length = 32)
    private String color;

    @Column(nullable = false)
    private Double capacity;

    @Column(nullable = false)
    private Double distance;

    @Column(name = "unit_distance", nullable = false)
    private Double unitDistance;

    @Column(nullable = false)
    private Double size;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "graph_id", nullable = false)
    @JsonBackReference
    private Graph graph;

    public LegendEntry() {}

    // getters/setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }

    public Double getCapacity() { return capacity; }
    public void setCapacity(Double capacity) { this.capacity = capacity; }

    public Double getDistance() { return distance; }
    public void setDistance(Double distance) { this.distance = distance; }

    public Double getUnitDistance() { return unitDistance; }
    public void setUnitDistance(Double unitDistance) { this.unitDistance = unitDistance; }

    public Double getSize() { return size; }
    public void setSize(Double size) { this.size = size; }

    public Graph getGraph() { return graph; }
    public void setGraph(Graph graph) { this.graph = graph; }
}
