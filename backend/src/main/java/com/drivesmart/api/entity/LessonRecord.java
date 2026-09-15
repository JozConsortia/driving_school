package com.drivesmart.api.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "lesson_records")
@Getter
@Setter
@NoArgsConstructor
public class LessonRecord {

    @Id
    private String id = UUID.randomUUID().toString();

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id", nullable = false, unique = true)
    private Booking booking;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "instructor_id", nullable = false)
    private Instructor instructor;

    @Column(length = 2000)
    private String notes;

    @Column(length = 2000)
    private String progress;

    @Column(nullable = false)
    private String attendance = "PRESENT";

    @Column(nullable = false)
    private Instant completedAt = Instant.now();
}
