package com.example.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class UserCreateRequest {

    @Email(message = "Geçerli bir e-posta girin")
    @NotBlank(message = "E-posta zorunludur")
    private String email;

    @NotBlank(message = "Şifre zorunludur")
    @Size(min = 6, message = "Şifre en az 6 karakter olmalı")
    private String password;

    @NotBlank(message = "Ad zorunludur")
    private String firstName;

    @NotBlank(message = "Soyad zorunludur")
    private String lastName;

    private String securityCode;

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
}
