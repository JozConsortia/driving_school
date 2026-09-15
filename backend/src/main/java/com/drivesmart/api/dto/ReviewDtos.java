package com.drivesmart.api.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

import java.time.Instant;

public class ReviewDtos {

    public record ReviewView(String id, Integer rating, String comment, Instant createdAt, CommonDtos.NameOnly user) {}

    public record CreateRequest(
            @NotBlank String schoolId,
            @Min(1) @Max(5) int rating,
            String comment
    ) {}
}
