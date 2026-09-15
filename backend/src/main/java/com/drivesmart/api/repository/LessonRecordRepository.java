package com.drivesmart.api.repository;

import com.drivesmart.api.entity.LessonRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface LessonRecordRepository extends JpaRepository<LessonRecord, String> {
    Optional<LessonRecord> findByBookingId(String bookingId);
}
