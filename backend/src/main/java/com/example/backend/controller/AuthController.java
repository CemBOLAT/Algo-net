package com.example.backend.controller;

import com.example.backend.dto.LoginRequest;
import com.example.backend.dto.ForgotPasswordRequest;
import com.example.backend.dto.ResetPasswordRequest;
import com.example.backend.entity.User;
import com.example.backend.repository.UserRepository;
import com.example.backend.service.JwtService;
import com.example.backend.service.MailService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

	private final UserRepository userRepository;
	private final PasswordEncoder passwordEncoder;
	private final JwtService jwtService;
	private final MailService mailService;

	public AuthController(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService, MailService mailService) {
		this.userRepository = userRepository;
		this.passwordEncoder = passwordEncoder;
		this.jwtService = jwtService;
		this.mailService = mailService;
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

		// prevent disabled users from logging in
		if (user.isDisabled()) {
			return error(HttpStatus.FORBIDDEN, "USER_DISABLED", "Hesabınız devre dışı bırakılmış.");
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

	public ResponseEntity<?> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
		Optional<User> opt = userRepository.findByEmail(request.getEmail());
        // if there no user exists return error code.
        if (opt.isEmpty()) {
            return error(HttpStatus.BAD_REQUEST, "USER_NOT_FOUND", "Kullanıcı bulunamadı");
        }
        else{
            User user = opt.get();
            String code = String.valueOf((int)(Math.random() * 900000) + 100000); // 6 haneli
            user.setSecurityCode(code);
			user.setSecurityCodeCreatedAt(LocalDateTime.now());
            userRepository.save(user);
            try {
                mailService.sendResetCode(user.getEmail(), code);
            } catch (Exception ignored) { /* mail optional */ }
        }
		Map<String, Object> res = new HashMap<>();
		res.put("success", true);
		return ResponseEntity.ok(res);
	}

	@PostMapping("/reset-password")
	public ResponseEntity<?> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
		Optional<User> opt = userRepository.findByEmail(request.getEmail());
		if (opt.isEmpty()) {
			return error(HttpStatus.BAD_REQUEST, "INVALID_REQUEST", "Geçersiz istek");
		}
		User user = opt.get();
		if (user.getSecurityCode() == null || !user.getSecurityCode().equals(request.getCode())) {
			return error(HttpStatus.BAD_REQUEST, "INVALID_CODE", "Kod geçersiz veya süresi geçmiş");
		}

		// 15 dk geçerlilik kontrolü
		LocalDateTime createdAt = user.getSecurityCodeCreatedAt();
		if (createdAt == null || LocalDateTime.now().isAfter(createdAt.plusMinutes(15))) {
			user.setSecurityCode(null);
			user.setSecurityCodeCreatedAt(null);
			userRepository.save(user);
			return error(HttpStatus.BAD_REQUEST, "EXPIRED_CODE", "Kodun süresi dolmuş. Lütfen yeni bir kod isteyin.");
		}
		user.setPassword(passwordEncoder.encode(request.getNewPassword()));
		user.setSecurityCode(null); // clear code after use
		user.setSecurityCodeCreatedAt(null);
		userRepository.save(user);
		Map<String, Object> res = new HashMap<>();
		res.put("success", true);
		return ResponseEntity.ok(res);
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

	@GetMapping("/me")
	public ResponseEntity<?> me(@RequestHeader(name = "Authorization", required = false) String authorization) {
		if (authorization == null || !authorization.startsWith("Bearer ")) {
			return error(HttpStatus.UNAUTHORIZED, "NO_TOKEN", "Token bulunamadı");
		}
		String token = authorization.substring(7).trim();
		try {
			Map<String, Object> claims = jwtService.parseClaims(token);

			// ✅ sub her zaman String bekleniyor
			String sub = (String) claims.get("sub");
			if (sub == null) {
				return error(HttpStatus.UNAUTHORIZED, "INVALID_TOKEN", "sub claim eksik");
			}
			Long userId = Long.parseLong(sub);

			Optional<User> userOpt = userRepository.findById(userId);
			if (userOpt.isEmpty()) return error(HttpStatus.UNAUTHORIZED, "USER_NOT_FOUND", "Kullanıcı bulunamadı");

			User user = userOpt.get();
			Map<String, Object> res = new HashMap<>();
			res.put("id", user.getId());
			res.put("email", user.getEmail());
			res.put("firstName", user.getFirstName());
			res.put("lastName", user.getLastName());
			res.put("isAdmin", user.isAdmin());
			return ResponseEntity.ok(res);

		} catch (Exception e) {
			return error(HttpStatus.UNAUTHORIZED, "INVALID_TOKEN", "Token geçersiz veya süresi dolmuş");
		}
	}

	@GetMapping("/is-admin")
	public ResponseEntity<?> isAdmin(@RequestHeader(name = "Authorization", required = false) String authorization) {
		if (authorization == null || !authorization.startsWith("Bearer ")) {
			return error(HttpStatus.UNAUTHORIZED, "NO_TOKEN", "Token bulunamadı");
		}
		String token = authorization.substring(7).trim();
		try {
			Map<String, Object> claims = jwtService.parseClaims(token);

			// ✅ sub her zaman String bekleniyor
			String sub = (String) claims.get("sub");
			if (sub == null) {
				return error(HttpStatus.UNAUTHORIZED, "INVALID_TOKEN", "sub claim eksik");
			}
			Long userId = Long.parseLong(sub);

			Optional<User> userOpt = userRepository.findById(userId);
			if (userOpt.isEmpty()) return error(HttpStatus.UNAUTHORIZED, "USER_NOT_FOUND", "Kullanıcı bulunamadı");

			User user = userOpt.get();
			Map<String, Object> res = new HashMap<>();
			res.put("isAdmin", user.isAdmin());
			return ResponseEntity.ok(res);

		} catch (Exception e) {
			return error(HttpStatus.UNAUTHORIZED, "INVALID_TOKEN", "Token geçersiz veya süresi dolmuş");
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
