package com.drivesmart.api.dto;

import com.drivesmart.api.dto.CommonDtos.UserBasic;
import com.drivesmart.api.dto.CommonDtos.VehicleDto;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

import java.time.LocalDate;

public class BookingDtos {

    public record SchoolView(String id, String name, String city) {}
    public record InstructorView(String id, UserBasic user) {}
    public record LearnerView(UserBasic user) {}
    public record LessonRecordView(String notes, String progress, String attendance) {}

    public record BookingDto(
            String id, LocalDate date, String startTime, String endTime, String status,
            SchoolView school, InstructorView instructor, LearnerView learner,
            VehicleDto vehicle, LicenceCategoryDto licenceCategory, LessonRecordView lessonRecord
    ) {}

    public record CreateRequest(
            @NotBlank String instructorId,
            @NotBlank String schoolId,
            String vehicleId,
            @NotBlank String licenceCategoryCode,
            @NotNull LocalDate date,
            @NotBlank String startTime,
            @NotBlank String endTime
    ) {}

    public record StatusRequest(
            @NotBlank @Pattern(regexp = "CONFIRMED|REJECTED|CANCELLED") String status
    ) {}

    public record RescheduleRequest(
            @NotNull LocalDate date,
            @NotBlank String startTime,
            @NotBlank String endTime
    ) {}

    public record CompleteRequest(String notes, String progress, String attendance) {}

    public record LessonRecordCreated(String id, String bookingId, String notes, String progress, String attendance) {}
}
