package com.drivesmart.api;

import com.drivesmart.api.entity.*;
import com.drivesmart.api.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Component
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final LearnerRepository learnerRepository;
    private final InstructorRepository instructorRepository;
    private final DrivingSchoolRepository schoolRepository;
    private final LicenceCategoryRepository licenceCategoryRepository;
    private final SchoolPricingRepository pricingRepository;
    private final VehicleRepository vehicleRepository;
    private final AvailabilityRepository availabilityRepository;
    private final BookingRepository bookingRepository;
    private final LessonRecordRepository lessonRecordRepository;
    private final ReviewRepository reviewRepository;
    private final PasswordEncoder passwordEncoder;

    private String password;
    private LicenceCategory code8;
    private LicenceCategory code10;
    private LicenceCategory code14;

    public DataSeeder(
            UserRepository userRepository,
            LearnerRepository learnerRepository,
            InstructorRepository instructorRepository,
            DrivingSchoolRepository schoolRepository,
            LicenceCategoryRepository licenceCategoryRepository,
            SchoolPricingRepository pricingRepository,
            VehicleRepository vehicleRepository,
            AvailabilityRepository availabilityRepository,
            BookingRepository bookingRepository,
            LessonRecordRepository lessonRecordRepository,
            ReviewRepository reviewRepository,
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.learnerRepository = learnerRepository;
        this.instructorRepository = instructorRepository;
        this.schoolRepository = schoolRepository;
        this.licenceCategoryRepository = licenceCategoryRepository;
        this.pricingRepository = pricingRepository;
        this.vehicleRepository = vehicleRepository;
        this.availabilityRepository = availabilityRepository;
        this.bookingRepository = bookingRepository;
        this.lessonRecordRepository = lessonRecordRepository;
        this.reviewRepository = reviewRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        password = passwordEncoder.encode("password123");

        if (userRepository.count() == 0) {
            seedCoreDemoAccounts();
        }

        if (!userRepository.existsByEmail("aisha@capewheels.co.za")) {
            seedMockMarketplaceData();
        }
    }

    /** The original minimal seed: one school, one instructor, one learner. Only runs on a totally empty database. */
    private void seedCoreDemoAccounts() {
        System.out.println("Seeding database...");

        category("Code 8", "Light motor vehicle");
        category("Code 10", "Heavy motor vehicle");
        category("Code 14", "Extra heavy motor vehicle");

        User admin = user("System Administrator", "admin@drivesmart.co.za", Role.SYSTEM_ADMIN);

        User schoolOwner = user("Thabo Mokoena", "owner@safedrive.co.za", Role.SCHOOL_ADMIN);
        DrivingSchool school = school(schoolOwner, "SafeDrive Driving School",
                "Professional, patient driving instruction for all licence categories.",
                "Pretoria", "123 Church Street, Pretoria", "012 345 6789", "owner@safedrive.co.za", "APPROVED");
        pricing(school, category("Code 8", "Light motor vehicle"), 280.0);
        pricing(school, category("Code 10", "Heavy motor vehicle"), 450.0);

        User instructorUser = user("Naledi Dube", "instructor@safedrive.co.za", Role.INSTRUCTOR);
        Instructor instructor = instructor(instructorUser, school, "8 years experience, patient with nervous learners.");

        vehicle(school, "Toyota", "Corolla Quest", 2022, "GP 123-456", "MANUAL");

        availabilityRun(instructor, 1, 14);

        User learnerUser = user("Lerato Sithole", "learner@example.com", Role.LEARNER);
        learner(learnerUser);

        System.out.println("Seed complete. Test accounts (password: password123):");
        System.out.println("  System Admin:  admin@drivesmart.co.za");
        System.out.println("  School Admin:  owner@safedrive.co.za");
        System.out.println("  Instructor:    instructor@safedrive.co.za");
        System.out.println("  Learner:       learner@example.com");
    }

    /**
     * Realistic mock marketplace data layered on top of whatever already exists (including real accounts),
     * so learners searching, school admins, instructors and the system admin all have something meaningful
     * to look at: several schools with varied ratings, reviews, bookings in different states, and one
     * school still pending approval. Guarded by the caller so it only ever runs once.
     */
    private void seedMockMarketplaceData() {
        System.out.println("Seeding mock marketplace data...");

        code8 = category("Code 8", "Light motor vehicle");
        code10 = category("Code 10", "Heavy motor vehicle");
        code14 = category("Code 14", "Extra heavy motor vehicle");

        List<Learner> learners = List.of(
                learner(user("Bongani Zulu", "bongani.learner@example.com", Role.LEARNER)),
                learner(user("Emma van der Merwe", "emma.learner@example.com", Role.LEARNER)),
                learner(user("Thandiwe Mahlangu", "thandiwe.learner@example.com", Role.LEARNER)),
                learner(user("Ryan Govender", "ryan.learner@example.com", Role.LEARNER))
        );

        // --- Cape Wheels Driving Academy (Cape Town) — top-rated, busy school ---
        DrivingSchool capeWheels = school(
                user("Aisha Adams", "aisha@capewheels.co.za", Role.SCHOOL_ADMIN),
                "Cape Wheels Driving Academy",
                "Friendly, five-star rated instructors covering the whole Cape Town metro. Free pickup and drop-off.",
                "Cape Town", "45 Long Street, Cape Town", "021 555 0134", "aisha@capewheels.co.za", "APPROVED");
        pricing(capeWheels, code8, 260.0);
        pricing(capeWheels, code10, 420.0);
        Vehicle capeWheelsPolo = vehicle(capeWheels, "Volkswagen", "Polo Vivo", 2023, "CA 771-234", "MANUAL");
        vehicle(capeWheels, "Toyota", "Etios", 2021, "CA 990-812", "AUTOMATIC");
        Instructor michael = instructor(user("Michael Petersen", "michael@capewheels.co.za", Role.INSTRUCTOR),
                capeWheels, "10 years experience. Specialises in nervous first-time drivers.");
        Instructor zanele = instructor(user("Zanele Booysen", "zanele@capewheels.co.za", Role.INSTRUCTOR),
                capeWheels, "Ex-metro police driving instructor. Great with defensive driving technique.");
        availabilityRun(michael, 1, 14);
        availabilityRun(zanele, 1, 14);

        completedLesson(learners.get(0), michael, capeWheels, capeWheelsPolo, code8, 12, 5,
                "Excellent instructor, very patient and explained everything clearly. Passed my test first try!");
        completedLesson(learners.get(1), michael, capeWheels, capeWheelsPolo, code8, 9, 5,
                "Michael is amazing, highly recommend Cape Wheels.");
        completedLesson(learners.get(2), zanele, capeWheels, capeWheelsPolo, code8, 6, 4,
                "Good lesson, car was clean and instructor was on time.");
        completedLesson(learners.get(3), zanele, capeWheels, capeWheelsPolo, code8, 3, 5,
                "Really helped build my confidence on the N1.");
        confirmedLesson(learners.get(0), michael, capeWheels, capeWheelsPolo, code8, 2);
        pendingLesson(learners.get(1), zanele, capeWheels, capeWheelsPolo, code8, 5);
        todayLesson(learners.get(2), michael, capeWheels, capeWheelsPolo, code8);

        // --- Joburg Road Masters (Johannesburg) — solid mid-tier school ---
        DrivingSchool roadMasters = school(
                user("Sipho Nkosi", "sipho@roadmasters.co.za", Role.SCHOOL_ADMIN),
                "Joburg Road Masters",
                "Affordable lessons across Johannesburg North with flexible weekend slots.",
                "Johannesburg", "88 Jan Smuts Avenue, Rosebank", "011 555 0198", "sipho@roadmasters.co.za", "APPROVED");
        pricing(roadMasters, code8, 300.0);
        Vehicle roadMastersFigo = vehicle(roadMasters, "Ford", "Figo", 2020, "GP 456-789", "MANUAL");
        Instructor karabo = instructor(user("Karabo Molefe", "karabo@roadmasters.co.za", Role.INSTRUCTOR),
                roadMasters, "Focuses on K53 test routes around Randburg and Sandton.");
        availabilityRun(karabo, 1, 14);

        completedLesson(learners.get(1), karabo, roadMasters, roadMastersFigo, code8, 15, 5,
                "Karabo really knows the test routes, felt well prepared.");
        completedLesson(learners.get(2), karabo, roadMasters, roadMastersFigo, code8, 8, 4,
                "Solid lessons, would book again.");
        completedLesson(learners.get(3), karabo, roadMasters, roadMastersFigo, code8, 4, 4,
                "Good value for money.");
        confirmedLesson(learners.get(0), karabo, roadMasters, roadMastersFigo, code8, 3);

        // --- Durban Drive Time (Durban) — mixed reviews, includes a reported one for admin moderation ---
        DrivingSchool driveTime = school(
                user("Priya Naidoo", "priya@drivetime.co.za", Role.SCHOOL_ADMIN),
                "Durban Drive Time",
                "Driving lessons for Code 8, 10 and 14 licences across greater Durban.",
                "Durban", "12 Umhlanga Rocks Drive, Umhlanga", "031 555 0176", "priya@drivetime.co.za", "APPROVED");
        pricing(driveTime, code8, 250.0);
        pricing(driveTime, code10, 400.0);
        pricing(driveTime, code14, 550.0);
        Vehicle driveTimeKwid = vehicle(driveTime, "Renault", "Kwid", 2019, "ND 234-567", "MANUAL");
        vehicle(driveTime, "Hyundai", "Grand i10", 2022, "ND 678-901", "AUTOMATIC");
        Instructor sanele = instructor(user("Sanele Mkhize", "sanele@drivetime.co.za", Role.INSTRUCTOR),
                driveTime, "Heavy vehicle (Code 10/14) specialist with 12 years on the road.");
        Instructor fatima = instructor(user("Fatima Khan", "fatima@drivetime.co.za", Role.INSTRUCTOR),
                driveTime, "Patient instructor, great for anxious learners.");
        availabilityRun(sanele, 1, 14);
        availabilityRun(fatima, 1, 14);

        completedLesson(learners.get(0), fatima, driveTime, driveTimeKwid, code8, 20, 3,
                "Lessons were okay but often started late.");
        completedLesson(learners.get(2), sanele, driveTime, driveTimeKwid, code10, 11, 2,
                "Instructor cancelled last minute twice with no notice. Frustrating experience.");
        completedLesson(learners.get(1), fatima, driveTime, driveTimeKwid, code8, 7, 4,
                "Fatima was lovely and very encouraging.");
        completedLesson(learners.get(3), sanele, driveTime, driveTimeKwid, code10, 2, 3,
                "Average experience, car could be cleaner.");
        // Mark the harshest review as reported so the system admin has something to moderate.
        List<Review> driveTimeReviews = reviewRepository.findBySchoolIdAndStatusOrderByCreatedAtDesc(driveTime.getId(), "VISIBLE");
        driveTimeReviews.stream()
                .filter(r -> r.getRating() == 2)
                .findFirst()
                .ifPresent(r -> {
                    r.setStatus("REPORTED");
                    reviewRepository.save(r);
                });
        pendingLesson(learners.get(0), sanele, driveTime, driveTimeKwid, code10, 4);

        // --- Bloem Learner Drivers (Bloemfontein) — brand new school, still awaiting admin approval ---
        DrivingSchool bloemLearners = school(
                user("Johan van Wyk", "johan@bloemlearners.co.za", Role.SCHOOL_ADMIN),
                "Bloem Learner Drivers",
                "Newly opened driving school serving Bloemfontein and surrounds.",
                "Bloemfontein", "5 President Brand Street, Bloemfontein", "051 555 0142", "johan@bloemlearners.co.za", "PENDING");
        pricing(bloemLearners, code8, 240.0);
        instructor(user("Karen Botha", "karen@bloemlearners.co.za", Role.INSTRUCTOR),
                bloemLearners, "Newly qualified instructor, enthusiastic and thorough.");

        System.out.println("Mock marketplace data seeded: 4 schools, several instructors/vehicles, "
                + learners.size() + " learners, bookings and reviews across ratings.");
        System.out.println("Extra demo accounts (password: password123):");
        System.out.println("  School Admin (4.7★ school):   aisha@capewheels.co.za");
        System.out.println("  School Admin (mixed reviews):  priya@drivetime.co.za");
        System.out.println("  School Admin (pending approval): johan@bloemlearners.co.za");
        System.out.println("  Instructor:                    michael@capewheels.co.za");
        System.out.println("  Learner:                       bongani.learner@example.com");
    }

    // --- helpers -----------------------------------------------------------------------------

    private User user(String name, String email, Role role) {
        User existing = userRepository.findByEmail(email).orElse(null);
        if (existing != null) return existing;
        User u = new User();
        u.setName(name);
        u.setEmail(email);
        u.setPassword(password);
        u.setRole(role);
        return userRepository.save(u);
    }

    private LicenceCategory category(String code, String name) {
        return licenceCategoryRepository.findByCode(code).orElseGet(() -> {
            LicenceCategory c = new LicenceCategory();
            c.setCode(code);
            c.setName(name);
            return licenceCategoryRepository.save(c);
        });
    }

    private DrivingSchool school(User owner, String name, String description, String city, String address,
                                  String phone, String email, String status) {
        DrivingSchool s = new DrivingSchool();
        s.setOwner(owner);
        s.setName(name);
        s.setDescription(description);
        s.setCity(city);
        s.setAddress(address);
        s.setPhone(phone);
        s.setEmail(email);
        s.setStatus(status);
        return schoolRepository.save(s);
    }

    private void pricing(DrivingSchool school, LicenceCategory category, double price) {
        SchoolPricing p = new SchoolPricing();
        p.setSchool(school);
        p.setLicenceCategory(category);
        p.setPricePerHour(price);
        pricingRepository.save(p);
    }

    private Instructor instructor(User instructorUser, DrivingSchool school, String bio) {
        Instructor i = new Instructor();
        i.setUser(instructorUser);
        i.setSchool(school);
        i.setBio(bio);
        return instructorRepository.save(i);
    }

    private Vehicle vehicle(DrivingSchool school, String make, String model, int year, String plate, String transmission) {
        Vehicle v = new Vehicle();
        v.setSchool(school);
        v.setMake(make);
        v.setModel(model);
        v.setYear(year);
        v.setLicencePlate(plate);
        v.setTransmission(transmission);
        return vehicleRepository.save(v);
    }

    private Learner learner(User learnerUser) {
        return learnerRepository.findByUserId(learnerUser.getId()).orElseGet(() -> {
            Learner l = new Learner();
            l.setUser(learnerUser);
            return learnerRepository.save(l);
        });
    }

    private void availabilityRun(Instructor instructor, int startDayOffset, int endDayOffset) {
        LocalDate today = LocalDate.now();
        List<Availability> slots = new ArrayList<>();
        for (int dayOffset = startDayOffset; dayOffset <= endDayOffset; dayOffset++) {
            LocalDate date = today.plusDays(dayOffset);
            for (String[] time : new String[][]{{"08:00", "09:00"}, {"10:00", "11:00"}, {"14:00", "15:00"}}) {
                Availability slot = new Availability();
                slot.setInstructor(instructor);
                slot.setDate(date);
                slot.setStartTime(time[0]);
                slot.setEndTime(time[1]);
                slots.add(slot);
            }
        }
        availabilityRepository.saveAll(slots);
    }

    /** A lesson that already happened `daysAgo`, marked COMPLETED with a lesson record and a review attached. */
    private void completedLesson(Learner learner, Instructor instructor, DrivingSchool school, Vehicle vehicle,
                                  LicenceCategory category, int daysAgo, int rating, String comment) {
        Booking booking = new Booking();
        booking.setLearner(learner);
        booking.setInstructor(instructor);
        booking.setSchool(school);
        booking.setVehicle(vehicle);
        booking.setLicenceCategory(category);
        booking.setDate(LocalDate.now().minusDays(daysAgo));
        booking.setStartTime("09:00");
        booking.setEndTime("10:00");
        booking.setStatus("COMPLETED");
        bookingRepository.save(booking);

        LessonRecord record = new LessonRecord();
        record.setBooking(booking);
        record.setInstructor(instructor);
        record.setProgress("Covered clutch control, parallel parking and general road awareness.");
        record.setAttendance("PRESENT");
        lessonRecordRepository.save(record);

        Review review = new Review();
        review.setLearner(learner);
        review.setUser(learner.getUser());
        review.setSchool(school);
        review.setRating(rating);
        review.setComment(comment);
        reviewRepository.save(review);
    }

    /** An upcoming, already-accepted lesson `daysAhead` from now. */
    private void confirmedLesson(Learner learner, Instructor instructor, DrivingSchool school, Vehicle vehicle,
                                  LicenceCategory category, int daysAhead) {
        upcomingBooking(learner, instructor, school, vehicle, category, daysAhead, "CONFIRMED");
    }

    /** An upcoming lesson still awaiting the school's acceptance. */
    private void pendingLesson(Learner learner, Instructor instructor, DrivingSchool school, Vehicle vehicle,
                                LicenceCategory category, int daysAhead) {
        upcomingBooking(learner, instructor, school, vehicle, category, daysAhead, "PENDING");
    }

    /** A confirmed lesson scheduled for today, so the school dashboard's "today's schedule" isn't empty. */
    private void todayLesson(Learner learner, Instructor instructor, DrivingSchool school, Vehicle vehicle, LicenceCategory category) {
        upcomingBooking(learner, instructor, school, vehicle, category, 0, "CONFIRMED");
    }

    private void upcomingBooking(Learner learner, Instructor instructor, DrivingSchool school, Vehicle vehicle,
                                  LicenceCategory category, int daysAhead, String status) {
        LocalDate date = LocalDate.now().plusDays(daysAhead);
        String startTime = "11:00";
        String endTime = "12:00";

        Booking booking = new Booking();
        booking.setLearner(learner);
        booking.setInstructor(instructor);
        booking.setSchool(school);
        booking.setVehicle(vehicle);
        booking.setLicenceCategory(category);
        booking.setDate(date);
        booking.setStartTime(startTime);
        booking.setEndTime(endTime);
        booking.setStatus(status);
        bookingRepository.save(booking);

        availabilityRepository.findByInstructorIdOrderByDateAscStartTimeAsc(instructor.getId()).stream()
                .filter(a -> a.getDate().equals(date) && a.getStartTime().equals(startTime))
                .findFirst()
                .ifPresent(slot -> {
                    slot.setBooked(true);
                    availabilityRepository.save(slot);
                });
    }
}
