package com.drivesmart.api.controller;

import com.drivesmart.api.dto.AvailabilityDtos.CreateRequest;
import com.drivesmart.api.dto.AvailabilityDtos.SlotDto;
import com.drivesmart.api.security.CurrentUser;
import com.drivesmart.api.service.AvailabilityService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/availability")
public class AvailabilityController {

    private final AvailabilityService availabilityService;

    public AvailabilityController(AvailabilityService availabilityService) {
        this.availabilityService = availabilityService;
    }

    @GetMapping("/instructor/{instructorId}")
    public List<SlotDto> openSlots(@PathVariable String instructorId) {
        return availabilityService.openSlotsForInstructor(instructorId);
    }

    @GetMapping("/mine")
    @PreAuthorize("hasRole('INSTRUCTOR')")
    public List<SlotDto> mine() {
        return availabilityService.mine(CurrentUser.require());
    }

    @PostMapping
    @PreAuthorize("hasRole('INSTRUCTOR')")
    public ResponseEntity<SlotDto> create(@Valid @RequestBody CreateRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(availabilityService.create(CurrentUser.require(), req));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('INSTRUCTOR')")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        availabilityService.delete(CurrentUser.require(), id);
        return ResponseEntity.noContent().build();
    }
}