package com.example.backend.controller;

import com.example.backend.dto.LoginRequest;
import com.example.backend.entity.User;
import com.example.backend.repository.UserRepository;
import com.example.backend.service.JwtService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

	private final UserRepository userRepository;
	private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

	public AuthController(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService) {
		this.userRepository = userRepository;
		this.passwordEncoder = passwordEncoder;
		this.jwtService = jwtService;
	}

	@PostMapping("/login")
	public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
		Optional<User> opt = userRepository.findByEmail(request.getEmail());
		if (opt.isEmpty()) {
			return error(HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS", "E-posta veya şifre hatalı.");
		}
		User user = opt.get();
		if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
			return error(HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS", "E-posta veya şifre hatalı.");
		}
		String access = jwtService.generateAccessToken(user.getId(), user.getEmail());
		String refresh = jwtService.generateRefreshToken(user.getId());
		Map<String, Object> body = new HashMap<>();
		body.put("success", true);
		body.put("userId", user.getId());
		body.put("accessToken", access);
		body.put("refreshToken", refresh);
		return ResponseEntity.ok(body);
	}

	public static class RefreshRequest {
		public String refreshToken;
		public String getRefreshToken() { return refreshToken; }
		public void setRefreshToken(String refreshToken) { this.refreshToken = refreshToken; }
	}

	@PostMapping("/refresh")
	public ResponseEntity<?> refresh(@RequestBody RefreshRequest request) {
		if (request == null || request.getRefreshToken() == null || request.getRefreshToken().isBlank()) {
			return error(HttpStatus.BAD_REQUEST, "INVALID_TOKEN", "Refresh token eksik");
		}
		try {
			Map<String, Object> claims = jwtService.parseClaims(request.getRefreshToken());
			Object typ = claims.get("typ");
			if (!"refresh".equals(typ)) {
				return error(HttpStatus.BAD_REQUEST, "INVALID_TOKEN", "Geçersiz token tipi");
			}
			Long userId = Long.parseLong((String) claims.get("sub"));
			Optional<User> userOpt = userRepository.findById(userId);
			if (userOpt.isEmpty()) {
				return error(HttpStatus.UNAUTHORIZED, "USER_NOT_FOUND", "Kullanıcı bulunamadı");
			}
			User user = userOpt.get();
			String access = jwtService.generateAccessToken(user.getId(), user.getEmail());
			Map<String, Object> res = new HashMap<>();
			res.put("accessToken", access);
			return ResponseEntity.ok(res);
		} catch (Exception e) {
			return error(HttpStatus.UNAUTHORIZED, "INVALID_TOKEN", "Refresh token geçersiz veya süresi dolmuş");
		}
	}

	private ResponseEntity<Map<String, Object>> error(HttpStatus status, String code, String message) {
		Map<String, Object> res = new HashMap<>();
		res.put("error", true);
		res.put("code", code);
		res.put("message", message);
		return ResponseEntity.status(status).body(res);
	}
}
