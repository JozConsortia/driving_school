package com.drivesmart.api.repository;

import com.drivesmart.api.entity.Availability;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface AvailabilityRepository extends JpaRepository<Availability, String> {

    List<Availability> findByInstructorIdAndBookedFalseAndDateGreaterThanEqualOrderByDateAscStartTimeAsc(
            String instructorId, LocalDate date);

    List<Availability> findByInstructorIdOrderByDateAscStartTimeAsc(String instructorId);

    Optional<Availability> findByInstructorIdAndDateAndStartTimeAndEndTime(
            String instructorId, LocalDate date, String startTime, String endTime);

    List<Availability> findByInstructorIdAndBookedFalseAndDateAndStartTimeLessThanEqualAndEndTimeGreaterThanEqual(
            String instructorId, LocalDate date, String startTime, String endTime);
}
