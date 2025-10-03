package com.example.backend.repository;

import com.example.backend.entity.Graph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GraphRepository extends JpaRepository<Graph, Long> {
    
    List<Graph> findByUserIdOrderByUpdatedAtDesc(Long userId);
    
    @Query("SELECT g FROM Graph g ORDER BY g.updatedAt DESC")
    List<Graph> findAllOrderByUpdatedAtDesc();
}
