package com.example.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(name = "first_name")
    private String firstName;

    @Column(name = "last_name")
    private String lastName;

    @Column(name = "security_code")
    private String securityCode; // This is code for 2FA

    @Column(name = "security_code_created_at")
    private LocalDateTime securityCodeCreatedAt;

    // new fields
    @Column(name = "is_admin")
    private Boolean isAdmin = false;

    @Column(name = "disabled")
    private Boolean disabled = false;

    public User() {}

    public User(String email, String password, String firstName, String lastName) {
        this.email = email;
        this.password = password;
        this.firstName = firstName;
        this.lastName = lastName;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }

    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }

    public String getSecurityCode() { return securityCode; }
    public void setSecurityCode(String securityCode) { this.securityCode = securityCode; }

    public LocalDateTime getSecurityCodeCreatedAt() { return securityCodeCreatedAt; }
    public void setSecurityCodeCreatedAt(LocalDateTime securityCodeCreatedAt) { this.securityCodeCreatedAt = securityCodeCreatedAt; }

    public Boolean isAdmin() { return isAdmin; }
    public void setAdmin(Boolean admin) { isAdmin = admin; }

    public Boolean isDisabled() { return disabled; }

    public void setDisabled(Boolean disabled) { this.disabled = disabled; }
}
