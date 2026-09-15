package com.drivesmart.api.dto;

import java.time.Instant;

public record NotificationDto(String id, String message, boolean read, Instant createdAt) {}
