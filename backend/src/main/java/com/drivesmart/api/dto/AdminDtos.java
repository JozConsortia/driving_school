package com.drivesmart.api.dto;

import com.drivesmart.api.entity.Role;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

import java.time.Instant;

public class AdminDtos {

    public record Stats(
            long totalUsers, long totalLearners, long totalInstructors, long totalSchools,
            long approvedSchools, long pendingSchools, long totalBookings, long completedBookings
    ) {}

    public record OwnerView(String name, String email, String phone) {}
    public record Counts(long instructors, long vehicles, long bookings) {}

    public record SchoolView(String id, String name, String city, String status, OwnerView owner, Counts counts) {}

    public record UserView(String id, String name, String email, String phone, Role role, String status, Instant createdAt) {}

    public record ReportedReviewView(String id, Integer rating, String comment, CommonDtos.NameOnly school,
                                      OwnerView user) {}

    public record SchoolStatusRequest(
            @NotBlank @Pattern(regexp = "APPROVED|REJECTED|SUSPENDED|PENDING") String status
    ) {}

    public record UserStatusRequest(
            @NotBlank @Pattern(regexp = "ACTIVE|SUSPENDED") String status
    ) {}

    public record ReviewStatusRequest(
            @NotBlank @Pattern(regexp = "VISIBLE|REMOVED") String status
    ) {}
}
