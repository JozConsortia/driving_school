package com.drivesmart.api.controller;

import com.drivesmart.api.dto.ReviewDtos.CreateRequest;
import com.drivesmart.api.dto.ReviewDtos.ReviewView;
import com.drivesmart.api.dto.ReviewDtos.UpdateRequest;
import com.drivesmart.api.security.CurrentUser;
import com.drivesmart.api.service.ReviewService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reviews")
public class ReviewController {

    private final ReviewService reviewService;

    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @GetMapping("/school/{schoolId}")
    public List<ReviewView> forSchool(@PathVariable String schoolId) {
        return reviewService.forSchool(schoolId);
    }

    @PostMapping
    @PreAuthorize("hasRole('LEARNER')")
    public ResponseEntity<ReviewView> create(@Valid @RequestBody CreateRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(reviewService.create(CurrentUser.require(), req));
    }

    @PutMapping("/{id}/report")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> report(@PathVariable String id) {
        reviewService.report(CurrentUser.require(), id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('LEARNER')")
    public ReviewView update(@PathVariable String id, @Valid @RequestBody UpdateRequest req) {
        return reviewService.update(CurrentUser.require(), id, req);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('LEARNER')")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        reviewService.delete(CurrentUser.require(), id);
        return ResponseEntity.noContent().build();
    }
}
