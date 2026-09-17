package com.drivesmart.api.service;

import com.drivesmart.api.dto.AuditLogDto;
import com.drivesmart.api.entity.AuditLog;
import com.drivesmart.api.entity.User;
import com.drivesmart.api.repository.AuditLogRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    public AuditLogService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @Transactional
    public void log(User actor, String action, String details) {
        AuditLog entry = new AuditLog();
        entry.setActor(actor);
        entry.setAction(action);
        entry.setDetails(details);
        auditLogRepository.save(entry);
    }

    @Transactional(readOnly = true)
    public List<AuditLogDto> recent() {
        return auditLogRepository.findTop200ByOrderByCreatedAtDesc().stream()
                .map(a -> new AuditLogDto(
                        a.getId(),
                        a.getActor() == null ? "System" : a.getActor().getName(),
                        a.getActor() == null ? null : a.getActor().getEmail(),
                        a.getAction(),
                        a.getDetails(),
                        a.getCreatedAt()))
                .toList();
    }
}
