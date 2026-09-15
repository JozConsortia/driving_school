package com.drivesmart.api.repository;

import com.drivesmart.api.entity.Vehicle;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface VehicleRepository extends JpaRepository<Vehicle, String> {
    List<Vehicle> findBySchoolId(String schoolId);
    long countBySchoolId(String schoolId);
}
