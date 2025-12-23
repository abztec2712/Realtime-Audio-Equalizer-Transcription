package com.prepxl.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import reactor.core.publisher.Flux;

@Service
public class TranscriptionService {

    @Value("${google.api.key}") // Ensure this matches application.properties
    private String geminiApiKey;

    private final GeminiLiveClient geminiLiveClient;

    public TranscriptionService(GeminiLiveClient geminiLiveClient) {
        this.geminiLiveClient = geminiLiveClient;
    }

    public Flux<String> transcribeStream(Flux<byte[]> audioChunks) {
        if (geminiApiKey == null || geminiApiKey.isBlank()) {
            return Flux.error(new IllegalStateException("Google API key not configured."));
        }

        // Use the Gemini 2.0 Flash model for low-latency live streaming
        String model = "models/gemini-2.0-flash-exp"; 
        String baseUrl = "wss://generativelanguage.googleapis.com/ws";

        return geminiLiveClient.streamTranscription(baseUrl, geminiApiKey, model, audioChunks);
    }
}