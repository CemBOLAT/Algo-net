package com.example.backend.controller;

import com.example.backend.dto.NameUpdateRequest;
import com.example.backend.dto.UserCreateRequest;
import com.example.backend.entity.User;
import com.example.backend.repository.UserRepository;
import com.example.backend.service.JwtService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
public class UserController {

    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @Autowired
    private UserRepository userRepository;

    public UserController(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @PostMapping("/create-user") // Create user
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

        return ResponseEntity.created(URI.create("/api/users/" + saved.getId())).body(saved); //
    } 

    @PutMapping("/users/{id}/first-name")
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

    @PutMapping("/users/{id}/last-name")
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

    // List users (no password exposure) - paginated and excluding admins
    @GetMapping("/users")
    public ResponseEntity<?> listUsers(@RequestHeader(name = "Authorization", required = false) String authorization,
                                       @RequestParam(value = "page", defaultValue = "0") int page,
                                       @RequestParam(value = "size", defaultValue = "10") int size) {
        // auth check
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            return error(HttpStatus.UNAUTHORIZED, "NO_TOKEN", "Token bulunamadı");
        }
        String token = authorization.substring(7).trim();
        try {
            Map<String, Object> claims = jwtService.parseClaims(token);
            Long userId = Long.parseLong((String) claims.get("sub"));
            Optional<User> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) return error(HttpStatus.UNAUTHORIZED, "USER_NOT_FOUND", "Kullanıcı bulunamadı");
            if (!userOpt.get().isAdmin()) return error(HttpStatus.FORBIDDEN, "NOT_ADMIN", "Yetersiz yetki");
        } catch (Exception e) {
            return error(HttpStatus.UNAUTHORIZED, "INVALID_TOKEN", "Token geçersiz veya süresi dolmuş");
        }
        List<User> users = userRepository.findAll();
        // filter out admin users
        List<User> nonAdmins = users.stream().filter(u -> !u.isAdmin()).collect(Collectors.toList());
        int total = nonAdmins.size();
        int fromIndex = Math.min(page * size, total);
        int toIndex = Math.min(fromIndex + size, total);
        List<Map<String, Object>> out = nonAdmins.subList(fromIndex, toIndex).stream().map(u -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", u.getId());
            m.put("firstName", u.getFirstName());
            m.put("lastName", u.getLastName());
            m.put("email", u.getEmail());
            m.put("isAdmin", u.isAdmin());
            m.put("disabled", u.isDisabled());
            return m;
        }).collect(Collectors.toList());
        Map<String, Object> res = new HashMap<>();
        res.put("users", out);
        res.put("total", total);
        res.put("page", page);
        res.put("size", size);
        return ResponseEntity.ok(res);
    }

    // Delete user
    @DeleteMapping("/delete-user/{id}")
    public ResponseEntity<?> deleteUser(@RequestHeader(name = "Authorization", required = false) String authorization, @PathVariable Long id) {
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            return error(HttpStatus.UNAUTHORIZED, "NO_TOKEN", "Token bulunamadı");
        }
        String token = authorization.substring(7).trim();
        try {
            Map<String, Object> claims = jwtService.parseClaims(token);
            Long userId = Long.parseLong((String) claims.get("sub"));
            Optional<User> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) return error(HttpStatus.UNAUTHORIZED, "USER_NOT_FOUND", "Kullanıcı bulunamadı");
            if (!userOpt.get().isAdmin()) return error(HttpStatus.FORBIDDEN, "NOT_ADMIN", "Yetersiz yetki");
        } catch (Exception e) {
            return error(HttpStatus.UNAUTHORIZED, "INVALID_TOKEN", "Token geçersiz veya süresi dolmuş");
        }
        if (!userRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        userRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // Toggle disable/enable user
    @PutMapping("/set/{id}/disable")
    public ResponseEntity<?> setDisabled(@RequestHeader(name = "Authorization", required = false) String authorization, @PathVariable Long id, @RequestBody Map<String, Object> body) {
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            return error(HttpStatus.UNAUTHORIZED, "NO_TOKEN", "Token bulunamadı");
        }
        String token = authorization.substring(7).trim();
        try {
            Map<String, Object> claims = jwtService.parseClaims(token);
            Long userId = Long.parseLong((String) claims.get("sub"));
            Optional<User> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) return error(HttpStatus.UNAUTHORIZED, "USER_NOT_FOUND", "Kullanıcı bulunamadı");
            if (!userOpt.get().isAdmin()) return error(HttpStatus.FORBIDDEN, "NOT_ADMIN", "Yetersiz yetki");
        } catch (Exception e) {
            return error(HttpStatus.UNAUTHORIZED, "INVALID_TOKEN", "Token geçersiz veya süresi dolmuş");
        }
        Optional<User> opt = userRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();
        User u = opt.get();
        Object val = body.get("disabled");
        boolean disabled = false;
        if (val instanceof Boolean) disabled = (Boolean) val;
        else if (val instanceof String) disabled = Boolean.parseBoolean((String) val);
        u.setDisabled(disabled);
        userRepository.save(u);
        Map<String, Object> resp = new HashMap<>();
        resp.put("id", u.getId());
        resp.put("disabled", u.isDisabled());
        return ResponseEntity.ok(resp);
    }

    private ResponseEntity<Map<String, Object>> error(HttpStatus status, String code, String message) {
        Map<String, Object> res = new HashMap<>();
        res.put("error", true);
        res.put("code", code);
        res.put("message", message);
        return ResponseEntity.status(status).body(res);
    }
}
