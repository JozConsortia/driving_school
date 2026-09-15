package com.drivesmart.api.dto;

import com.drivesmart.api.entity.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class AuthDtos {

    public record RegisterRequest(
            @NotBlank @Size(min = 2) String name,
            @NotBlank @Email String email,
            @NotBlank @Size(min = 6) String password,
            String phone,
            Role role,
            String schoolName,
            String city
    ) {}

    public record LoginRequest(
            @NotBlank @Email String email,
            @NotBlank String password
    ) {}

    public record AuthUserDto(String id, String name, String email, Role role) {}

    public record AuthResponse(String token, AuthUserDto user) {}

    public record MeResponse(
            String id, String name, String email, String phone, Role role, String status,
            java.time.Instant createdAt
    ) {}
}
