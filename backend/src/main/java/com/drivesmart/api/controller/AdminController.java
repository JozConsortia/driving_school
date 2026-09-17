package com.drivesmart.api.controller;

import com.drivesmart.api.dto.AdminDtos.*;
import com.drivesmart.api.dto.AuditLogDto;
import com.drivesmart.api.entity.Role;
import com.drivesmart.api.security.CurrentUser;
import com.drivesmart.api.service.AdminService;
import com.drivesmart.api.service.ExcelExportService;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('SYSTEM_ADMIN')")
public class AdminController {

    private final AdminService adminService;
    private final ExcelExportService excelExportService;

    public AdminController(AdminService adminService, ExcelExportService excelExportService) {
        this.adminService = adminService;
        this.excelExportService = excelExportService;
    }

    @GetMapping("/stats")
    public Stats stats() {
        return adminService.stats();
    }

    @GetMapping("/schools")
    public List<SchoolView> schools(@RequestParam(required = false) String status) {
        return adminService.schools(status);
    }

    @PutMapping("/schools/{id}/status")
    public SchoolView setSchoolStatus(@PathVariable String id, @Valid @RequestBody SchoolStatusRequest req) {
        return adminService.setSchoolStatus(CurrentUser.require(), id, req.status());
    }

    @GetMapping("/users")
    public List<UserView> users(@RequestParam(required = false) Role role) {
        return adminService.users(role);
    }

    @PutMapping("/users/{id}/status")
    public UserView setUserStatus(@PathVariable String id, @Valid @RequestBody UserStatusRequest req) {
        return adminService.setUserStatus(CurrentUser.require(), id, req.status());
    }

    @GetMapping("/reviews/reported")
    public List<ReportedReviewView> reportedReviews() {
        return adminService.reportedReviews();
    }

    @PutMapping("/reviews/{id}/status")
    public ResponseEntity<Void> setReviewStatus(@PathVariable String id, @Valid @RequestBody ReviewStatusRequest req) {
        adminService.setReviewStatus(CurrentUser.require(), id, req.status());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/audit-log")
    public List<AuditLogDto> auditLog() {
        return adminService.auditLog();
    }

    @GetMapping("/export")
    public ResponseEntity<byte[]> export() {
        byte[] bytes = excelExportService.exportAdminReport();
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"drivesmart-report.xlsx\"")
                .body(bytes);
    }
}
