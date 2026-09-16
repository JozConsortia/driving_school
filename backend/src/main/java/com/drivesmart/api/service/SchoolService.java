package com.drivesmart.api.service;

import com.drivesmart.api.dto.CommonDtos.*;
import com.drivesmart.api.dto.LicenceCategoryDto;
import com.drivesmart.api.dto.SchoolDtos.*;
import com.drivesmart.api.entity.*;
import com.drivesmart.api.exception.ApiException;
import com.drivesmart.api.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.util.Comparator;
import java.util.List;

@Service
public class SchoolService {

    private final DrivingSchoolRepository schoolRepository;
    private final SchoolPricingRepository pricingRepository;
    private final InstructorRepository instructorRepository;
    private final VehicleRepository vehicleRepository;
    private final ReviewRepository reviewRepository;
    private final AvailabilityRepository availabilityRepository;
    private final LicenceCategoryRepository licenceCategoryRepository;

    public SchoolService(
            DrivingSchoolRepository schoolRepository,
            SchoolPricingRepository pricingRepository,
            InstructorRepository instructorRepository,
            VehicleRepository vehicleRepository,
            ReviewRepository reviewRepository,
            AvailabilityRepository availabilityRepository,
            LicenceCategoryRepository licenceCategoryRepository) {
        this.schoolRepository = schoolRepository;
        this.pricingRepository = pricingRepository;
        this.instructorRepository = instructorRepository;
        this.vehicleRepository = vehicleRepository;
        this.reviewRepository = reviewRepository;
        this.availabilityRepository = availabilityRepository;
        this.licenceCategoryRepository = licenceCategoryRepository;
    }

    @Transactional(readOnly = true)
    public List<SearchResult> search(String city, String licenceCategory, Double maxPrice, Double minRating, Integer day, String sort) {
        List<DrivingSchool> schools = (city == null || city.isBlank())
                ? schoolRepository.findByStatus("APPROVED")
                : schoolRepository.findByStatusAndCityContainingIgnoreCase("APPROVED", city);

        return schools.stream()
                .map(school -> {
                    List<SchoolPricing> pricing = pricingRepository.findBySchoolId(school.getId());
                    List<Instructor> instructors = instructorRepository.findBySchoolIdAndStatus(school.getId(), "ACTIVE");
                    List<Vehicle> vehicles = vehicleRepository.findBySchoolId(school.getId());
                    List<Review> reviews = reviewRepository.findBySchoolIdAndStatusOrderByCreatedAtDesc(school.getId(), "VISIBLE");
                    Double avgRating = reviews.isEmpty() ? null
                            : reviews.stream().mapToInt(Review::getRating).average().orElse(0);

                    return new Object() {
                        final DrivingSchool s = school;
                        final List<SchoolPricing> p = pricing;
                        final List<Instructor> i = instructors;
                        final List<Vehicle> v = vehicles;
                        final long reviewCount = reviews.size();
                        final Double rating = avgRating;
                    };
                })
                .filter(x -> {
                    if (licenceCategory != null && !licenceCategory.isBlank()) {
                        boolean has = x.p.stream().anyMatch(p -> p.getLicenceCategory().getCode().equals(licenceCategory));
                        if (!has) return false;
                    }
                    if (maxPrice != null) {
                        boolean affordable = x.p.stream().anyMatch(p -> p.getPricePerHour() <= maxPrice);
                        if (!affordable) return false;
                    }
                    if (minRating != null) {
                        if (x.rating == null || x.rating < minRating) return false;
                    }
                    if (day != null) {
                        boolean hasDay = x.i.stream().anyMatch(instr ->
                                availabilityRepository.findByInstructorIdOrderByDateAscStartTimeAsc(instr.getId()).stream()
                                        .anyMatch(a -> !a.isBooked() && jsDayOfWeek(a.getDate().getDayOfWeek()) == day));
                        if (!hasDay) return false;
                    }
                    return true;
                })
                .map(x -> new SearchResult(
                        x.s.getId(), x.s.getName(), x.s.getDescription(), x.s.getCity(), x.s.getAddress(),
                        x.s.getPhone(), x.s.getEmail(), x.rating, x.reviewCount,
                        x.p.stream().map(p -> new ServicePrice(p.getLicenceCategory().getCode(), p.getPricePerHour())).toList(),
                        x.v.stream().map(Vehicle::getTransmission).distinct().toList(),
                        x.i.size()
                ))
                .sorted(resultComparator(sort))
                .toList();
    }

    @Transactional(readOnly = true)
    public Profile getPublicProfile(String schoolId) {
        DrivingSchool school = schoolRepository.findById(schoolId)
                .filter(s -> "APPROVED".equals(s.getStatus()))
                .orElseThrow(() -> ApiException.notFound("School not found"));
        return toProfile(school, false);
    }

    @Transactional(readOnly = true)
    public Profile getMyProfile(String ownerId) {
        DrivingSchool school = schoolRepository.findByOwnerId(ownerId)
                .orElseThrow(() -> ApiException.notFound("No school found for this account"));
        return toProfile(school, true);
    }

    @Transactional
    public Profile updateMyProfile(String ownerId, UpdateRequest req) {
        DrivingSchool school = schoolRepository.findByOwnerId(ownerId)
                .orElseThrow(() -> ApiException.notFound("No school found for this account"));
        if (req.name() != null) school.setName(req.name());
        if (req.description() != null) school.setDescription(req.description());
        if (req.city() != null) school.setCity(req.city());
        if (req.address() != null) school.setAddress(req.address());
        if (req.phone() != null) school.setPhone(req.phone());
        if (req.email() != null) school.setEmail(req.email());
        schoolRepository.save(school);
        return toProfile(school, true);
    }

    @Transactional
    public PricingEntry addOrUpdateService(String ownerId, CreateServiceRequest req) {
        DrivingSchool school = schoolRepository.findByOwnerId(ownerId)
                .orElseThrow(() -> ApiException.notFound("No school found for this account"));
        LicenceCategory category = licenceCategoryRepository.findByCode(req.licenceCategoryCode())
                .orElseThrow(() -> ApiException.notFound("Unknown licence category"));

        SchoolPricing pricing = pricingRepository.findBySchoolIdAndLicenceCategoryId(school.getId(), category.getId())
                .orElseGet(SchoolPricing::new);
        pricing.setSchool(school);
        pricing.setLicenceCategory(category);
        pricing.setPricePerHour(req.pricePerHour());
        pricingRepository.save(pricing);

        return new PricingEntry(pricing.getId(), pricing.getPricePerHour(),
                new LicenceCategoryDto(category.getId(), category.getCode(), category.getName()));
    }

    @Transactional
    public void removeService(String ownerId, String serviceId) {
        DrivingSchool school = schoolRepository.findByOwnerId(ownerId)
                .orElseThrow(() -> ApiException.notFound("No school found for this account"));
        SchoolPricing pricing = pricingRepository.findById(serviceId)
                .orElseThrow(() -> ApiException.notFound("Service not found"));
        if (!pricing.getSchool().getId().equals(school.getId())) {
            throw ApiException.notFound("Service not found");
        }
        pricingRepository.delete(pricing);
    }

    public DrivingSchool requireOwnedSchool(String ownerId) {
        return schoolRepository.findByOwnerId(ownerId)
                .orElseThrow(() -> ApiException.notFound("No school found for this account"));
    }

    private Profile toProfile(DrivingSchool school, boolean includeAllInstructors) {
        List<SchoolPricing> pricing = pricingRepository.findBySchoolId(school.getId());
        List<Instructor> instructors = includeAllInstructors
                ? instructorRepository.findBySchoolId(school.getId())
                : instructorRepository.findBySchoolIdAndStatus(school.getId(), "ACTIVE");
        List<Vehicle> vehicles = vehicleRepository.findBySchoolId(school.getId());
        String reviewStatus = "VISIBLE";
        List<Review> reviews = reviewRepository.findBySchoolIdAndStatusOrderByCreatedAtDesc(school.getId(), reviewStatus);
        Double avgRating = reviews.isEmpty() ? null : reviews.stream().mapToInt(Review::getRating).average().orElse(0);

        return new Profile(
                school.getId(), school.getName(), school.getDescription(), school.getCity(), school.getAddress(),
                school.getPhone(), school.getEmail(), school.getStatus(), avgRating,
                pricing.stream().map(p -> new PricingEntry(p.getId(), p.getPricePerHour(),
                        new LicenceCategoryDto(p.getLicenceCategory().getId(), p.getLicenceCategory().getCode(), p.getLicenceCategory().getName())
                )).toList(),
                instructors.stream().map(i -> new InstructorDto(i.getId(), i.getBio(), i.getStatus(),
                        new UserBasic(i.getUser().getId(), i.getUser().getName(), i.getUser().getEmail(), i.getUser().getPhone())
                )).toList(),
                vehicles.stream().map(v -> new VehicleDto(v.getId(), v.getMake(), v.getModel(), v.getYear(), v.getLicencePlate(), v.getTransmission(), v.getStatus())).toList(),
                reviews.stream().map(r -> new ReviewView(r.getId(), r.getRating(), r.getComment(), r.getCreatedAt(),
                        r.getUser().getId(), new NameOnly(r.getUser().getName()))).toList()
        );
    }

    private static int jsDayOfWeek(DayOfWeek dow) {
        return dow.getValue() % 7; // ISO Monday=1..Sunday=7 -> JS Sunday=0..Saturday=6
    }

    private static Comparator<SearchResult> resultComparator(String sort) {
        if (sort == null) return (a, b) -> 0;
        return switch (sort) {
            case "rating" -> Comparator.comparing(
                    (SearchResult r) -> r.avgRating() == null ? -1.0 : r.avgRating(),
                    Comparator.reverseOrder());
            case "price_low" -> Comparator.comparingDouble(SchoolService::minPrice);
            case "price_high" -> Comparator.comparingDouble(SchoolService::minPrice).reversed();
            default -> (a, b) -> 0;
        };
    }

    private static double minPrice(SearchResult r) {
        return r.services().stream().mapToDouble(ServicePrice::pricePerHour).min().orElse(Double.MAX_VALUE);
    }
}
