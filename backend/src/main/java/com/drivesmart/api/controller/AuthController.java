package com.drivesmart.api.controller;

import com.drivesmart.api.dto.AuthDtos.*;
import com.drivesmart.api.security.CurrentUser;
import com.drivesmart.api.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(req));
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest req) {
        return authService.login(req);
    }

    @GetMapping("/me")
    public MeResponse me() {
        return authService.me(CurrentUser.require());
    }

    @PutMapping("/me")
    public MeResponse updateProfile(@Valid @RequestBody UpdateProfileRequest req) {
        return authService.updateProfile(CurrentUser.require(), req);
    }

    @PutMapping("/me/password")
    public ResponseEntity<Void> changePassword(@Valid @RequestBody ChangePasswordRequest req) {
        authService.changePassword(CurrentUser.require(), req);
        return ResponseEntity.noContent().build();
    }
}