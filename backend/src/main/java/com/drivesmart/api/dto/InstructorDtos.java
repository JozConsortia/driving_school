package com.drivesmart.api.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class InstructorDtos {

    public record CreateRequest(
            @NotBlank @Size(min = 2) String name,
            @NotBlank @Email String email,
            @NotBlank @Size(min = 6) String password,
            String phone,
            String bio
    ) {}

    public record StatusRequest(@NotBlank @Pattern(regexp = "ACTIVE|SUSPENDED") String status) {}

    public record UpdateBioRequest(String bio) {}
}
