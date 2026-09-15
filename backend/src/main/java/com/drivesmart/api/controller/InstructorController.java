package com.drivesmart.api.controller;

import com.drivesmart.api.dto.CommonDtos.InstructorDto;
import com.drivesmart.api.dto.InstructorDtos.CreateRequest;
import com.drivesmart.api.dto.InstructorDtos.StatusRequest;
import com.drivesmart.api.security.CurrentUser;
import com.drivesmart.api.service.InstructorService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/instructors")
public class InstructorController {

    private final InstructorService instructorService;

    public InstructorController(InstructorService instructorService) {
        this.instructorService = instructorService;
    }

    @GetMapping("/school/{schoolId}")
    public List<InstructorDto> bySchool(@PathVariable String schoolId) {
        return instructorService.listBySchool(schoolId);
    }

    @GetMapping("/mine")
    @PreAuthorize("hasRole('SCHOOL_ADMIN')")
    public List<InstructorDto> mine() {
        return instructorService.listMine(CurrentUser.require());
    }

    @PostMapping
    @PreAuthorize("hasRole('SCHOOL_ADMIN')")
    public ResponseEntity<InstructorDto> create(@Valid @RequestBody CreateRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(instructorService.create(CurrentUser.require(), req));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('SCHOOL_ADMIN')")
    public InstructorDto updateStatus(@PathVariable String id, @Valid @RequestBody StatusRequest req) {
        return instructorService.updateStatus(CurrentUser.require(), id, req.status());
    }
}