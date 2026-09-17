package com.drivesmart.api.repository;

import com.drivesmart.api.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AuditLogRepository extends JpaRepository<AuditLog, String> {
    List<AuditLog> findTop200ByOrderByCreatedAtDesc();
}
