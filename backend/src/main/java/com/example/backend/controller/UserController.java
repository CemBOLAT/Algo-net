package com.example.backend.controller;

import com.example.backend.dto.NameUpdateRequest;
import com.example.backend.dto.UserCreateRequest;
import com.example.backend.entity.User;
import com.example.backend.repository.UserRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserController(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @PostMapping
    public ResponseEntity<?> create(@Valid @RequestBody UserCreateRequest payload) {
        if (userRepository.findByEmail(payload.getEmail()).isPresent()) {
            return error(HttpStatus.CONFLICT, "EMAIL_EXISTS", "Bu e-posta ile kullanıcı zaten var.");
        }

        User user = new User();
        user.setEmail(payload.getEmail());
        user.setPassword(passwordEncoder.encode(payload.getPassword()));
        user.setFirstName(payload.getFirstName());
        user.setLastName(payload.getLastName());
        user.setSecurityCode(payload.getSecurityCode());
        User saved = userRepository.save(user);

        return ResponseEntity.created(URI.create("/api/users/" + saved.getId())).body(saved);
    }

    @PutMapping("/{id}/first-name")
    public ResponseEntity<?> updateFirstName(@PathVariable Long id, @Valid @RequestBody NameUpdateRequest body) {
        Optional<User> opt = userRepository.findById(id);
        if (opt.isEmpty()) {
            return error(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "Kullanıcı bulunamadı.");
        }
        User u = opt.get();
        u.setFirstName(body.getValue());
        userRepository.save(u);
        return ResponseEntity.ok(u);
    }

    @PutMapping("/{id}/last-name")
    public ResponseEntity<?> updateLastName(@PathVariable Long id, @Valid @RequestBody NameUpdateRequest body) {
        Optional<User> opt = userRepository.findById(id);
        if (opt.isEmpty()) {
            return error(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "Kullanıcı bulunamadı.");
        }
        User u = opt.get();
        u.setLastName(body.getValue());
        userRepository.save(u);
        return ResponseEntity.ok(u);
    }

    private ResponseEntity<Map<String, Object>> error(HttpStatus status, String code, String message) {
        Map<String, Object> res = new HashMap<>();
        res.put("error", true);
        res.put("code", code);
        res.put("message", message);
        return ResponseEntity.status(status).body(res);
    }
}
