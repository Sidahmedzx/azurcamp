package com.camp.backend.controller;

import com.camp.backend.dto.ApiResponse;
import com.camp.backend.service.AIService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/ai")
public class AIController {

    private final AIService aiService;

    public AIController(AIService aiService) {
        this.aiService = aiService;
    }

    @PostMapping("/generate-description")
    public ResponseEntity<ApiResponse<String>> generateDescription(@RequestBody Map<String, Object> request) {
        try {
            System.out.println("=== AI ENDPOINT HIT ===");
            System.out.println("Request: " + request);
            String name = (String) request.get("name");
            String location = (String) request.get("location");
            int capacity = (int) request.get("capacity");

            String description = aiService.generateCampsiteDescription(name, location, capacity);
            System.out.println("=== AI SUCCESS ===");
            return ResponseEntity.ok(ApiResponse.ok("Description generated", description));
        } catch (Exception e) {
            System.out.println("=== AI ERROR ===");
            e.printStackTrace();
            return ResponseEntity.ok(ApiResponse.fail("AI error: " + e.getMessage(), null));
        }
    }

    @PostMapping("/analyze-feedback")
    public ResponseEntity<ApiResponse<String>> analyzeFeedback(@RequestBody Map<String, String> request) {
        try {
            String message = request.get("message");
            String analysis = aiService.analyzeFeedback(message);
            return ResponseEntity.ok(ApiResponse.ok("Feedback analyzed", analysis));
        } catch (Exception e) {
            System.out.println("=== FEEDBACK AI ERROR ===");
            e.printStackTrace();
            return ResponseEntity.ok(ApiResponse.fail("AI error: " + e.getMessage(), null));
        }
    }
}