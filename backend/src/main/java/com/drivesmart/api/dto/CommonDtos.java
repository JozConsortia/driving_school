package com.drivesmart.api.dto;

public class CommonDtos {
    public record UserBasic(String id, String name, String email, String phone) {}
    public record NameOnly(String name) {}
    public record VehicleDto(String id, String make, String model, Integer year, String licencePlate, String transmission, String status) {}
    public record InstructorDto(String id, String bio, String status, UserBasic user) {}
}
