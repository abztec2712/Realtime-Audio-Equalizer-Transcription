package com.prepxl.service;

import org.springframework.stereotype.Component;
import org.springframework.web.reactive.socket.WebSocketHandler;
import org.springframework.web.reactive.socket.WebSocketMessage;
import org.springframework.web.reactive.socket.WebSocketSession;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Component
public class TranscriptionHandler implements WebSocketHandler {

    private final TranscriptionService transcriptionService;

    public TranscriptionHandler(TranscriptionService transcriptionService) {
        this.transcriptionService = transcriptionService;
    }

    @Override
    public Mono<Void> handle(WebSocketSession session) {
        System.out.println("=== WebSocket Connection Established ===");
        System.out.println("Session ID: " + session.getId());

        // 1. INPUT STREAM: Map incoming WebSocket messages (binary audio) to a Flux<byte[]>
        Flux<byte[]> audioChunkFlux = session.receive()
            .filter(message -> message.getType() == WebSocketMessage.Type.BINARY)
            .map(WebSocketMessage::getPayload)
            .map(dataBuffer -> {
                byte[] audioChunk = new byte[dataBuffer.readableByteCount()];
                dataBuffer.read(audioChunk);
                System.out.println("Received audio chunk: " + audioChunk.length + " bytes");
                return audioChunk;
            })
            .doOnError(e -> {
                System.err.println("ERROR receiving audio stream: " + e.getMessage());
                e.printStackTrace();
            });

        // 2. PROCESS STREAM: Pass the audio stream to the TranscriptionService
        Flux<String> transcriptionOutput = transcriptionService.transcribeStream(audioChunkFlux);

        // 3. OUTPUT STREAM: Map the Flux transcription back to WebSocket messages
        return session.send(
                transcriptionOutput
                    .map(text -> {
                        System.out.println("Sending transcription: " + text);
                        return session.textMessage(text);
                    })
                    .doOnError(e -> {
                        System.err.println("ERROR sending transcription: " + e.getMessage());
                        e.printStackTrace();
                    })
            )
            .doFinally(signal -> {
                System.out.println("=== WebSocket Connection Closed: " + signal + " ===");
            });
    }
}
