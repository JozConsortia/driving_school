package com.drivesmart.api.dto;

import jakarta.validation.constraints.NotBlank;

public class VehicleDtos {

    public record CreateRequest(
            @NotBlank String make,
            @NotBlank String model,
            Integer year,
            @NotBlank String licencePlate,
            String transmission
    ) {}

    public record StatusRequest(@NotBlank String status) {}
}
