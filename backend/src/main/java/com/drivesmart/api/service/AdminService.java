package com.drivesmart.api.service;

import com.drivesmart.api.dto.AdminDtos.*;
import com.drivesmart.api.dto.CommonDtos.NameOnly;
import com.drivesmart.api.entity.*;
import com.drivesmart.api.exception.ApiException;
import com.drivesmart.api.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AdminService {

    private final UserRepository userRepository;
    private final LearnerRepository learnerRepository;
    private final InstructorRepository instructorRepository;
    private final DrivingSchoolRepository schoolRepository;
    private final VehicleRepository vehicleRepository;
    private final BookingRepository bookingRepository;
    private final ReviewRepository reviewRepository;
    private final NotificationService notificationService;

    public AdminService(
            UserRepository userRepository,
            LearnerRepository learnerRepository,
            InstructorRepository instructorRepository,
            DrivingSchoolRepository schoolRepository,
            VehicleRepository vehicleRepository,
            BookingRepository bookingRepository,
            ReviewRepository reviewRepository,
            NotificationService notificationService) {
        this.userRepository = userRepository;
        this.learnerRepository = learnerRepository;
        this.instructorRepository = instructorRepository;
        this.schoolRepository = schoolRepository;
        this.vehicleRepository = vehicleRepository;
        this.bookingRepository = bookingRepository;
        this.reviewRepository = reviewRepository;
        this.notificationService = notificationService;
    }

    public Stats stats() {
        return new Stats(
                userRepository.count(),
                learnerRepository.count(),
                instructorRepository.count(),
                schoolRepository.count(),
                schoolRepository.findByStatus("APPROVED").size(),
                schoolRepository.findByStatus("PENDING").size(),
                bookingRepository.count(),
                bookingRepository.countByStatus("COMPLETED")
        );
    }

    @Transactional(readOnly = true)
    public List<SchoolView> schools(String status) {
        List<DrivingSchool> schools = (status == null || status.isBlank())
                ? schoolRepository.findAll()
                : schoolRepository.findByStatus(status);
        return schools.stream().map(s -> new SchoolView(
                s.getId(), s.getName(), s.getCity(), s.getStatus(),
                new OwnerView(s.getOwner().getName(), s.getOwner().getEmail(), s.getOwner().getPhone()),
                new Counts(
                        instructorRepository.countBySchoolId(s.getId()),
                        vehicleRepository.countBySchoolId(s.getId()),
                        bookingRepository.countBySchoolId(s.getId())
                )
        )).toList();
    }

    @Transactional
    public SchoolView setSchoolStatus(String schoolId, String status) {
        DrivingSchool school = schoolRepository.findById(schoolId)
                .orElseThrow(() -> ApiException.notFound("School not found"));
        school.setStatus(status);
        schoolRepository.save(school);
        notificationService.notify(school.getOwner(), "Your school \"" + school.getName() + "\" status was updated to " + status);
        return new SchoolView(
                school.getId(), school.getName(), school.getCity(), school.getStatus(),
                new OwnerView(school.getOwner().getName(), school.getOwner().getEmail(), school.getOwner().getPhone()),
                new Counts(
                        instructorRepository.countBySchoolId(school.getId()),
                        vehicleRepository.countBySchoolId(school.getId()),
                        bookingRepository.countBySchoolId(school.getId())
                )
        );
    }

    public List<UserView> users(Role role) {
        List<User> users = role == null ? userRepository.findAll() : userRepository.findByRole(role);
        return users.stream().map(u -> new UserView(u.getId(), u.getName(), u.getEmail(), u.getPhone(), u.getRole(), u.getStatus(), u.getCreatedAt())).toList();
    }

    @Transactional
    public UserView setUserStatus(String userId, String status) {
        User user = userRepository.findById(userId).orElseThrow(() -> ApiException.notFound("User not found"));
        user.setStatus(status);
        userRepository.save(user);
        return new UserView(user.getId(), user.getName(), user.getEmail(), user.getPhone(), user.getRole(), user.getStatus(), user.getCreatedAt());
    }

    @Transactional(readOnly = true)
    public List<ReportedReviewView> reportedReviews() {
        return reviewRepository.findByStatusOrderByCreatedAtDesc("REPORTED").stream()
                .map(r -> new ReportedReviewView(r.getId(), r.getRating(), r.getComment(),
                        new NameOnly(r.getSchool().getName()),
                        new OwnerView(r.getUser().getName(), r.getUser().getEmail(), null)))
                .toList();
    }

    @Transactional
    public void setReviewStatus(String reviewId, String status) {
        Review review = reviewRepository.findById(reviewId).orElseThrow(() -> ApiException.notFound("Review not found"));
        review.setStatus(status);
        reviewRepository.save(review);
    }
}
