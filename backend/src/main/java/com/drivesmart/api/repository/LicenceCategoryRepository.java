package com.drivesmart.api.repository;

import com.drivesmart.api.entity.LicenceCategory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface LicenceCategoryRepository extends JpaRepository<LicenceCategory, String> {
    Optional<LicenceCategory> findByCode(String code);
}
