package com.prepxl.config;

import java.util.HashMap;
import java.util.Map;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.reactive.handler.SimpleUrlHandlerMapping;
import org.springframework.web.reactive.socket.WebSocketHandler;
import org.springframework.web.reactive.socket.server.support.WebSocketHandlerAdapter;

import com.prepxl.service.TranscriptionHandler;

@Configuration
public class WebSocketConfig {

    @Bean
    public SimpleUrlHandlerMapping handlerMapping(WebSocketHandler webSocketHandler) {
        Map<String, WebSocketHandler> map = new HashMap<>();
        // Maps the incoming path to our handler
        map.put("/ws/transcribe", webSocketHandler); 
        
        SimpleUrlHandlerMapping mapping = new SimpleUrlHandlerMapping();
        mapping.setUrlMap(map);
        mapping.setOrder(10);
        
        // CRITICAL FIX: Add CORS configuration for WebSocket connections
        // Without this, browsers will reject the WebSocket handshake with error 1006
        CorsConfiguration corsConfig = new CorsConfiguration();
        corsConfig.addAllowedOrigin("http://localhost:5173"); // Vite dev server
        corsConfig.addAllowedOrigin("http://localhost:5174"); // Alternative port
        corsConfig.addAllowedOrigin("http://localhost:3000"); // React default port
        corsConfig.addAllowedHeader("*");
        corsConfig.addAllowedMethod("*");
        corsConfig.setAllowCredentials(true);
        
        Map<String, CorsConfiguration> corsConfigMap = new HashMap<>();
        corsConfigMap.put("/ws/**", corsConfig);
        mapping.setCorsConfigurations(corsConfigMap);
        
        return mapping;
    }

    @Bean
    public WebSocketHandler webSocketHandler(TranscriptionHandler transcriptionHandler) {
        return transcriptionHandler;
    }

    @Bean
    public WebSocketHandlerAdapter handlerAdapter() {
        return new WebSocketHandlerAdapter();
    }
}