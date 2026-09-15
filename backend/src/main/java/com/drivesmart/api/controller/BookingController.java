package com.drivesmart.api.controller;

import com.drivesmart.api.dto.BookingDtos.*;
import com.drivesmart.api.security.CurrentUser;
import com.drivesmart.api.service.BookingService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    private final BookingService bookingService;

    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @PostMapping
    @PreAuthorize("hasRole('LEARNER')")
    public ResponseEntity<BookingDto> create(@Valid @RequestBody CreateRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(bookingService.create(CurrentUser.require(), req));
    }

    @GetMapping("/mine")
    @PreAuthorize("hasRole('LEARNER')")
    public List<BookingDto> mine() {
        return bookingService.mineForLearner(CurrentUser.require());
    }

    @GetMapping("/instructor/mine")
    @PreAuthorize("hasRole('INSTRUCTOR')")
    public List<BookingDto> instructorMine() {
        return bookingService.mineForInstructor(CurrentUser.require());
    }

    @GetMapping("/school/mine")
    @PreAuthorize("hasRole('SCHOOL_ADMIN')")
    public List<BookingDto> schoolMine() {
        return bookingService.mineForSchool(CurrentUser.require());
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('SCHOOL_ADMIN','INSTRUCTOR','LEARNER')")
    public BookingDto updateStatus(@PathVariable String id, @Valid @RequestBody StatusRequest req) {
        return bookingService.updateStatus(CurrentUser.require(), CurrentUser.role(), id, req.status());
    }

    @PutMapping("/{id}/reschedule")
    @PreAuthorize("hasAnyRole('LEARNER','SCHOOL_ADMIN')")
    public BookingDto reschedule(@PathVariable String id, @Valid @RequestBody RescheduleRequest req) {
        return bookingService.reschedule(CurrentUser.require(), CurrentUser.role(), id, req);
    }

    @PostMapping("/{id}/complete")
    @PreAuthorize("hasRole('INSTRUCTOR')")
    public ResponseEntity<LessonRecordCreated> complete(@PathVariable String id, @RequestBody CompleteRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(bookingService.complete(CurrentUser.require(), id, req));
    }
}