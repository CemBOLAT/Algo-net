package com.example.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "app.jwt")
public class JwtProperties {
    private String secret;
    private long accessTtlMs;
    private long refreshTtlMs;

    public String getSecret() { return secret; }
    public void setSecret(String secret) { this.secret = secret; }
    public long getAccessTtlMs() { return accessTtlMs; }
    public void setAccessTtlMs(long accessTtlMs) { this.accessTtlMs = accessTtlMs; }
    public long getRefreshTtlMs() { return refreshTtlMs; }
    public void setRefreshTtlMs(long refreshTtlMs) { this.refreshTtlMs = refreshTtlMs; }
}
