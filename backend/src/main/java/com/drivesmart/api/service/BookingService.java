package com.drivesmart.api.service;

import com.drivesmart.api.dto.AvailabilityDtos.SlotDto;
import com.drivesmart.api.dto.BookingDtos.*;
import com.drivesmart.api.dto.CommonDtos.UserBasic;
import com.drivesmart.api.dto.CommonDtos.VehicleDto;
import com.drivesmart.api.dto.LicenceCategoryDto;
import com.drivesmart.api.entity.*;
import com.drivesmart.api.exception.ApiException;
import com.drivesmart.api.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
public class BookingService {

    private static final List<String> ACTIVE_STATUSES = List.of("PENDING", "CONFIRMED");

    private final BookingRepository bookingRepository;
    private final LearnerRepository learnerRepository;
    private final InstructorRepository instructorRepository;
    private final DrivingSchoolRepository schoolRepository;
    private final VehicleRepository vehicleRepository;
    private final LicenceCategoryRepository licenceCategoryRepository;
    private final AvailabilityRepository availabilityRepository;
    private final LessonRecordRepository lessonRecordRepository;
    private final NotificationService notificationService;

    public BookingService(
            BookingRepository bookingRepository,
            LearnerRepository learnerRepository,
            InstructorRepository instructorRepository,
            DrivingSchoolRepository schoolRepository,
            VehicleRepository vehicleRepository,
            LicenceCategoryRepository licenceCategoryRepository,
            AvailabilityRepository availabilityRepository,
            LessonRecordRepository lessonRecordRepository,
            NotificationService notificationService) {
        this.bookingRepository = bookingRepository;
        this.learnerRepository = learnerRepository;
        this.instructorRepository = instructorRepository;
        this.schoolRepository = schoolRepository;
        this.vehicleRepository = vehicleRepository;
        this.licenceCategoryRepository = licenceCategoryRepository;
        this.availabilityRepository = availabilityRepository;
        this.lessonRecordRepository = lessonRecordRepository;
        this.notificationService = notificationService;
    }

    private static boolean overlaps(String startA, String endA, String startB, String endB) {
        return startA.compareTo(endB) < 0 && startB.compareTo(endA) < 0;
    }

    @Transactional
    public BookingDto create(String learnerUserId, CreateRequest req) {
        Learner learner = learnerRepository.findByUserId(learnerUserId)
                .orElseThrow(() -> ApiException.notFound("Learner profile not found"));
        LicenceCategory category = licenceCategoryRepository.findByCode(req.licenceCategoryCode())
                .orElseThrow(() -> ApiException.notFound("Unknown licence category"));
        Instructor instructor = instructorRepository.findById(req.instructorId())
                .orElseThrow(() -> ApiException.notFound("Instructor not found"));
        DrivingSchool school = schoolRepository.findById(req.schoolId())
                .orElseThrow(() -> ApiException.notFound("School not found"));
        Vehicle vehicle = req.vehicleId() == null ? null : vehicleRepository.findById(req.vehicleId())
                .orElseThrow(() -> ApiException.notFound("Vehicle not found"));

        List<Availability> matchingSlots = availabilityRepository
                .findByInstructorIdAndBookedFalseAndDateAndStartTimeLessThanEqualAndEndTimeGreaterThanEqual(
                        instructor.getId(), req.date(), req.startTime(), req.endTime());
        if (matchingSlots.isEmpty()) {
            List<SlotDto> alternatives = availabilityRepository
                    .findByInstructorIdAndBookedFalseAndDateGreaterThanEqualOrderByDateAscStartTimeAsc(instructor.getId(), LocalDate.now())
                    .stream().limit(5)
                    .map(a -> new SlotDto(a.getId(), a.getInstructor().getId(), a.getDate(), a.getStartTime(), a.getEndTime(), a.isBooked()))
                    .toList();
            throw ApiException.conflict("Instructor is not available at that time", java.util.Map.of("alternatives", alternatives));
        }
        Availability slot = matchingSlots.get(0);

        List<String> conflicts = detectConflicts(req.date(), req.startTime(), req.endTime(), instructor.getId(), learner.getId(),
                vehicle == null ? null : vehicle.getId(), "");
        if (!conflicts.isEmpty()) {
            throw ApiException.conflict("Booking conflict", java.util.Map.of("details", conflicts));
        }

        Booking booking = new Booking();
        booking.setLearner(learner);
        booking.setInstructor(instructor);
        booking.setSchool(school);
        booking.setVehicle(vehicle);
        booking.setLicenceCategory(category);
        booking.setDate(req.date());
        booking.setStartTime(req.startTime());
        booking.setEndTime(req.endTime());
        booking.setStatus("PENDING");
        bookingRepository.save(booking);

        slot.setBooked(true);
        availabilityRepository.save(slot);

        notificationService.notify(instructor.getUser(), "New lesson booking request for " + req.date() + " " + req.startTime());

        return toDto(booking);
    }

    private List<String> detectConflicts(LocalDate date, String startTime, String endTime, String instructorId,
                                          String learnerId, String vehicleId, String excludeId) {
        List<Booking> candidates = bookingRepository.findConflicts(date, instructorId, learnerId, vehicleId, excludeId);
        List<String> messages = new ArrayList<>();
        for (Booking b : candidates) {
            if (!overlaps(startTime, endTime, b.getStartTime(), b.getEndTime())) continue;
            if (b.getInstructor().getId().equals(instructorId)) messages.add("Instructor already has a booking at this time");
            if (b.getLearner().getId().equals(learnerId)) messages.add("You already have a booking at this time");
            if (vehicleId != null && vehicleId.equals(b.getVehicle() == null ? null : b.getVehicle().getId())) {
                messages.add("Vehicle already booked at this time");
            }
        }
        return messages;
    }

    @Transactional(readOnly = true)
    public List<BookingDto> mineForLearner(String userId) {
        Learner learner = learnerRepository.findByUserId(userId)
                .orElseThrow(() -> ApiException.notFound("Learner profile not found"));
        return bookingRepository.findByLearnerIdOrderByDateDesc(learner.getId()).stream().map(this::toDto).toList();
    }

    @Transactional(readOnly = true)
    public List<BookingDto> mineForInstructor(String userId) {
        Instructor instructor = instructorRepository.findByUserId(userId)
                .orElseThrow(() -> ApiException.notFound("Instructor profile not found"));
        return bookingRepository.findByInstructorIdOrderByDateDesc(instructor.getId()).stream().map(this::toDto).toList();
    }

    @Transactional(readOnly = true)
    public List<BookingDto> mineForSchool(String ownerId) {
        DrivingSchool school = schoolRepository.findByOwnerId(ownerId)
                .orElseThrow(() -> ApiException.notFound("No school found for this account"));
        return bookingRepository.findBySchoolIdOrderByDateDesc(school.getId()).stream().map(this::toDto).toList();
    }

    private Booking authorize(String userId, Role role, String bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> ApiException.notFound("Booking not found"));

        if (role == Role.SCHOOL_ADMIN) {
            DrivingSchool school = schoolRepository.findByOwnerId(userId).orElse(null);
            if (school == null || !booking.getSchool().getId().equals(school.getId())) throw ApiException.forbidden("Forbidden");
        } else if (role == Role.INSTRUCTOR) {
            Instructor instructor = instructorRepository.findByUserId(userId).orElse(null);
            if (instructor == null || !booking.getInstructor().getId().equals(instructor.getId())) throw ApiException.forbidden("Forbidden");
        } else if (role == Role.LEARNER) {
            Learner learner = learnerRepository.findByUserId(userId).orElse(null);
            if (learner == null || !booking.getLearner().getId().equals(learner.getId())) throw ApiException.forbidden("Forbidden");
        }
        return booking;
    }

    @Transactional
    public BookingDto updateStatus(String userId, Role role, String bookingId, String newStatus) {
        Booking booking = authorize(userId, role, bookingId);

        if (role == Role.LEARNER && !newStatus.equals("CANCELLED")) {
            throw ApiException.forbidden("Learners may only cancel bookings");
        }
        if (!ACTIVE_STATUSES.contains(booking.getStatus())) {
            throw ApiException.conflict("Booking already " + booking.getStatus().toLowerCase());
        }

        boolean freeingSlot = newStatus.equals("REJECTED") || newStatus.equals("CANCELLED");
        booking.setStatus(newStatus);
        bookingRepository.save(booking);

        if (freeingSlot) {
            availabilityRepository.findByInstructorIdAndDateAndStartTimeAndEndTime(
                    booking.getInstructor().getId(), booking.getDate(), booking.getStartTime(), booking.getEndTime()
            ).ifPresent(slot -> {
                slot.setBooked(false);
                availabilityRepository.save(slot);
            });
        }

        String message = "Your lesson on " + booking.getDate() + " at " + booking.getStartTime() + " was " + newStatus.toLowerCase();
        notificationService.notify(booking.getInstructor().getUser(), message);
        notificationService.notify(booking.getLearner().getUser(), message);

        return toDto(booking);
    }

    @Transactional
    public BookingDto reschedule(String userId, Role role, String bookingId, RescheduleRequest req) {
        Booking booking = authorize(userId, role, bookingId);

        if (!ACTIVE_STATUSES.contains(booking.getStatus())) {
            throw ApiException.conflict("Cannot reschedule a " + booking.getStatus().toLowerCase() + " booking");
        }

        List<Availability> matchingSlots = availabilityRepository
                .findByInstructorIdAndBookedFalseAndDateAndStartTimeLessThanEqualAndEndTimeGreaterThanEqual(
                        booking.getInstructor().getId(), req.date(), req.startTime(), req.endTime());
        if (matchingSlots.isEmpty()) {
            throw ApiException.conflict("Instructor is not available at that time");
        }
        Availability newSlot = matchingSlots.get(0);

        List<String> conflicts = detectConflicts(req.date(), req.startTime(), req.endTime(),
                booking.getInstructor().getId(), booking.getLearner().getId(),
                booking.getVehicle() == null ? null : booking.getVehicle().getId(), booking.getId());
        if (!conflicts.isEmpty()) {
            throw ApiException.conflict("Booking conflict", java.util.Map.of("details", conflicts));
        }

        availabilityRepository.findByInstructorIdAndDateAndStartTimeAndEndTime(
                booking.getInstructor().getId(), booking.getDate(), booking.getStartTime(), booking.getEndTime()
        ).ifPresent(oldSlot -> {
            oldSlot.setBooked(false);
            availabilityRepository.save(oldSlot);
        });

        newSlot.setBooked(true);
        availabilityRepository.save(newSlot);

        booking.setDate(req.date());
        booking.setStartTime(req.startTime());
        booking.setEndTime(req.endTime());
        booking.setStatus("PENDING");
        bookingRepository.save(booking);

        return toDto(booking);
    }

    @Transactional
    public LessonRecordCreated complete(String userId, String bookingId, CompleteRequest req) {
        Instructor instructor = instructorRepository.findByUserId(userId)
                .orElseThrow(() -> ApiException.notFound("Instructor profile not found"));
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> ApiException.notFound("Booking not found"));
        if (!booking.getInstructor().getId().equals(instructor.getId())) {
            throw ApiException.notFound("Booking not found");
        }
        if (!booking.getStatus().equals("CONFIRMED")) {
            throw ApiException.conflict("Only confirmed bookings can be completed");
        }

        booking.setStatus("COMPLETED");
        bookingRepository.save(booking);

        LessonRecord record = new LessonRecord();
        record.setBooking(booking);
        record.setInstructor(instructor);
        record.setNotes(req.notes());
        record.setProgress(req.progress());
        record.setAttendance(req.attendance() == null ? "PRESENT" : req.attendance());
        lessonRecordRepository.save(record);

        notificationService.notify(booking.getLearner().getUser(), "Your lesson on " + booking.getDate() + " was marked completed");

        return new LessonRecordCreated(record.getId(), booking.getId(), record.getNotes(), record.getProgress(), record.getAttendance());
    }

    private BookingDto toDto(Booking b) {
        VehicleDto vehicleDto = b.getVehicle() == null ? null : new VehicleDto(
                b.getVehicle().getId(), b.getVehicle().getMake(), b.getVehicle().getModel(),
                b.getVehicle().getYear(), b.getVehicle().getLicencePlate(), b.getVehicle().getTransmission(), b.getVehicle().getStatus());

        LessonRecordView lessonRecordView = lessonRecordRepository.findByBookingId(b.getId())
                .map(lr -> new LessonRecordView(lr.getNotes(), lr.getProgress(), lr.getAttendance()))
                .orElse(null);

        return new BookingDto(
                b.getId(), b.getDate(), b.getStartTime(), b.getEndTime(), b.getStatus(),
                new SchoolView(b.getSchool().getId(), b.getSchool().getName(), b.getSchool().getCity()),
                new InstructorView(b.getInstructor().getId(), new UserBasic(
                        b.getInstructor().getUser().getId(), b.getInstructor().getUser().getName(),
                        b.getInstructor().getUser().getEmail(), b.getInstructor().getUser().getPhone())),
                new LearnerView(new UserBasic(
                        b.getLearner().getUser().getId(), b.getLearner().getUser().getName(),
                        b.getLearner().getUser().getEmail(), b.getLearner().getUser().getPhone())),
                vehicleDto,
                new LicenceCategoryDto(b.getLicenceCategory().getId(), b.getLicenceCategory().getCode(), b.getLicenceCategory().getName()),
                lessonRecordView
        );
    }
}
