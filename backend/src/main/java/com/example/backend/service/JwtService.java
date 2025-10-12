package com.example.backend.service;

import com.example.backend.config.JwtProperties;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import javax.crypto.SecretKey;
import java.time.Instant;
import java.util.Date;
import java.util.Map;

@Service
public class JwtService {
    private final JwtProperties props;
    private final SecretKey key;

    public JwtService(JwtProperties props) {
        this.props = props;
    this.key = Keys.hmacShaKeyFor(props.getSecret().getBytes(StandardCharsets.UTF_8));
    }

    public String generateAccessToken(Long userId, String email) {
        Instant now = Instant.now();
        Instant exp = now.plusMillis(props.getAccessTtlMs());
        return Jwts.builder()
                .subject(String.valueOf(userId))
                .issuer("algo-net")
                .issuedAt(Date.from(now))
                .expiration(Date.from(exp))
                .claim("email", email)
                .claim("typ", "access")
                .signWith(key)
                .compact();
    }

    public String generateRefreshToken(Long userId) {
        Instant now = Instant.now();
        Instant exp = now.plusMillis(props.getRefreshTtlMs());
        return Jwts.builder()
                .subject(String.valueOf(userId))
                .issuer("algo-net")
                .issuedAt(Date.from(now))
                .expiration(Date.from(exp))
                .claim("typ", "refresh")
                .signWith(key)
                .compact();
    }

    public Map<String, Object> parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
