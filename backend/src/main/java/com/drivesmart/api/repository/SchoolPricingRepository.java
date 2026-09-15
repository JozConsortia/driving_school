package com.drivesmart.api.repository;

import com.drivesmart.api.entity.SchoolPricing;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SchoolPricingRepository extends JpaRepository<SchoolPricing, String> {
    List<SchoolPricing> findBySchoolId(String schoolId);
    Optional<SchoolPricing> findBySchoolIdAndLicenceCategoryId(String schoolId, String licenceCategoryId);
}
