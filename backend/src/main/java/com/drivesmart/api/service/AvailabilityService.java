package com.drivesmart.api.service;

import com.drivesmart.api.dto.AvailabilityDtos.CreateRequest;
import com.drivesmart.api.dto.AvailabilityDtos.SlotDto;
import com.drivesmart.api.entity.Availability;
import com.drivesmart.api.entity.Instructor;
import com.drivesmart.api.exception.ApiException;
import com.drivesmart.api.repository.AvailabilityRepository;
import com.drivesmart.api.repository.InstructorRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class AvailabilityService {

    private final AvailabilityRepository availabilityRepository;
    private final InstructorRepository instructorRepository;

    public AvailabilityService(AvailabilityRepository availabilityRepository, InstructorRepository instructorRepository) {
        this.availabilityRepository = availabilityRepository;
        this.instructorRepository = instructorRepository;
    }

    public List<SlotDto> openSlotsForInstructor(String instructorId) {
        return availabilityRepository
                .findByInstructorIdAndBookedFalseAndDateGreaterThanEqualOrderByDateAscStartTimeAsc(instructorId, LocalDate.now())
                .stream().map(this::toDto).toList();
    }

    public List<SlotDto> mine(String userId) {
        Instructor instructor = instructorRepository.findByUserId(userId)
                .orElseThrow(() -> ApiException.notFound("Instructor profile not found"));
        return availabilityRepository.findByInstructorIdOrderByDateAscStartTimeAsc(instructor.getId())
                .stream().map(this::toDto).toList();
    }

    @Transactional
    public SlotDto create(String userId, CreateRequest req) {
        Instructor instructor = instructorRepository.findByUserId(userId)
                .orElseThrow(() -> ApiException.notFound("Instructor profile not found"));
        Availability slot = new Availability();
        slot.setInstructor(instructor);
        slot.setDate(req.date());
        slot.setStartTime(req.startTime());
        slot.setEndTime(req.endTime());
        availabilityRepository.save(slot);
        return toDto(slot);
    }

    @Transactional
    public void delete(String userId, String slotId) {
        Instructor instructor = instructorRepository.findByUserId(userId)
                .orElseThrow(() -> ApiException.notFound("Instructor profile not found"));
        Availability slot = availabilityRepository.findById(slotId)
                .orElseThrow(() -> ApiException.notFound("Slot not found"));
        if (!slot.getInstructor().getId().equals(instructor.getId())) {
            throw ApiException.notFound("Slot not found");
        }
        if (slot.isBooked()) {
            throw ApiException.conflict("Cannot delete a booked slot");
        }
        availabilityRepository.delete(slot);
    }

    private SlotDto toDto(Availability a) {
        return new SlotDto(a.getId(), a.getInstructor().getId(), a.getDate(), a.getStartTime(), a.getEndTime(), a.isBooked());
    }
}
