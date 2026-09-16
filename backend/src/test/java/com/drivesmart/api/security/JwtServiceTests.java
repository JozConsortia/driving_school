package com.drivesmart.api.security;

import com.drivesmart.api.entity.Role;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class JwtServiceTests {

    private static final String SECRET = "test-secret-that-is-at-least-thirty-two-characters-long";

    @Test
    void generatesAndParsesTokenWithUserIdAndRole() {
        JwtService jwtService = new JwtService(SECRET, 60_000);

        String token = jwtService.generateToken("user-123", Role.INSTRUCTOR);
        JwtService.TokenPayload payload = jwtService.parseToken(token);

        assertEquals("user-123", payload.userId());
        assertEquals(Role.INSTRUCTOR, payload.role());
    }

    @Test
    void rejectsTokenSignedWithDifferentSecret() {
        JwtService tokenIssuer = new JwtService(SECRET, 60_000);
        JwtService tokenParser = new JwtService("another-secret-that-is-at-least-thirty-two-chars", 60_000);

        String token = tokenIssuer.generateToken("user-123", Role.LEARNER);

        assertThrows(Exception.class, () -> tokenParser.parseToken(token));
    }
}
