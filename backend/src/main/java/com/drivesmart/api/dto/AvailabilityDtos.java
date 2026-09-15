package com.drivesmart.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public class AvailabilityDtos {

    public record SlotDto(String id, String instructorId, LocalDate date, String startTime, String endTime, boolean isBooked) {}

    public record CreateRequest(
            @NotNull LocalDate date,
            @NotBlank String startTime,
            @NotBlank String endTime
    ) {}
}
