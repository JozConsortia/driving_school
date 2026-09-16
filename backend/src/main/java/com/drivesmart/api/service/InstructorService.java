package com.drivesmart.api.service;

import com.drivesmart.api.dto.CommonDtos.InstructorDto;
import com.drivesmart.api.dto.CommonDtos.UserBasic;
import com.drivesmart.api.dto.InstructorDtos.CreateRequest;
import com.drivesmart.api.entity.DrivingSchool;
import com.drivesmart.api.entity.Instructor;
import com.drivesmart.api.entity.Role;
import com.drivesmart.api.entity.User;
import com.drivesmart.api.exception.ApiException;
import com.drivesmart.api.repository.InstructorRepository;
import com.drivesmart.api.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class InstructorService {

    private final InstructorRepository instructorRepository;
    private final UserRepository userRepository;
    private final SchoolService schoolService;
    private final PasswordEncoder passwordEncoder;

    public InstructorService(
            InstructorRepository instructorRepository,
            UserRepository userRepository,
            SchoolService schoolService,
            PasswordEncoder passwordEncoder) {
        this.instructorRepository = instructorRepository;
        this.userRepository = userRepository;
        this.schoolService = schoolService;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public List<InstructorDto> listBySchool(String schoolId) {
        return instructorRepository.findBySchoolIdAndStatus(schoolId, "ACTIVE").stream().map(this::toDto).toList();
    }

    @Transactional(readOnly = true)
    public List<InstructorDto> listMine(String ownerId) {
        DrivingSchool school = schoolService.requireOwnedSchool(ownerId);
        return instructorRepository.findBySchoolId(school.getId()).stream().map(this::toDto).toList();
    }

    @Transactional
    public InstructorDto create(String ownerId, CreateRequest req) {
        DrivingSchool school = schoolService.requireOwnedSchool(ownerId);
        if (userRepository.existsByEmail(req.email())) {
            throw ApiException.conflict("Email already registered");
        }

        User user = new User();
        user.setName(req.name());
        user.setEmail(req.email());
        user.setPassword(passwordEncoder.encode(req.password()));
        user.setPhone(req.phone());
        user.setRole(Role.INSTRUCTOR);
        userRepository.save(user);

        Instructor instructor = new Instructor();
        instructor.setUser(user);
        instructor.setSchool(school);
        instructor.setBio(req.bio());
        instructorRepository.save(instructor);

        return toDto(instructor);
    }

    @Transactional
    public InstructorDto updateStatus(String ownerId, String instructorId, String status) {
        DrivingSchool school = schoolService.requireOwnedSchool(ownerId);
        Instructor instructor = instructorRepository.findById(instructorId)
                .orElseThrow(() -> ApiException.notFound("Instructor not found"));
        if (!instructor.getSchool().getId().equals(school.getId())) {
            throw ApiException.notFound("Instructor not found");
        }
        instructor.setStatus(status);
        instructorRepository.save(instructor);
        return toDto(instructor);
    }

    @Transactional(readOnly = true)
    public InstructorDto getMine(String userId) {
        Instructor instructor = instructorRepository.findByUserId(userId)
                .orElseThrow(() -> ApiException.notFound("Instructor profile not found"));
        return toDto(instructor);
    }

    @Transactional
    public InstructorDto updateMyBio(String userId, String bio) {
        Instructor instructor = instructorRepository.findByUserId(userId)
                .orElseThrow(() -> ApiException.notFound("Instructor profile not found"));
        instructor.setBio(bio);
        instructorRepository.save(instructor);
        return toDto(instructor);
    }

    private InstructorDto toDto(Instructor i) {
        return new InstructorDto(i.getId(), i.getBio(), i.getStatus(),
                new UserBasic(i.getUser().getId(), i.getUser().getName(), i.getUser().getEmail(), i.getUser().getPhone()));
    }
}
