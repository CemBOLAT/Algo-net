package com.example.backend.dto;

import jakarta.validation.constraints.NotBlank;

public class NameUpdateRequest {

    @NotBlank(message = "Değer boş olamaz")
    private String value;

    public String getValue() { return value; }
    public void setValue(String value) { this.value = value; }
}
