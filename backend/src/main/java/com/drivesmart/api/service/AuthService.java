package com.drivesmart.api.service;

import com.drivesmart.api.dto.AuthDtos.*;
import com.drivesmart.api.entity.DrivingSchool;
import com.drivesmart.api.entity.Learner;
import com.drivesmart.api.entity.Role;
import com.drivesmart.api.entity.User;
import com.drivesmart.api.exception.ApiException;
import com.drivesmart.api.repository.DrivingSchoolRepository;
import com.drivesmart.api.repository.LearnerRepository;
import com.drivesmart.api.repository.UserRepository;
import com.drivesmart.api.security.JwtService;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final LearnerRepository learnerRepository;
    private final DrivingSchoolRepository schoolRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(
            UserRepository userRepository,
            LearnerRepository learnerRepository,
            DrivingSchoolRepository schoolRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService) {
        this.userRepository = userRepository;
        this.learnerRepository = learnerRepository;
        this.schoolRepository = schoolRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional
    public AuthResponse register(RegisterRequest req) {
        if (userRepository.existsByEmail(req.email())) {
            throw new ApiException(HttpStatus.CONFLICT, "Email already registered");
        }

        Role role = req.role() == null ? Role.LEARNER : req.role();

        if (role == Role.SCHOOL_ADMIN && (isBlank(req.schoolName()) || isBlank(req.city()))) {
            throw ApiException.badRequest("schoolName and city are required to register a driving school");
        }

        User user = new User();
        user.setName(req.name());
        user.setEmail(req.email());
        user.setPassword(passwordEncoder.encode(req.password()));
        user.setPhone(req.phone());
        user.setRole(role);
        userRepository.save(user);

        if (role == Role.LEARNER) {
            Learner learner = new Learner();
            learner.setUser(user);
            learnerRepository.save(learner);
        } else if (role == Role.SCHOOL_ADMIN) {
            DrivingSchool school = new DrivingSchool();
            school.setOwner(user);
            school.setName(req.schoolName());
            school.setCity(req.city());
            school.setStatus("PENDING");
            schoolRepository.save(school);
        }
        // INSTRUCTOR accounts are created by a school admin via /api/instructors, not self-registered.

        String token = jwtService.generateToken(user.getId(), user.getRole());
        return new AuthResponse(token, new AuthUserDto(user.getId(), user.getName(), user.getEmail(), user.getRole()));
    }

    public AuthResponse login(LoginRequest req) {
        User user = userRepository.findByEmail(req.email())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Invalid email or password"));

        if ("SUSPENDED".equals(user.getStatus())) {
            throw ApiException.forbidden("This account has been suspended");
        }
        if (!passwordEncoder.matches(req.password(), user.getPassword())) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
        }

        String token = jwtService.generateToken(user.getId(), user.getRole());
        return new AuthResponse(token, new AuthUserDto(user.getId(), user.getName(), user.getEmail(), user.getRole()));
    }

    public MeResponse me(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> ApiException.notFound("User not found"));
        return new MeResponse(
                user.getId(), user.getName(), user.getEmail(), user.getPhone(),
                user.getRole(), user.getStatus(), user.getCreatedAt());
    }

    @Transactional
    public MeResponse updateProfile(String userId, UpdateProfileRequest req) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> ApiException.notFound("User not found"));
        user.setName(req.name());
        user.setPhone(req.phone());
        userRepository.save(user);
        return me(userId);
    }

    @Transactional
    public void changePassword(String userId, ChangePasswordRequest req) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> ApiException.notFound("User not found"));
        if (!passwordEncoder.matches(req.currentPassword(), user.getPassword())) {
            throw ApiException.badRequest("Current password is incorrect");
        }
        user.setPassword(passwordEncoder.encode(req.newPassword()));
        userRepository.save(user);
    }

    private static boolean isBlank(String s) {
        return s == null || s.isBlank();
    }
}
