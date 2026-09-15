package com.drivesmart.api.repository;

import com.drivesmart.api.entity.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface BookingRepository extends JpaRepository<Booking, String> {

    List<Booking> findByLearnerIdOrderByDateDesc(String learnerId);

    List<Booking> findByInstructorIdOrderByDateDesc(String instructorId);

    List<Booking> findBySchoolIdOrderByDateDesc(String schoolId);

    long countByStatus(String status);

    long countBySchoolId(String schoolId);

    long countByInstructorId(String instructorId);

    long countByVehicleId(String vehicleId);

    /**
     * Active (PENDING/CONFIRMED) bookings on a date that involve the given instructor, learner or vehicle,
     * excluding one booking (pass "" to exclude nothing). Used for the double-booking conflict check.
     */
    @Query("SELECT b FROM Booking b WHERE b.date = :date AND b.status IN ('PENDING','CONFIRMED') " +
            "AND b.id <> :excludeId AND (b.instructor.id = :instructorId OR b.learner.id = :learnerId " +
            "OR (:vehicleId IS NOT NULL AND b.vehicle.id = :vehicleId))")
    List<Booking> findConflicts(
            @Param("date") LocalDate date,
            @Param("instructorId") String instructorId,
            @Param("learnerId") String learnerId,
            @Param("vehicleId") String vehicleId,
            @Param("excludeId") String excludeId);

    boolean existsByLearnerIdAndSchoolIdAndStatus(String learnerId, String schoolId, String status);
}
