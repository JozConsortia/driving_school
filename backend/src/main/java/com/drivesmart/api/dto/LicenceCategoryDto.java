package com.drivesmart.api.dto;

import jakarta.validation.constraints.NotBlank;

public record LicenceCategoryDto(String id, String code, String name) {

    public record CreateRequest(@NotBlank String code, @NotBlank String name) {}
}
