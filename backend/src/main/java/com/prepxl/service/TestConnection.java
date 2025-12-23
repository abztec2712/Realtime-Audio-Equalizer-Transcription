package com.prepxl.service;

import java.net.URI;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.socket.client.ReactorNettyWebSocketClient;

@Component
public class TestConnection implements CommandLineRunner {

    @Override
    public void run(String... args) throws Exception {
        System.out.println("🧪 TESTING NETWORK CONNECTION TO GOOGLE...");
        ReactorNettyWebSocketClient client = new ReactorNettyWebSocketClient();
        
        // Try to connect to the echo server first (to rule out local firewall)
        client.execute(URI.create("wss://echo.websocket.org"), session -> {
            System.out.println("✅ Public WebSocket Test: SUCCESS");
            return session.close();
        }).block(java.time.Duration.ofSeconds(5));
        
        System.out.println("🧪 NETWORK TEST COMPLETE");
    }
}