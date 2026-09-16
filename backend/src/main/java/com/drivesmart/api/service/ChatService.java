package com.drivesmart.api.service;

import com.anthropic.client.AnthropicClient;
import com.anthropic.client.okhttp.AnthropicOkHttpClient;
import com.anthropic.core.JsonValue;
import com.anthropic.errors.AnthropicServiceException;
import com.anthropic.errors.RateLimitException;
import com.anthropic.errors.UnauthorizedException;
import com.anthropic.models.messages.ContentBlock;
import com.anthropic.models.messages.ContentBlockParam;
import com.anthropic.models.messages.Message;
import com.anthropic.models.messages.MessageCreateParams;
import com.anthropic.models.messages.MessageParam;
import com.anthropic.models.messages.OutputConfig;
import com.anthropic.models.messages.StopReason;
import com.anthropic.models.messages.Tool;
import com.anthropic.models.messages.ToolResultBlockParam;
import com.anthropic.models.messages.ToolUseBlock;
import com.drivesmart.api.dto.ChatDtos.ChatMessage;
import com.drivesmart.api.dto.ChatDtos.ChatResponse;
import com.drivesmart.api.dto.SchoolDtos.SearchResult;
import com.drivesmart.api.exception.ApiException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class ChatService {

    private static final Logger log = LoggerFactory.getLogger(ChatService.class);
    private static final String MODEL = "claude-opus-5";
    private static final int MAX_TOOL_ITERATIONS = 4;

    private static final String SYSTEM_PROMPT = """
            You are the DriveSmart Assistant - a friendly helper inside DriveSmart, a South African \
            marketplace that connects learners with driving schools and instructors.

            Your only job is to help the user find a driving school that fits what they're looking for: \
            location/city, licence category (Code 8 = light motor vehicle, Code 10 = heavy motor vehicle, \
            Code 14 = extra heavy motor vehicle), budget per hour, day availability, or rating.

            Always call the search_driving_schools tool before recommending any school - never invent \
            school names, prices, cities, or ratings. If the user hasn't mentioned a city yet, ask which \
            city or area they're in before searching. You may call the tool more than once if the user \
            refines their request (e.g. changes city or adds a budget).

            Keep replies short, warm, and conversational - 2 to 4 sentences. When you get search results, \
            highlight 2-3 of the best matches by name with a one-line reason each (price, rating, or \
            availability) rather than dumping a raw list. If nothing matches, say so plainly and suggest \
            one way to broaden the search (a different city, a higher budget, etc). Stay on topic - if the \
            user asks about something unrelated to finding or booking driving lessons, gently steer back.""";

    private final SchoolService schoolService;
    private final ObjectMapper objectMapper;
    private AnthropicClient client;
    private String unavailableReason;

    public ChatService(SchoolService schoolService) {
        this.schoolService = schoolService;
        this.objectMapper = new ObjectMapper();
        try {
            this.client = AnthropicOkHttpClient.fromEnv();
        } catch (Exception e) {
            log.warn("Anthropic client not configured: {}", e.getMessage());
            this.unavailableReason = "The chat assistant isn't configured yet - set the ANTHROPIC_API_KEY "
                    + "environment variable on the server and restart it.";
        }
    }

    public ChatResponse chat(List<ChatMessage> history) {
        if (client == null) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, unavailableReason);
        }

        List<MessageParam> messages = new ArrayList<>();
        for (ChatMessage m : history) {
            MessageParam.Role role = "assistant".equalsIgnoreCase(m.role()) ? MessageParam.Role.ASSISTANT : MessageParam.Role.USER;
            messages.add(MessageParam.builder().role(role).content(m.content()).build());
        }

        List<SearchResult> lastResults = List.of();

        for (int iteration = 0; iteration < MAX_TOOL_ITERATIONS; iteration++) {
            Message response;
            try {
                response = client.messages().create(MessageCreateParams.builder()
                        .model(MODEL)
                        .maxTokens(1024L)
                        .system(SYSTEM_PROMPT)
                        .outputConfig(OutputConfig.builder().effort(OutputConfig.Effort.LOW).build())
                        .addTool(buildSearchTool())
                        .messages(messages)
                        .build());
            } catch (UnauthorizedException e) {
                log.error("Anthropic API authentication failed - check ANTHROPIC_API_KEY", e);
                throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE,
                        "The chat assistant isn't configured correctly - check that ANTHROPIC_API_KEY is set to a valid key on the server.");
            } catch (RateLimitException e) {
                throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, "The chat assistant is busy right now - please try again in a moment.");
            } catch (AnthropicServiceException e) {
                log.error("Anthropic API error", e);
                throw new ApiException(HttpStatus.BAD_GATEWAY, "The chat assistant had trouble responding. Please try again.");
            }

            messages.add(response.toParam());

            if (response.stopReason().equals(Optional.of(StopReason.TOOL_USE))) {
                List<ContentBlockParam> toolResults = new ArrayList<>();
                for (ContentBlock block : response.content()) {
                    Optional<ToolUseBlock> toolUse = block.toolUse();
                    if (toolUse.isEmpty()) continue;

                    ToolUseBlock use = toolUse.get();
                    if (!"search_driving_schools".equals(use.name())) continue;

                    List<SearchResult> results = executeSearch(use);
                    lastResults = results;

                    String resultJson;
                    try {
                        resultJson = objectMapper.writeValueAsString(results);
                    } catch (Exception e) {
                        resultJson = "[]";
                    }

                    toolResults.add(ContentBlockParam.ofToolResult(ToolResultBlockParam.builder()
                            .toolUseId(use.id())
                            .content(resultJson)
                            .build()));
                }

                if (toolResults.isEmpty()) {
                    break;
                }
                messages.add(MessageParam.builder().role(MessageParam.Role.USER).contentOfBlockParams(toolResults).build());
                continue;
            }

            String reply = response.content().stream()
                    .map(ContentBlock::text)
                    .filter(Optional::isPresent)
                    .map(t -> t.get().text())
                    .reduce("", (a, b) -> a.isBlank() ? b : a + "\n" + b);

            return new ChatResponse(reply.isBlank() ? "Sorry, I didn't quite catch that - could you rephrase?" : reply, lastResults);
        }

        return new ChatResponse("I looked into a few options but I'm having trouble narrowing it down - could you tell me a bit more (city, budget, or licence type)?", lastResults);
    }

    @SuppressWarnings("unchecked")
    private List<SearchResult> executeSearch(ToolUseBlock use) {
        Map<String, Object> args = use._input().convert(Map.class);

        String city = asString(args.get("city"));
        String licenceCategory = asString(args.get("licenceCategory"));
        Double maxPrice = asDouble(args.get("maxPrice"));
        Double minRating = asDouble(args.get("minRating"));
        Integer day = asInteger(args.get("day"));

        try {
            return schoolService.search(city, licenceCategory, maxPrice, minRating, day);
        } catch (Exception e) {
            log.error("search_driving_schools tool execution failed", e);
            return List.of();
        }
    }

    private static String asString(Object value) {
        return value == null ? null : value.toString();
    }

    private static Double asDouble(Object value) {
        return value instanceof Number n ? n.doubleValue() : null;
    }

    private static Integer asInteger(Object value) {
        return value instanceof Number n ? n.intValue() : null;
    }

    private Tool buildSearchTool() {
        Tool.InputSchema.Properties properties = Tool.InputSchema.Properties.builder()
                .putAdditionalProperty("city", JsonValue.from(Map.of(
                        "type", "string",
                        "description", "City or town in South Africa to search in, e.g. \"Cape Town\" or \"Durban\". Omit if the user hasn't said where they are."
                )))
                .putAdditionalProperty("licenceCategory", JsonValue.from(Map.of(
                        "type", "string",
                        "description", "Licence category code: \"Code 8\" (light motor vehicle), \"Code 10\" (heavy motor vehicle), or \"Code 14\" (extra heavy motor vehicle). Omit if not mentioned."
                )))
                .putAdditionalProperty("maxPrice", JsonValue.from(Map.of(
                        "type", "number",
                        "description", "Maximum price per hour in South African Rand (ZAR). Omit if not mentioned."
                )))
                .putAdditionalProperty("minRating", JsonValue.from(Map.of(
                        "type", "number",
                        "description", "Minimum average star rating from 1 to 5. Only set this if the user asks for a highly-rated or \"best\" school."
                )))
                .putAdditionalProperty("day", JsonValue.from(Map.of(
                        "type", "integer",
                        "description", "Day of the week for the lesson: 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday. Omit if not mentioned."
                )))
                .build();

        return Tool.builder()
                .name("search_driving_schools")
                .description("Search DriveSmart's real database of approved driving schools by city, licence category, price, rating and day availability. Always call this before recommending or naming any school.")
                .inputSchema(Tool.InputSchema.builder().properties(properties).build())
                .build();
    }
}
