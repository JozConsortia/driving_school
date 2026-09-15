package com.drivesmart.api.repository;

import com.drivesmart.api.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReviewRepository extends JpaRepository<Review, String> {
    List<Review> findBySchoolIdAndStatusOrderByCreatedAtDesc(String schoolId, String status);
    List<Review> findByStatusOrderByCreatedAtDesc(String status);
}
