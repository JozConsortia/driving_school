package com.drivesmart.api.repository;

import com.drivesmart.api.entity.DrivingSchool;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DrivingSchoolRepository extends JpaRepository<DrivingSchool, String> {
    Optional<DrivingSchool> findByOwnerId(String ownerId);
    List<DrivingSchool> findByStatus(String status);
    List<DrivingSchool> findByStatusAndCityContainingIgnoreCase(String status, String city);
}
