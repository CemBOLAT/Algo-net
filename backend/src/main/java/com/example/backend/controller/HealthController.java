package com.example.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.lang.management.ManagementFactory;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/health")
public class HealthController {

    @GetMapping
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> res = new HashMap<>();
        res.put("status", "UP");
        res.put("timestamp", LocalDateTime.now().toString());
        try {
            long uptime = ManagementFactory.getRuntimeMXBean().getUptime();
            res.put("uptimeMillis", uptime);
        } catch (Exception e) {
            // ignore uptime retrieval errors
            res.put("uptimeMillis", null);
        }
        return ResponseEntity.ok(res);
    }
}
