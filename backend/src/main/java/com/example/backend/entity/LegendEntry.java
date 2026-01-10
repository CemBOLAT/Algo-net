package com.example.backend.entity;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonBackReference;
import java.util.Map;
import java.util.HashMap;

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

    @Column(nullable = true)
    private Double capacity;

    @Column(nullable = true)
    private Double distance;

    // Allow null from JPA perspective; we'll normalize to 0.0 on persist/update.
    @Column(name = "unit_distance", nullable = true)
    private Double diameter;

    @Column(name = "size")
    private Double size;

    // New: arbitrary attributes (key/value) persisted in a separate table.
    // Keep it EAGER to avoid LazyInitializationException during JSON serialization.
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(
        name = "legend_entry_attributes",
        joinColumns = @JoinColumn(name = "legend_entry_id")
    )
    @MapKeyColumn(name = "attr_key")
    @Column(name = "attr_value", length = 255)
    private Map<String, String> attributes = new HashMap<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "graph_id", nullable = false)
    @JsonBackReference
    private Graph graph;

    public LegendEntry() {}

    @PrePersist
    @PreUpdate
    protected void normalize() {
        // Avoid NOT NULL DB failures
        if (this.name == null || this.name.isBlank()) this.name = "Legend";
        if (this.color == null || this.color.isBlank()) this.color = "#1976d2";
        if (this.capacity == null) this.capacity = 0.0;
        if (this.distance == null) this.distance = 0.0;
        if (this.diameter == null) this.diameter = 0.0;

        if (this.attributes == null) this.attributes = new HashMap<>();
        // Trim invalid keys, keep zero values as they are allowed.
        this.attributes.entrySet().removeIf(e -> e.getKey() == null || e.getKey().trim().isEmpty());
    }

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

    public Double getUnitDistance() { return diameter; }
    public void setUnitDistance(Double diameter) { this.diameter = diameter; }

    public Double getDiameter() { return diameter; } // convenience for Jackson/backward compatibility
    public void setDiameter(Double diameter) { this.diameter = diameter; }

    public Graph getGraph() { return graph; }
    public void setGraph(Graph graph) { this.graph = graph; }

    public Double getSize() { return size; }
    public void setSize(Double size) { this.size = size; }

    // New getters/setters for attributes
    public Map<String, String> getAttributes() { return attributes; }
    public void setAttributes(Map<String, String> attributes) { this.attributes = attributes; }
}
