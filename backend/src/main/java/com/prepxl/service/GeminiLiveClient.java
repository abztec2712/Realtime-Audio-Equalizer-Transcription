package com.prepxl.service;

import java.net.URI;
import java.time.Duration;
import java.util.Base64;
import java.util.logging.Logger;

import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.socket.WebSocketMessage;
import org.springframework.web.reactive.socket.client.ReactorNettyWebSocketClient;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.publisher.Sinks;
import reactor.netty.http.client.HttpClient;

@Service
public class GeminiLiveClient {
    private final ReactorNettyWebSocketClient client;
    private final ObjectMapper mapper = new ObjectMapper();
    private static final Logger logger = Logger.getLogger(GeminiLiveClient.class.getName());

    public GeminiLiveClient() {
        HttpClient httpClient = HttpClient.create()
                .responseTimeout(Duration.ofSeconds(10));
        this.client = new ReactorNettyWebSocketClient(httpClient);
    }

    public Flux<String> streamTranscription(String baseUrl, String apiKey, String model, Flux<byte[]> audioChunks) {
        // Use v1alpha for gemini-2.0-flash-exp support
        String url = "wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=" + apiKey;

        return Flux.create(sink -> {
            Sinks.Empty<Void> setupCompleteSignal = Sinks.empty();
            HttpHeaders headers = new HttpHeaders();
            headers.add("Content-Type", "application/json"); 

            logger.info("🚀 Connecting to Gemini Live (v1alpha)...");

            client.execute(URI.create(url), headers, session -> {
                logger.info("⚡ Handshake Successful!");

                // --- 1. SETUP MESSAGE (MANDATORY SNAKE_CASE) ---
                ObjectNode setupMessage = mapper.createObjectNode();
                ObjectNode setup = setupMessage.putObject("setup");
                setup.put("model", model);
                
                // Use snake_case: generation_config, response_modalities
                ObjectNode config = setup.putObject("generation_config");
                config.putArray("response_modalities").add("AUDIO"); // AUDIO is the standard for Live API

                logger.info("📤 Sending Setup: " + setupMessage.toString());

                // --- 2. AUDIO STREAM (MANDATORY SNAKE_CASE) ---
                Flux<WebSocketMessage> audioStream = setupCompleteSignal.asMono()
                    .thenMany(audioChunks)
                    .map(chunk -> {
                        ObjectNode content = mapper.createObjectNode();
                        ObjectNode input = content.putObject("realtime_input"); // realtime_input
                        ObjectNode media = input.putArray("media_chunks").addObject(); // media_chunks
                        media.put("mime_type", "audio/pcm;rate=16000"); // mime_type
                        media.put("data", Base64.getEncoder().encodeToString(chunk));
                        return session.textMessage(content.toString());
                    });

                Flux<WebSocketMessage> outbound = Flux.concat(
                    Flux.just(session.textMessage(setupMessage.toString()))
                        .doOnNext(msg -> logger.info("✅ Setup Message Sent to Network")),
                    audioStream
                );

                // --- 3. INBOUND STREAM (WITH DEBUGGING) ---
                Mono<Void> inbound = session.receive()
                    .map(WebSocketMessage::getPayloadAsText)
                    .doOnNext(json -> {
                        try {
                            JsonNode root = mapper.readTree(json);
                            
                            if (root.has("setupComplete")) {
                                logger.info("🔓 Gemini Setup Complete! Starting audio stream...");
                                setupCompleteSignal.tryEmitEmpty();
                            } else if (root.has("serverContent") && root.get("serverContent").has("modelTurn")) {
                                String text = root.get("serverContent").get("modelTurn").get("parts").get(0).get("text").asText();
                                logger.info("📝 Transcript: " + text);
                                sink.next(text);
                            } else {
                                // THIS WILL REVEAL ERRORS:
                                logger.warning("📥 Received Other Message: " + json);
                            }
                        } catch (Exception e) {
                            logger.severe("❌ JSON Error: " + e.getMessage());
                        }
                    })
                    .then();

                return Mono.zip(session.send(outbound), inbound).then();
            })
            .doOnError(sink::error)
            .subscribe();
        });
    }
}