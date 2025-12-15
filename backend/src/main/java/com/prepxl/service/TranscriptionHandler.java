package com.prepxl.service;

import org.springframework.core.io.buffer.DataBufferUtils;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.socket.WebSocketHandler;
import org.springframework.web.reactive.socket.WebSocketMessage;
import org.springframework.web.reactive.socket.WebSocketSession;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Component
public class TranscriptionHandler implements WebSocketHandler {

    private final TranscriptionService transcriptionService;

    // Dependency Injection of the TranscriptionService
    public TranscriptionHandler(TranscriptionService transcriptionService) {
        this.transcriptionService = transcriptionService;
    }

    @Override
    public Mono<Void> handle(WebSocketSession session) {
        
        // 1. INPUT STREAM: Map incoming WebSocket messages (binary audio) to a Flux<byte[]>
        // This handles "Accept audio from the frontend in small continuous chunks."
        Flux<byte[]> audioChunkFlux = session.receive()
            .filter(message -> message.getType() == WebSocketMessage.Type.BINARY)
            .map(WebSocketMessage::getPayload)
            .map(dataBuffer -> {
                // Convert DataBuffer to byte array
                byte[] audioChunk = new byte[dataBuffer.readableByteCount()];
                dataBuffer.read(audioChunk);
                DataBufferUtils.release(dataBuffer); // Important: release the buffer
                return audioChunk;
            })
            .doOnError(e -> System.err.println("Error receiving audio stream: " + e.getMessage()));

        // 2. PROCESS STREAM: Pass the audio stream to the TranscriptionService
        // The service will handle forwarding the chunks and streaming the response.
        Flux<String> transcriptionOutput = transcriptionService.transcribeStream(audioChunkFlux);

        // 3. OUTPUT STREAM: Map the Flux<String> transcription back to WebSocket messages
        // This fulfills "Receive partial transcription from Gemini and stream it back to the client in real-time."
        return session.send(transcriptionOutput
            // Use session.textMessage for streaming text transcription
            .map(session::textMessage) 
            .doOnError(e -> System.err.println("Error sending transcription stream: " + e.getMessage()))
        ); 
    }
}