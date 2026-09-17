package com.drivesmart.api.dto;

import java.time.Instant;

public record AuditLogDto(String id, String actorName, String actorEmail, String action, String details, Instant createdAt) {}
