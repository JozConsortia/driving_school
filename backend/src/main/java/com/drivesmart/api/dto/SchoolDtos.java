package com.drivesmart.api.dto;

import com.drivesmart.api.dto.CommonDtos.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;

import java.time.Instant;
import java.util.List;

public class SchoolDtos {

    public record ServicePrice(String licenceCategory, Double pricePerHour) {}

    public record SearchResult(
            String id, String name, String description, String city, String address, String phone, String email,
            Double avgRating, long reviewCount, List<ServicePrice> services, List<String> vehicleTypes, long instructorCount
    ) {}

    public record PricingEntry(String id, Double pricePerHour, LicenceCategoryDto licenceCategory) {}

    public record ReviewView(String id, Integer rating, String comment, Instant createdAt, String userId, NameOnly user) {}

    public record Profile(
            String id, String name, String description, String city, String address, String phone, String email,
            String status, Double avgRating,
            List<PricingEntry> services, List<InstructorDto> instructors, List<VehicleDto> vehicles, List<ReviewView> reviews
    ) {}

    public record UpdateRequest(String name, String description, String city, String address, String phone,
                                 @Email String email) {}

    public record CreateServiceRequest(@NotBlank String licenceCategoryCode, @Positive Double pricePerHour) {}
}
