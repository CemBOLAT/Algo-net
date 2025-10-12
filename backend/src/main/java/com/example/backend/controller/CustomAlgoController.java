package com.example.backend.controller;

import com.example.backend.service.CustomAlgoService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api") // matches /api/customAlgo
public class CustomAlgoController {

    private final CustomAlgoService customAlgoService;

    public CustomAlgoController(CustomAlgoService customAlgoService) {
        this.customAlgoService = customAlgoService;
        
    }

    @PostMapping("/customAlgo")
    public ResponseEntity<?> runCustomAlgo(
        @RequestParam("file") MultipartFile file,
        @RequestParam("Vertices") String verticesJson,
        @RequestParam("Edges") String edgesJson
    ) {
        try {
            // Call service to execute Python file
            Map<String, String> colors = customAlgoService.runPythonAlgo(file, verticesJson, edgesJson);
            return ResponseEntity.ok(colors);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error running Python script: " + e.getMessage());
        }
    }
}
