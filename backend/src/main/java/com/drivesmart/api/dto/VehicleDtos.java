package com.drivesmart.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class VehicleDtos {

    public record CreateRequest(
            @NotBlank String make,
            @NotBlank String model,
            Integer year,
            @NotBlank String licencePlate,
            String transmission
    ) {}

    public record StatusRequest(@NotBlank @Pattern(regexp = "ACTIVE|INACTIVE") String status) {}
}
