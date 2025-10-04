package com.example.backend.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;

@Service
public class CustomAlgoService {

    // Path to store uploaded Python files temporarily
    private static final String TEMP_FOLDER = "C:/Users/Meliksah/AppData/Local/Temp"; // or "C:/temp" on Windows

    public Map<String, String> runPythonAlgo(MultipartFile file, String verticesJson, String edgesJson) throws Exception {
        
        System.out.println("Dosya alındı: " + file);

        // 1. Save uploaded file to temp folder
        String originalFileName = file.getOriginalFilename();
        Path tempFile = Files.createTempFile(Path.of(TEMP_FOLDER), "algo-", "-" + originalFileName);
        Files.write(tempFile, file.getBytes());
    
        System.out.println("Nodes : " + verticesJson);
        System.out.println("Edges : " + edgesJson);
        // 2. Execute Python script
        System.out.println("Python kod öncesi");
        ProcessBuilder pb = new ProcessBuilder(
            "python",
            tempFile.toAbsolutePath().toString(),
            verticesJson,
            edgesJson
        );
        pb.redirectErrorStream(true); // merge stderr into stdout
        Process process = pb.start();

        // 3. Capture output
        String output;
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
            output = reader.lines().reduce("", (acc, line) -> acc + line);
        }

        int exitCode = process.waitFor();
        if (exitCode != 0) {
            throw new RuntimeException("Python script failed: " + output);
        }

        // 4. Parse JSON output
        ObjectMapper mapper = new ObjectMapper();
        Map<String, String> colors = mapper.readValue(output, new TypeReference<>() {});
        return colors;
    }
}
