package com.drivesmart.api.controller;

import com.drivesmart.api.dto.SchoolDtos.*;
import com.drivesmart.api.security.CurrentUser;
import com.drivesmart.api.service.SchoolService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/schools")
public class SchoolController {

    private final SchoolService schoolService;

    public SchoolController(SchoolService schoolService) {
        this.schoolService = schoolService;
    }

    @GetMapping
    public List<SearchResult> search(
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String licenceCategory,
            @RequestParam(required = false) Double maxPrice,
            @RequestParam(required = false) Double minRating,
            @RequestParam(required = false) Integer day) {
        return schoolService.search(city, licenceCategory, maxPrice, minRating, day);
    }

    @GetMapping("/{id}")
    public Profile getById(@PathVariable String id) {
        return schoolService.getPublicProfile(id);
    }

    @GetMapping("/mine/profile")
    @PreAuthorize("hasRole('SCHOOL_ADMIN')")
    public Profile getMine() {
        return schoolService.getMyProfile(CurrentUser.require());
    }

    @PutMapping("/mine/profile")
    @PreAuthorize("hasRole('SCHOOL_ADMIN')")
    public Profile updateMine(@RequestBody UpdateRequest req) {
        return schoolService.updateMyProfile(CurrentUser.require(), req);
    }

    @PostMapping("/mine/services")
    @PreAuthorize("hasRole('SCHOOL_ADMIN')")
    public ResponseEntity<PricingEntry> addService(@Valid @RequestBody CreateServiceRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(schoolService.addOrUpdateService(CurrentUser.require(), req));
    }

    @DeleteMapping("/mine/services/{serviceId}")
    @PreAuthorize("hasRole('SCHOOL_ADMIN')")
    public ResponseEntity<Void> removeService(@PathVariable String serviceId) {
        schoolService.removeService(CurrentUser.require(), serviceId);
        return ResponseEntity.noContent().build();
    }
}
