package com.prepxl.service;

import reactor.core.publisher.Flux;

public class GeminiLiveClient {

    public Flux<String> streamTranscription(
            String baseUrl,
            String apiKey,
            String model,
            Flux<byte[]> audioChunks
    ) {
        // TODO: Implement using Gemini Live WebSocket:
        // 1. Open wss://generativelanguage.googleapis.com/v1beta/live:connect
        //    with x-goog-api-key header = apiKey.
        // 2. Send initial JSON setup message (model, audio/transcription config).
        // 3. For each audioChunks element, send audio frame.
        // 4. Parse incoming JSON messages from Gemini and emit transcript text
        //    through a Flux<String> (use Flux.create/Flux.push).
        // 5. Close Gemini socket when audioChunks completes or client disconnects.
        return Flux.error(new UnsupportedOperationException(
            "Gemini Live client not implemented yet. Follow ai.google.dev Live API docs."
        ));
    }
}
