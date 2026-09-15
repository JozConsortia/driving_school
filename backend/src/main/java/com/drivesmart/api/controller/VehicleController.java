package com.drivesmart.api.controller;

import com.drivesmart.api.dto.CommonDtos.VehicleDto;
import com.drivesmart.api.dto.VehicleDtos.CreateRequest;
import com.drivesmart.api.dto.VehicleDtos.StatusRequest;
import com.drivesmart.api.security.CurrentUser;
import com.drivesmart.api.service.VehicleService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vehicles")
@PreAuthorize("hasRole('SCHOOL_ADMIN')")
public class VehicleController {

    private final VehicleService vehicleService;

    public VehicleController(VehicleService vehicleService) {
        this.vehicleService = vehicleService;
    }

    @GetMapping("/mine")
    public List<VehicleDto> mine() {
        return vehicleService.listMine(CurrentUser.require());
    }

    @PostMapping
    public ResponseEntity<VehicleDto> create(@Valid @RequestBody CreateRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(vehicleService.create(CurrentUser.require(), req));
    }

    @PutMapping("/{id}/status")
    public VehicleDto updateStatus(@PathVariable String id, @Valid @RequestBody StatusRequest req) {
        return vehicleService.updateStatus(CurrentUser.require(), id, req.status());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        vehicleService.delete(CurrentUser.require(), id);
        return ResponseEntity.noContent().build();
    }
}