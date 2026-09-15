package com.drivesmart.api.controller;

import com.drivesmart.api.dto.LicenceCategoryDto;
import com.drivesmart.api.entity.LicenceCategory;
import com.drivesmart.api.exception.ApiException;
import com.drivesmart.api.repository.LicenceCategoryRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Comparator;
import java.util.List;

@RestController
@RequestMapping("/api/licence-categories")
public class LicenceCategoryController {

    private final LicenceCategoryRepository repository;

    public LicenceCategoryController(LicenceCategoryRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<LicenceCategoryDto> list() {
        return repository.findAll().stream()
                .sorted(Comparator.comparing(LicenceCategory::getCode))
                .map(c -> new LicenceCategoryDto(c.getId(), c.getCode(), c.getName()))
                .toList();
    }

    @PostMapping
    @PreAuthorize("hasRole('SYSTEM_ADMIN')")
    public ResponseEntity<LicenceCategoryDto> create(@Valid @RequestBody LicenceCategoryDto.CreateRequest req) {
        if (repository.findByCode(req.code()).isPresent()) {
            throw ApiException.conflict("Licence category already exists");
        }
        LicenceCategory category = new LicenceCategory();
        category.setCode(req.code());
        category.setName(req.name());
        repository.save(category);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new LicenceCategoryDto(category.getId(), category.getCode(), category.getName()));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SYSTEM_ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}