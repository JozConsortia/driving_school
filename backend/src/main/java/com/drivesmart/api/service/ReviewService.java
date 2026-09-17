package com.drivesmart.api.service;

import com.drivesmart.api.dto.CommonDtos.NameOnly;
import com.drivesmart.api.dto.ReviewDtos.CreateRequest;
import com.drivesmart.api.dto.ReviewDtos.ReviewView;
import com.drivesmart.api.dto.ReviewDtos.UpdateRequest;
import com.drivesmart.api.entity.DrivingSchool;
import com.drivesmart.api.entity.Learner;
import com.drivesmart.api.entity.Review;
import com.drivesmart.api.exception.ApiException;
import com.drivesmart.api.repository.BookingRepository;
import com.drivesmart.api.repository.DrivingSchoolRepository;
import com.drivesmart.api.repository.LearnerRepository;
import com.drivesmart.api.repository.ReviewRepository;
import com.drivesmart.api.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final LearnerRepository learnerRepository;
    private final DrivingSchoolRepository schoolRepository;
    private final UserRepository userRepository;
    private final BookingRepository bookingRepository;

    public ReviewService(
            ReviewRepository reviewRepository,
            LearnerRepository learnerRepository,
            DrivingSchoolRepository schoolRepository,
            UserRepository userRepository,
            BookingRepository bookingRepository) {
        this.reviewRepository = reviewRepository;
        this.learnerRepository = learnerRepository;
        this.schoolRepository = schoolRepository;
        this.userRepository = userRepository;
        this.bookingRepository = bookingRepository;
    }

    @Transactional(readOnly = true)
    public List<ReviewView> forSchool(String schoolId) {
        return reviewRepository.findBySchoolIdAndStatusOrderByCreatedAtDesc(schoolId, "VISIBLE").stream()
                .map(r -> new ReviewView(r.getId(), r.getRating(), r.getComment(), r.getCreatedAt(), new NameOnly(r.getUser().getName())))
                .toList();
    }

    @Transactional
    public ReviewView create(String userId, CreateRequest req) {
        Learner learner = learnerRepository.findByUserId(userId)
                .orElseThrow(() -> ApiException.notFound("Learner profile not found"));
        DrivingSchool school = schoolRepository.findById(req.schoolId())
                .orElseThrow(() -> ApiException.notFound("School not found"));

        if (school.getOwner().getId().equals(userId)) {
            throw ApiException.forbidden("You can't review your own school");
        }

        boolean hasCompleted = bookingRepository.existsByLearnerIdAndSchoolIdAndStatus(learner.getId(), school.getId(), "COMPLETED");
        if (!hasCompleted) {
            throw ApiException.forbidden("You can only review a school after completing a lesson there");
        }

        Review review = new Review();
        review.setLearner(learner);
        review.setUser(userRepository.findById(userId).orElseThrow());
        review.setSchool(school);
        review.setRating(req.rating());
        review.setComment(req.comment());
        reviewRepository.save(review);

        return new ReviewView(review.getId(), review.getRating(), review.getComment(), review.getCreatedAt(),
                new NameOnly(review.getUser().getName()));
    }

    @Transactional
    public void report(String userId, String reviewId) {
        Review review = reviewRepository.findById(reviewId).orElseThrow(() -> ApiException.notFound("Review not found"));
        if (review.getUser().getId().equals(userId)) {
            throw ApiException.forbidden("You can't report your own review");
        }
        if (review.getSchool().getOwner().getId().equals(userId)) {
            throw ApiException.forbidden("You can't report reviews on your own school");
        }
        review.setStatus("REPORTED");
        reviewRepository.save(review);
    }

    @Transactional
    public ReviewView update(String userId, String reviewId, UpdateRequest req) {
        Review review = ownedReview(userId, reviewId);
        review.setRating(req.rating());
        review.setComment(req.comment());
        reviewRepository.save(review);
        return new ReviewView(review.getId(), review.getRating(), review.getComment(), review.getCreatedAt(),
                new NameOnly(review.getUser().getName()));
    }

    @Transactional
    public void delete(String userId, String reviewId) {
        reviewRepository.delete(ownedReview(userId, reviewId));
    }

    private Review ownedReview(String userId, String reviewId) {
        Review review = reviewRepository.findById(reviewId).orElseThrow(() -> ApiException.notFound("Review not found"));
        if (!review.getUser().getId().equals(userId)) {
            throw ApiException.notFound("Review not found");
        }
        return review;
    }
}
