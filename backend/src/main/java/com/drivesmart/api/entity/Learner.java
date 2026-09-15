package com.drivesmart.api.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "learners")
@Getter
@Setter
@NoArgsConstructor
public class Learner {

    @Id
    private String id = UUID.randomUUID().toString();

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;
}
