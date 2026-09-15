package com.drivesmart.api.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

/**
 * A driving school's price per hour for a given licence category.
 * (Named SchoolPricing, not SchoolService, to avoid clashing with the Spring @Service naming convention.)
 */
@Entity
@Table(name = "school_pricing", uniqueConstraints = @UniqueConstraint(columnNames = {"school_id", "licence_category_id"}))
@Getter
@Setter
@NoArgsConstructor
public class SchoolPricing {

    @Id
    private String id = UUID.randomUUID().toString();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "school_id", nullable = false)
    private DrivingSchool school;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "licence_category_id", nullable = false)
    private LicenceCategory licenceCategory;

    @Column(nullable = false)
    private Double pricePerHour;
}
