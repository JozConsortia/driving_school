package com.drivesmart.api.security;

import com.drivesmart.api.entity.Role;
import org.springframework.security.core.context.SecurityContextHolder;

public final class CurrentUser {

    private CurrentUser() {}

    /** Returns the authenticated user's id (the JWT subject), or null if unauthenticated. */
    public static String id() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        return auth == null ? null : (String) auth.getPrincipal();
    }

    public static String require() {
        String id = id();
        if (id == null) throw new IllegalStateException("No authenticated user in context");
        return id;
    }

    public static Role role() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return null;
        return auth.getAuthorities().stream()
                .map(a -> a.getAuthority())
                .filter(a -> a.startsWith("ROLE_"))
                .map(a -> Role.valueOf(a.substring("ROLE_".length())))
                .findFirst()
                .orElse(null);
    }
}
