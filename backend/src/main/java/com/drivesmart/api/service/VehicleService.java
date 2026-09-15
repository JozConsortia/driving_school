package com.drivesmart.api.service;

import com.drivesmart.api.dto.CommonDtos.VehicleDto;
import com.drivesmart.api.dto.VehicleDtos.CreateRequest;
import com.drivesmart.api.entity.DrivingSchool;
import com.drivesmart.api.entity.Vehicle;
import com.drivesmart.api.exception.ApiException;
import com.drivesmart.api.repository.VehicleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class VehicleService {

    private final VehicleRepository vehicleRepository;
    private final SchoolService schoolService;

    public VehicleService(VehicleRepository vehicleRepository, SchoolService schoolService) {
        this.vehicleRepository = vehicleRepository;
        this.schoolService = schoolService;
    }

    public List<VehicleDto> listMine(String ownerId) {
        DrivingSchool school = schoolService.requireOwnedSchool(ownerId);
        return vehicleRepository.findBySchoolId(school.getId()).stream().map(this::toDto).toList();
    }

    @Transactional
    public VehicleDto create(String ownerId, CreateRequest req) {
        DrivingSchool school = schoolService.requireOwnedSchool(ownerId);
        Vehicle vehicle = new Vehicle();
        vehicle.setSchool(school);
        vehicle.setMake(req.make());
        vehicle.setModel(req.model());
        vehicle.setYear(req.year());
        vehicle.setLicencePlate(req.licencePlate());
        vehicle.setTransmission(req.transmission() == null ? "MANUAL" : req.transmission());
        vehicleRepository.save(vehicle);
        return toDto(vehicle);
    }

    @Transactional
    public VehicleDto updateStatus(String ownerId, String vehicleId, String status) {
        Vehicle vehicle = ownedVehicle(ownerId, vehicleId);
        vehicle.setStatus(status);
        vehicleRepository.save(vehicle);
        return toDto(vehicle);
    }

    @Transactional
    public void delete(String ownerId, String vehicleId) {
        vehicleRepository.delete(ownedVehicle(ownerId, vehicleId));
    }

    private Vehicle ownedVehicle(String ownerId, String vehicleId) {
        DrivingSchool school = schoolService.requireOwnedSchool(ownerId);
        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> ApiException.notFound("Vehicle not found"));
        if (!vehicle.getSchool().getId().equals(school.getId())) {
            throw ApiException.notFound("Vehicle not found");
        }
        return vehicle;
    }

    private VehicleDto toDto(Vehicle v) {
        return new VehicleDto(v.getId(), v.getMake(), v.getModel(), v.getYear(), v.getLicencePlate(), v.getTransmission(), v.getStatus());
    }
}
