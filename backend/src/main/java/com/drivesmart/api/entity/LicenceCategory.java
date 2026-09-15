package com.drivesmart.api.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "licence_categories")
@Getter
@Setter
@NoArgsConstructor
public class LicenceCategory {

    @Id
    private String id = UUID.randomUUID().toString();

    @Column(nullable = false, unique = true)
    private String code;

    @Column(nullable = false)
    private String name;
}
