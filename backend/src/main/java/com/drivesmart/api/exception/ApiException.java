package com.drivesmart.api.exception;

import org.springframework.http.HttpStatus;

public class ApiException extends RuntimeException {

    private final HttpStatus status;
    private final Object details;

    public ApiException(HttpStatus status, String message) {
        super(message);
        this.status = status;
        this.details = null;
    }

    public ApiException(HttpStatus status, String message, Object details) {
        super(message);
        this.status = status;
        this.details = details;
    }

    public static ApiException notFound(String message) {
        return new ApiException(HttpStatus.NOT_FOUND, message);
    }

    public static ApiException badRequest(String message) {
        return new ApiException(HttpStatus.BAD_REQUEST, message);
    }

    public static ApiException conflict(String message) {
        return new ApiException(HttpStatus.CONFLICT, message);
    }

    public static ApiException conflict(String message, Object details) {
        return new ApiException(HttpStatus.CONFLICT, message, details);
    }

    public static ApiException forbidden(String message) {
        return new ApiException(HttpStatus.FORBIDDEN, message);
    }

    public HttpStatus getStatus() {
        return status;
    }

    public Object getDetails() {
        return details;
    }
}
