package com.prepxl.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.socket.WebSocketMessage;
import org.springframework.web.reactive.socket.client.ReactorNettyWebSocketClient;
import reactor.core.publisher.Flux;
import java.net.URI;
import java.util.Base64;

@Service
public class GeminiLiveClient {
    private final ReactorNettyWebSocketClient client = new ReactorNettyWebSocketClient();
    private final ObjectMapper mapper = new ObjectMapper();

    public Flux<String> streamTranscription(String baseUrl, String apiKey, String model, Flux<byte[]> audioChunks) {
        // Correct endpoint for Gemini Multimodal Live API
        String url = "wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=" + apiKey;

        return Flux.create(sink -> {
            client.execute(URI.create(url), session -> {
                // 1. Send Setup Message
                ObjectNode setup = mapper.createObjectNode();
                setup.putObject("setup").put("model", model);
                
                // 2. Map incoming bytes to Gemini media_chunks format
                Flux<WebSocketMessage> audioStream = audioChunks.map(chunk -> {
                    ObjectNode content = mapper.createObjectNode();
                    content.putObject("realtime_input")
                           .putArray("media_chunks")
                           .addObject()
                           .put("mime_type", "audio/pcm;rate=16000") // Matches standard PCM capture
                           .put("data", Base64.getEncoder().encodeToString(chunk));
                    return session.textMessage(content.toString());
                });

                // Send Setup then start streaming audio
                Flux<WebSocketMessage> output = Flux.concat(Flux.just(session.textMessage(setup.toString())), audioStream);

                return session.send(output)
                    .thenMany(session.receive()
                        .map(WebSocketMessage::getPayloadAsText)
                        .doOnNext(json -> {
                            try {
                                JsonNode root = mapper.readTree(json);
                                // Parse transcription from modelTurn
                                if (root.has("serverContent") && root.get("serverContent").has("modelTurn")) {
                                    String text = root.get("serverContent")
                                                      .get("modelTurn")
                                                      .get("parts")
                                                      .get(0).get("text").asText();
                                    sink.next(text);
                                }
                            } catch (Exception e) {
                                sink.error(e);
                            }
                        }))
                    .then();
            }).subscribe();
        });
    }
}