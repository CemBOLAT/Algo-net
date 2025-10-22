package com.example.backend.controller;

import com.example.backend.entity.Graph;
import com.example.backend.entity.Node;
import com.example.backend.entity.Edge;
import com.example.backend.entity.User;
import com.example.backend.entity.LegendEntry;
import com.example.backend.repository.GraphRepository;
import com.example.backend.repository.UserRepository;
import com.example.backend.service.JwtService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.transaction.annotation.Transactional;
import java.util.LinkedHashMap;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/graphs")
public class GraphController {

    @Autowired
    private GraphRepository graphRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtService jwtService;

    @PersistenceContext
    private EntityManager entityManager;

    // DTO classes for request/response
    public static class SaveGraphRequest {
        private String name;
        private List<NodeDTO> nodes;
        private List<EdgeDTO> edges;
        // legend fields
        private Boolean hasLegend;
        private List<LegendEntryDTO> legendEntries;

        // Getters and setters
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public List<NodeDTO> getNodes() { return nodes; }
        public void setNodes(List<NodeDTO> nodes) { this.nodes = nodes; }
        public List<EdgeDTO> getEdges() { return edges; }
        public void setEdges(List<EdgeDTO> edges) { this.edges = edges; }
        public Boolean getHasLegend() { return hasLegend; }
        public void setHasLegend(Boolean hasLegend) { this.hasLegend = hasLegend; }
        public List<LegendEntryDTO> getLegendEntries() { return legendEntries; }
        public void setLegendEntries(List<LegendEntryDTO> legendEntries) { this.legendEntries = legendEntries; }
    }

    public static class NodeDTO {
        private String nodeId;
        private String label;
        private Integer size;
        private String color;
        private Double positionX;
        private Double positionY;

        // Getters and setters
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
    }

    public static class EdgeDTO {
        private String edgeId;
        private String fromNode;
        private String toNode;
        private Double weight;
        private Boolean isDirected;
        private Boolean showWeight;

        // Getters and setters
        public String getEdgeId() { return edgeId; }
        public void setEdgeId(String edgeId) { this.edgeId = edgeId; }
        public String getFromNode() { return fromNode; }
        public void setFromNode(String fromNode) { this.fromNode = fromNode; }
        public String getToNode() { return toNode; }
        public void setToNode(String toNode) { this.toNode = toNode; }
        public Double getWeight() { return weight; }
        public void setWeight(Double weight) { this.weight = weight; }
        public Boolean getIsDirected() { return isDirected; }
        public void setIsDirected(Boolean isDirected) { this.isDirected = isDirected; }
        public Boolean getShowWeight() { return showWeight; }
        public void setShowWeight(Boolean showWeight) { this.showWeight = showWeight; }
    }

    public static class LegendEntryDTO {
        private String name;
        private String color;
        private Double capacity;
        private Double distance;
        private Double unitDistance;

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
    }

    @PostMapping("/save")
    public ResponseEntity<?> saveGraph(
            @RequestHeader(name = "Authorization", required = false) String authorization,
            @Valid @RequestBody SaveGraphRequest request) {

        // Header protection - check for authorization token
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            return error(HttpStatus.UNAUTHORIZED, "NO_TOKEN", "Token bulunamadı");
        }

        String token = authorization.substring(7).trim();
        try {
            // Validate JWT and get user
            Map<String, Object> claims = jwtService.parseClaims(token);
            Long userId = Long.parseLong((String) claims.get("sub"));
            Optional<User> userOpt = userRepository.findById(userId);
            
            if (userOpt.isEmpty()) {
                return error(HttpStatus.UNAUTHORIZED, "USER_NOT_FOUND", "Kullanıcı bulunamadı");
            }

            User user = userOpt.get();

            // Create and save graph
            Graph graph = new Graph(request.getName(), user);
            
            // Save nodes
            if (request.getNodes() != null) {
                for (NodeDTO nodeDTO : request.getNodes()) {
                    Node node = new Node(nodeDTO.getNodeId(), nodeDTO.getLabel(), graph);
                    node.setSize(nodeDTO.getSize() != null ? nodeDTO.getSize() : 20);
                    node.setColor(nodeDTO.getColor() != null ? nodeDTO.getColor() : "#1976d2");
                    node.setPositionX(nodeDTO.getPositionX());
                    node.setPositionY(nodeDTO.getPositionY());
                    graph.getNodes().add(node);
                }
            }

            // Save edges
            if (request.getEdges() != null) {
                for (EdgeDTO edgeDTO : request.getEdges()) {
                    Edge edge = new Edge(edgeDTO.getEdgeId(), edgeDTO.getFromNode(), edgeDTO.getToNode(), graph);
                    edge.setWeight(edgeDTO.getWeight() != null ? edgeDTO.getWeight() : 1.0);
                    edge.setIsDirected(edgeDTO.getIsDirected() != null ? edgeDTO.getIsDirected() : false);
                    edge.setShowWeight(edgeDTO.getShowWeight() != null ? edgeDTO.getShowWeight() : true);
                    graph.getEdges().add(edge);
                }
            }

            // legend
            graph.setHasLegend(Boolean.TRUE.equals(request.getHasLegend()) && request.getLegendEntries() != null && !request.getLegendEntries().isEmpty());
            if (graph.isHasLegend()) {
                for (LegendEntryDTO dto : request.getLegendEntries()) {
                    if (dto == null) continue;
                    LegendEntry le = new LegendEntry();
                    le.setGraph(graph);
                    le.setName(dto.getName());
                    le.setColor(dto.getColor());
                    le.setCapacity(dto.getCapacity());
                    le.setDistance(dto.getDistance());
                    le.setUnitDistance(dto.getUnitDistance());
                    le.setSize(dto.getSize());
                    graph.getLegendEntries().add(le);
                }
            }

            Graph savedGraph = graphRepository.save(graph);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Graph başarıyla kaydedildi");
            response.put("graphId", savedGraph.getId());
            response.put("graphName", savedGraph.getName());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return error(HttpStatus.UNAUTHORIZED, "INVALID_TOKEN", "Token geçersiz veya süresi dolmuş");
        }
    }

    @GetMapping("/user")
    public ResponseEntity<?> getUserGraphs(
            @RequestHeader(name = "Authorization", required = false) String authorization,
            @RequestParam(name = "range", required = false) String range,
            @RequestParam(name = "page", required = false) Integer page,
            @RequestParam(name = "size", required = false) Integer size) {

        if (authorization == null || !authorization.startsWith("Bearer ")) {
            return error(HttpStatus.UNAUTHORIZED, "NO_TOKEN", "Token bulunamadı");
        }

        String token = authorization.substring(7).trim();
        try {
            Map<String, Object> claims = jwtService.parseClaims(token);
            Long userId = Long.parseLong((String) claims.get("sub"));

            // parse pagination
            boolean paginate = false;
            int offset = 0;
            int limit = 0;

            if (range != null && !range.isBlank()) {
                try {
                    String[] parts = range.split("-");
                    if (parts.length != 2) {
                        return error(HttpStatus.BAD_REQUEST, "INVALID_RANGE", "Geçersiz range formatı. Örnek: 1-10");
                    }
                    int start = Integer.parseInt(parts[0].trim());
                    int end = Integer.parseInt(parts[1].trim());
                    if (start < 1 || end < start) {
                        return error(HttpStatus.BAD_REQUEST, "INVALID_RANGE_VALUES", "Range değerleri geçersiz");
                    }
                    offset = start - 1; // 1-based -> 0-based
                    limit = end - start + 1;
                    paginate = true;
                } catch (NumberFormatException nfe) {
                    return error(HttpStatus.BAD_REQUEST, "INVALID_RANGE", "Range sayısal olmalı. Örnek: 1-10");
                }
            } else if (page != null && size != null) {
                if (page < 1 || size < 1) {
                    return error(HttpStatus.BAD_REQUEST, "INVALID_PAGING", "Sayfa ve boyut 1'den küçük olamaz");
                }
                offset = (page - 1) * size;
                limit = size;
                paginate = true;
            }

            if (!paginate) {
                // backward compatibility: return full list
                List<Graph> graphs = graphRepository.findByUserIdOrderByUpdatedAtDesc(userId);
                return ResponseEntity.ok(graphs);
            }

            // total count
            Long total = entityManager.createQuery(
                            "SELECT COUNT(g) FROM Graph g WHERE g.user.id = :uid", Long.class)
                    .setParameter("uid", userId)
                    .getSingleResult();

            // paged items
            List<Graph> items = entityManager.createQuery(
                            "SELECT g FROM Graph g WHERE g.user.id = :uid ORDER BY g.updatedAt DESC", Graph.class)
                    .setParameter("uid", userId)
                    .setFirstResult(offset)
                    .setMaxResults(limit)
                    .getResultList();

            Map<String, Object> res = new HashMap<>();
            res.put("items", items);
            res.put("total", total);
            res.put("offset", offset);
            res.put("limit", limit);
            res.put("rangeStart", total == 0 ? 0 : offset + 1);
            res.put("rangeEnd", offset + items.size());

            return ResponseEntity.ok(res);

        } catch (Exception e) {
            e.printStackTrace();
            return error(HttpStatus.UNAUTHORIZED, "INVALID_TOKEN", "Token geçersiz veya süresi dolmuş: " + e.getMessage());
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getGraph(
            @RequestHeader(name = "Authorization", required = false) String authorization,
            @PathVariable Long id) {

        if (authorization == null || !authorization.startsWith("Bearer ")) {
            return error(HttpStatus.UNAUTHORIZED, "NO_TOKEN", "Token bulunamadı");
        }

        String token = authorization.substring(7).trim();
        try {
            Map<String, Object> claims = jwtService.parseClaims(token);
            Long userId = Long.parseLong((String) claims.get("sub"));
            
            Optional<Graph> graphOpt = graphRepository.findById(id);
            if (graphOpt.isEmpty()) {
                return error(HttpStatus.NOT_FOUND, "GRAPH_NOT_FOUND", "Graph bulunamadı");
            }

            Graph graph = graphOpt.get();
            
            // Check if user owns this graph
            if (!graph.getUser().getId().equals(userId)) {
                return error(HttpStatus.FORBIDDEN, "ACCESS_DENIED", "Bu graph'a erişim yetkiniz yok");
            }

            return ResponseEntity.ok(graph);

        } catch (Exception e) {
            return error(HttpStatus.UNAUTHORIZED, "INVALID_TOKEN", "Token geçersiz veya süresi dolmuş");
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteGraph(
            @RequestHeader(name = "Authorization", required = false) String authorization,
            @PathVariable Long id) {

        if (authorization == null || !authorization.startsWith("Bearer ")) {
            return error(HttpStatus.UNAUTHORIZED, "NO_TOKEN", "Token bulunamadı");
        }

        String token = authorization.substring(7).trim();
        try {
            Map<String, Object> claims = jwtService.parseClaims(token);
            Long userId = Long.parseLong((String) claims.get("sub"));
            
            Optional<Graph> graphOpt = graphRepository.findById(id);
            if (graphOpt.isEmpty()) {
                return error(HttpStatus.NOT_FOUND, "GRAPH_NOT_FOUND", "Graph bulunamadı");
            }

            Graph graph = graphOpt.get();
            
            // Check if user owns this graph
            if (!graph.getUser().getId().equals(userId)) {
                return error(HttpStatus.FORBIDDEN, "ACCESS_DENIED", "Bu graph'ı silme yetkiniz yok");
            }

            graphRepository.delete(graph);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Graph başarıyla silindi");

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return error(HttpStatus.UNAUTHORIZED, "INVALID_TOKEN", "Token geçersiz veya süresi dolmuş");
        }
    }

    @GetMapping("/all")
    public ResponseEntity<?> getAllGraphs(
            @RequestHeader(name = "Authorization", required = false) String authorization) {

        if (authorization == null || !authorization.startsWith("Bearer ")) {
            return error(HttpStatus.UNAUTHORIZED, "NO_TOKEN", "Token bulunamadı");
        }

        String token = authorization.substring(7).trim();
        try {
            Map<String, Object> claims = jwtService.parseClaims(token);
            // Token geçerliliğini kontrol et, ancak user ID'ye göre filtreleme yapma
            
            List<Graph> graphs = graphRepository.findAllOrderByUpdatedAtDesc();
            
            return ResponseEntity.ok(graphs);

        } catch (Exception e) {
            return error(HttpStatus.UNAUTHORIZED, "INVALID_TOKEN", "Token geçersiz veya süresi dolmuş");
        }
    }

    @DeleteMapping("/bulk")
    public ResponseEntity<?> deleteMultipleGraphs(
            @RequestHeader(name = "Authorization", required = false) String authorization,
            @RequestBody List<Long> graphIds) {

        if (authorization == null || !authorization.startsWith("Bearer ")) {
            return error(HttpStatus.UNAUTHORIZED, "NO_TOKEN", "Token bulunamadı");
        }

        String token = authorization.substring(7).trim();
        try {
            Map<String, Object> claims = jwtService.parseClaims(token);
            Long userId = Long.parseLong((String) claims.get("sub"));
            
            if (graphIds == null || graphIds.isEmpty()) {
                return error(HttpStatus.BAD_REQUEST, "EMPTY_LIST", "Silinecek graph listesi boş");
            }
            
            List<Graph> graphsToDelete = graphRepository.findAllById(graphIds);
            
            // Check if user owns all graphs
            for (Graph graph : graphsToDelete) {
                if (!graph.getUser().getId().equals(userId)) {
                    return error(HttpStatus.FORBIDDEN, "ACCESS_DENIED", 
                               "Graph ID " + graph.getId() + " için silme yetkiniz yok");
                }
            }
            
            graphRepository.deleteAll(graphsToDelete);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", graphsToDelete.size() + " adet graph başarıyla silindi");
            response.put("deletedCount", graphsToDelete.size());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            e.printStackTrace();
            return error(HttpStatus.UNAUTHORIZED, "INVALID_TOKEN", "Token geçersiz veya süresi dolmuş: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    @Transactional
    public ResponseEntity<?> updateGraph(
            @RequestHeader(name = "Authorization", required = false) String authorization,
            @PathVariable Long id,
            @Valid @RequestBody SaveGraphRequest request) {

        if (authorization == null || !authorization.startsWith("Bearer ")) {
            return error(HttpStatus.UNAUTHORIZED, "NO_TOKEN", "Token bulunamadı");
        }

        String token = authorization.substring(7).trim();
        try {
            Map<String, Object> claims = jwtService.parseClaims(token);
            Long userId = Long.parseLong((String) claims.get("sub"));
            
            Optional<Graph> graphOpt = graphRepository.findById(id);
            if (graphOpt.isEmpty()) {
                return error(HttpStatus.NOT_FOUND, "GRAPH_NOT_FOUND", "Graph bulunamadı");
            }

            Graph graph = graphOpt.get();
            
            // Check if user owns this graph
            if (!graph.getUser().getId().equals(userId)) {
                return error(HttpStatus.FORBIDDEN, "ACCESS_DENIED", "Bu graph'ı güncelleme yetkiniz yok");
            }

            // Update graph name
            graph.setName(request.getName());

            // 1) Hard-delete existing edges and nodes to avoid duplicates
            if (graph.getEdges() != null) {
                var itE = graph.getEdges().iterator();
                while (itE.hasNext()) {
                    Edge e = itE.next();
                    itE.remove();
                    entityManager.remove(e);
                }
            }
            if (graph.getNodes() != null) {
                var itN = graph.getNodes().iterator();
                while (itN.hasNext()) {
                    Node n = itN.next();
                    itN.remove();
                    entityManager.remove(n);
                }
            }
            entityManager.flush(); // ensure deletes are executed before inserts

            // 2) Dedupe incoming nodes by nodeId (fallback label)
            Map<String, NodeDTO> uniqueNodes = new LinkedHashMap<>();
            if (request.getNodes() != null) {
                for (NodeDTO nodeDTO : request.getNodes()) {
                    String key = nodeDTO.getNodeId() != null ? nodeDTO.getNodeId() :
                                 (nodeDTO.getLabel() != null ? nodeDTO.getLabel() : "");
                    if (!key.isEmpty()) uniqueNodes.put(key, nodeDTO); // keep last occurrence
                }
            }

            // 3) Re-add nodes
            for (NodeDTO nodeDTO : uniqueNodes.values()) {
                Node node = new Node(nodeDTO.getNodeId(), nodeDTO.getLabel(), graph);
                node.setSize(nodeDTO.getSize() != null ? nodeDTO.getSize() : 20);
                node.setColor(nodeDTO.getColor() != null ? nodeDTO.getColor() : "#1976d2");
                node.setPositionX(nodeDTO.getPositionX());
                node.setPositionY(nodeDTO.getPositionY());
                graph.getNodes().add(node);
            }

            // 4) Dedupe incoming edges by (from,to,directed)
            Map<String, EdgeDTO> uniqueEdges = new LinkedHashMap<>();
            if (request.getEdges() != null) {
                for (EdgeDTO edgeDTO : request.getEdges()) {
                    boolean directed = edgeDTO.getIsDirected() != null ? edgeDTO.getIsDirected() : false;
                    String from = edgeDTO.getFromNode();
                    String to = edgeDTO.getToNode();
                    if (from == null || to == null) continue;
                    String key = directed ? (from + "->" + to)
                                          : (from.compareTo(to) <= 0 ? from + "::" + to : to + "::" + from);
                    uniqueEdges.put(key, edgeDTO); // keep last occurrence
                }
            }

            // 5) Re-add edges
            for (EdgeDTO edgeDTO : uniqueEdges.values()) {
                Edge edge = new Edge(edgeDTO.getEdgeId(), edgeDTO.getFromNode(), edgeDTO.getToNode(), graph);
                edge.setWeight(edgeDTO.getWeight() != null ? edgeDTO.getWeight() : 1.0);
                edge.setIsDirected(edgeDTO.getIsDirected() != null ? edgeDTO.getIsDirected() : false);
                edge.setShowWeight(edgeDTO.getShowWeight() != null ? edgeDTO.getShowWeight() : true);
                graph.getEdges().add(edge);
            }

            // legend: hard-delete then re-add
            if (graph.getLegendEntries() != null) {
                var itL = graph.getLegendEntries().iterator();
                while (itL.hasNext()) {
                     l = itL.next();
                    itL.remove();
                    entityManager.remove(l);
                }
            }
            entityManager.flush();

            boolean hasLegend = Boolean.TRUE.equals(request.getHasLegend()) && request.getLegendEntries() != null && !request.getLegendEntries().isEmpty();
            graph.setHasLegend(hasLegend);
            if (hasLegend) {
                for (LegendEntryDTO dto : request.getLegendEntries()) {
                    if (dto == null) continue;
                    LegendEntry le = new LegendEntry();
                    le.setGraph(graph);
                    le.setName(dto.getName());
                    le.setColor(dto.getColor());
                    le.setCapacity(dto.getCapacity());
                    le.setDistance(dto.getDistance());
                    le.setUnitDistance(dto.getUnitDistance());
                    graph.getLegendEntries().add(le);
                }
            }

            Graph updatedGraph = graphRepository.save(graph);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Graph başarıyla güncellendi");
            response.put("graphId", updatedGraph.getId());
            response.put("graphName", updatedGraph.getName());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            e.printStackTrace();
            return error(HttpStatus.UNAUTHORIZED, "INVALID_TOKEN", "Token geçersiz veya süresi dolmuş: " + e.getMessage());
        }
    }

    private ResponseEntity<Map<String, Object>> error(HttpStatus status, String code, String message) {
        Map<String, Object> res = new HashMap<>();
        res.put("error", true);
        res.put("code", code);
        res.put("message", message);
        return ResponseEntity.status(status).body(res);
    }
}
