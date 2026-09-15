package com.drivesmart.api.repository;

import com.drivesmart.api.entity.Instructor;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface InstructorRepository extends JpaRepository<Instructor, String> {
    Optional<Instructor> findByUserId(String userId);
    List<Instructor> findBySchoolId(String schoolId);
    List<Instructor> findBySchoolIdAndStatus(String schoolId, String status);
    long countBySchoolId(String schoolId);
}
