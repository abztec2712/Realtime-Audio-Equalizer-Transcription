package com.prepxl.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import reactor.core.publisher.Flux;

@Service
public class TranscriptionService {

    @Value("${google.api.key:}")
    private String geminiApiKey;

    @Value("${gemini.base.url:https://generativelanguage.googleapis.com/v1beta}")
    private String geminiBaseUrl;

    private final GeminiLiveClient geminiLiveClient;

    public TranscriptionService() {
        this.geminiLiveClient = new GeminiLiveClient();
    }

    /**
     * Accepts a stream of audio chunks from the browser WebSocket and returns
     * a stream of text transcripts from Gemini Live (one Gemini session per WS).
     */
    public Flux<String> transcribeStream(Flux<byte[]> audioChunks) {
        if (geminiApiKey == null || geminiApiKey.isBlank()) {
            return Flux.error(new IllegalStateException(
                "Google API key not configured. Define GOOGLE_API_KEY before starting backend."));
        }

        // For text-only transcription, configure Gemini Live for TEXT output.
        String model = "models/gemini-2.5-flash-native-audio-preview-12-2025";

        return geminiLiveClient.streamTranscription(
            geminiBaseUrl,
            geminiApiKey,
            model,
            audioChunks
        );
    }
}
