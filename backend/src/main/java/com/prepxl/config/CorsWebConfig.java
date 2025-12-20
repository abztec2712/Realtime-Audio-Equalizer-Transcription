package com.prepxl.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.web.reactive.config.CorsRegistry;
import org.springframework.web.reactive.config.EnableWebFlux;
import org.springframework.web.reactive.config.WebFluxConfigurer;

@Configuration
@EnableWebFlux
public class CorsWebConfig implements WebFluxConfigurer {

    private final Environment env;

    public CorsWebConfig(Environment env) {
        this.env = env;
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        String allowedOrigins = env.getProperty("app.cors.allowed-origins");

        registry.addMapping("/**") // Apply to all endpoints
                .allowedOrigins("http://localhost:5174", "http://localhost:3000", "http://localhost:5173")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true);
    }
}