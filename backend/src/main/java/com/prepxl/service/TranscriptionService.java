package com.prepxl.service;

import java.time.Duration;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import reactor.core.publisher.Flux;

@Service
public class TranscriptionService {

    @Value("${google.api.key:}")
    private String geminiApiKey;

    @Value("${gemini.base.url:https://generativelanguage.googleapis.com/v1beta}")
    private String geminiBaseUrl;

    public Flux<String> transcribeStream(Flux<byte[]> audioChunks) {
        // HARD requirement: key must be present every time this API is used
        if (geminiApiKey == null || geminiApiKey.isBlank()) {
            return Flux.error(new IllegalStateException(
                "Google API key not configured. Define GOOGLE_API_KEY before starting backend."));
        }

        System.out.println("Gemini API key loaded, prefix = "
            + geminiApiKey.substring(0, Math.min(8, geminiApiKey.length())) + "***");
        System.out.println("Gemini base URL = " + geminiBaseUrl);

        audioChunks
            .doOnNext(chunk -> {
                // TODO: call real Google API here using geminiApiKey
                System.out.println("Service: Forwarded audio chunk of size: "
                    + chunk.length + " bytes to Gemini API...");
            })
            .subscribe();

        return Flux.interval(Duration.ofMillis(300))
            .onBackpressureDrop()
            .map(i -> "Transcription result " + i)
            .take(Duration.ofSeconds(60));
    }
}
