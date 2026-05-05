package com.camp.backend.service;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;
import java.util.*;

@Service
public class AIService {

    private final RestTemplate restTemplate = new RestTemplate();
    private final String ollamaUrl = "http://localhost:11434/api/generate";

    public String generateCampsiteDescription(String name, String location, int capacity) {
        String prompt = String.format(
                "You are a marketing expert for campsites in Tunisia. " +
                        "Write an attractive description of 3-4 sentences for this campsite: " +
                        "Name: %s, Location: %s, Capacity: %d persons. " +
                        "Mention nature, possible activities and the atmosphere. " +
                        "Reply only with the description, no title, no quotes.",
                name, location, capacity
        );
        return callOllama(prompt);
    }

    public String analyzeFeedback(String feedbackMessage) {
        String prompt = String.format(
                "Analyze this campsite visitor feedback and provide: " +
                        "1. Sentiment (POSITIVE, NEUTRAL or NEGATIVE) " +
                        "2. A one sentence summary. " +
                        "Reply in JSON format: {\"sentiment\": \"...\", \"summary\": \"...\"}. " +
                        "Feedback: \"%s\"",
                feedbackMessage
        );
        return callOllama(prompt);
    }

    private String callOllama(String prompt) {
        Map<String, Object> body = new HashMap<>();
        body.put("model", "llama3.2:1b");
        body.put("prompt", prompt);
        body.put("stream", false);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
        ResponseEntity<Map> response = restTemplate.postForEntity(ollamaUrl, request, Map.class);

        return (String) response.getBody().get("response");
    }
}