package com.drivesmart.api.dto;

import com.drivesmart.api.dto.SchoolDtos.SearchResult;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public class ChatDtos {

    public record ChatMessage(String role, String content) {}

    public record ChatRequest(@NotEmpty List<ChatMessage> messages) {}

    public record ChatResponse(String reply, List<SearchResult> schools) {}
}
