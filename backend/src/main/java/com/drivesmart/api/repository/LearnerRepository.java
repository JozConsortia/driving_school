package com.drivesmart.api.repository;

import com.drivesmart.api.entity.Learner;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface LearnerRepository extends JpaRepository<Learner, String> {
    Optional<Learner> findByUserId(String userId);
}
