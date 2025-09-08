package com.example.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Value("${app.cors.allowed-origin:*}")
    private String allowedOrigin;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
    // Always include the Render host for the deployed frontend
    final String renderOrigin = "https://algo-net-1.onrender.com";

    if (allowedOrigin != null && allowedOrigin.trim().equals("*")) {
        registry.addMapping("/api/**")
            .allowedOrigins("*")
            .allowedMethods("GET", "POST", "PUT", "DELETE")
            .allowedHeaders("*")
            .allowCredentials(false);
        return;
    }

    // Parse comma-separated origins, trim and include renderOrigin
    List<String> origins = Stream.concat(
            Arrays.stream((allowedOrigin == null ? "" : allowedOrigin).split(",")),
            Stream.of(renderOrigin)
        )
        .map(String::trim)
        .filter(s -> !s.isEmpty())
        .distinct()
        .collect(Collectors.toList());

    registry.addMapping("/api/**")
        .allowedOrigins(origins.toArray(new String[0]))
        .allowedMethods("GET", "POST", "PUT", "DELETE")
        .allowedHeaders("*")
        .allowCredentials(false);
    }
}
