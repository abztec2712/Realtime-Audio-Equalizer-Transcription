package com.prepxl.service;

import java.time.Duration;

import org.springframework.stereotype.Service;

import reactor.core.publisher.Flux;

@Service
public class TranscriptionService {

    // IMPORTANT: This key would normally be loaded from a secret manager or environment variable
    private static final String GEMINI_API_KEY = "YOUR_GEMINI_API_KEY"; 

    /**
     * Accepts a stream of audio chunks and returns a stream of partial transcriptions.
     * This is the simulated gateway to the Gemini Streaming API.
     * * @param audioChunks A stream of raw audio bytes from the client.
     * @return A Flux of transcription strings, representing partial updates.
     */
    public Flux<String> transcribeStream(Flux<byte[]> audioChunks) {
        
        // --- Low-Latency Audio Forwarding and Streaming Logic ---
        
        // 1. Process the incoming audio chunks (Forward immediately, no buffering) [cite: 15]
        audioChunks
            .doOnNext(chunk -> {
                // In a real application, this is where you would call the 
                // Gemini client library's streaming method (RPC or HTTP/2).
                // Example: geminiClient.sendAudioChunk(chunk); 
                // This ensures "Immediately forward each chunk to the Gemini API without buffering" [cite: 15]
                // We log the received chunk size for performance monitoring [cite: 18, 19]
                System.out.println("Service: Forwarded audio chunk of size: " + chunk.length + " bytes to Gemini API...");
            })
            // This 'then()' ensures the audio input stream runs in the background
            .subscribe(); 

        // 2. Simulated Response Stream from Gemini
        // We simulate the partial transcription being received near-instantly [cite: 19] and streamed back 
        return Flux.interval(Duration.ofMillis(300)) // Very low latency stream update
            .onBackpressureDrop() // Handles network fluctuations and slow consumers [cite: 20]
            .map(i -> {
                // Simulate partial results getting more accurate over time
                String partial = switch ((int) (i % 5)) {
                    case 0 -> "The quick brown fox is speaking...";
                    case 1 -> "Testing real-time streaming now...";
                    case 2 -> "Transcription update number " + i;
                    default -> "Partial text received from Gemini.";
                };
                return partial;
            })
            .doOnSubscribe(s -> System.out.println("Service: Started streaming transcription results."))
            // Flux.interval is finite; in a real app, this stream stays open as long as the WS is open.
            .take(Duration.ofSeconds(60)); 
    }
}