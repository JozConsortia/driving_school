package com.drivesmart.api.service;

import com.drivesmart.api.dto.AdminDtos.ReportedReviewView;
import com.drivesmart.api.dto.AdminDtos.SchoolView;
import com.drivesmart.api.dto.AdminDtos.Stats;
import com.drivesmart.api.dto.AdminDtos.UserView;
import com.drivesmart.api.dto.AuditLogDto;
import com.drivesmart.api.dto.BookingDtos.BookingDto;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.util.List;

@Service
public class ExcelExportService {

    private final AdminService adminService;
    private final BookingService bookingService;

    public ExcelExportService(AdminService adminService, BookingService bookingService) {
        this.adminService = adminService;
        this.bookingService = bookingService;
    }

    public byte[] exportAdminReport() {
        try (XSSFWorkbook workbook = new XSSFWorkbook()) {
            CellStyle headerStyle = headerStyle(workbook);

            Stats stats = adminService.stats();
            Sheet overview = workbook.createSheet("Overview");
            writeRow(overview, 0, headerStyle, "Metric", "Value");
            String[][] statRows = {
                    {"Total users", String.valueOf(stats.totalUsers())},
                    {"Learners", String.valueOf(stats.totalLearners())},
                    {"Instructors", String.valueOf(stats.totalInstructors())},
                    {"Driving schools", String.valueOf(stats.totalSchools())},
                    {"Approved schools", String.valueOf(stats.approvedSchools())},
                    {"Pending schools", String.valueOf(stats.pendingSchools())},
                    {"Total bookings", String.valueOf(stats.totalBookings())},
                    {"Completed bookings", String.valueOf(stats.completedBookings())},
            };
            int r = 1;
            for (String[] row : statRows) writeRow(overview, r++, null, row);
            autoSize(overview, 2);

            Sheet schoolsSheet = workbook.createSheet("Schools");
            writeRow(schoolsSheet, 0, headerStyle, "Name", "City", "Status", "Owner", "Owner email", "Instructors", "Vehicles", "Bookings");
            List<SchoolView> schools = adminService.schools(null);
            r = 1;
            for (SchoolView s : schools) {
                writeRow(schoolsSheet, r++, null, s.name(), s.city(), s.status(), s.owner().name(), s.owner().email(),
                        String.valueOf(s.counts().instructors()), String.valueOf(s.counts().vehicles()), String.valueOf(s.counts().bookings()));
            }
            autoSize(schoolsSheet, 8);

            Sheet usersSheet = workbook.createSheet("Users");
            writeRow(usersSheet, 0, headerStyle, "Name", "Email", "Phone", "Role", "Status", "Joined");
            List<UserView> users = adminService.users(null);
            r = 1;
            for (UserView u : users) {
                writeRow(usersSheet, r++, null, u.name(), u.email(), nullToEmpty(u.phone()),
                        u.role().toString(), u.status(), u.createdAt().toString());
            }
            autoSize(usersSheet, 6);

            Sheet reviewsSheet = workbook.createSheet("Reported Reviews");
            writeRow(reviewsSheet, 0, headerStyle, "School", "Rating", "Comment", "Reviewer", "Reviewer email");
            List<ReportedReviewView> reported = adminService.reportedReviews();
            r = 1;
            for (ReportedReviewView rv : reported) {
                writeRow(reviewsSheet, r++, null, rv.school().name(), String.valueOf(rv.rating()),
                        nullToEmpty(rv.comment()), rv.user().name(), rv.user().email());
            }
            autoSize(reviewsSheet, 5);

            Sheet auditSheet = workbook.createSheet("Audit Log");
            writeRow(auditSheet, 0, headerStyle, "When", "Actor", "Actor email", "Action", "Details");
            List<AuditLogDto> auditLog = adminService.auditLog();
            r = 1;
            for (AuditLogDto entry : auditLog) {
                writeRow(auditSheet, r++, null, entry.createdAt().toString(), entry.actorName(),
                        nullToEmpty(entry.actorEmail()), entry.action(), nullToEmpty(entry.details()));
            }
            autoSize(auditSheet, 5);

            return toBytes(workbook);
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }

    public byte[] exportInstructorAppointments(String userId) {
        try (XSSFWorkbook workbook = new XSSFWorkbook()) {
            CellStyle headerStyle = headerStyle(workbook);
            Sheet sheet = workbook.createSheet("Appointments");
            writeRow(sheet, 0, headerStyle, "Date", "Start", "End", "Status", "Learner", "Learner phone",
                    "Licence category", "Vehicle", "Cancellation reason", "Lesson notes", "Progress", "Attendance");

            List<BookingDto> bookings = bookingService.mineForInstructor(userId);
            int r = 1;
            for (BookingDto b : bookings) {
                writeRow(sheet, r++, null,
                        b.date().toString(), b.startTime(), b.endTime(), b.status(),
                        b.learner() == null ? "" : b.learner().user().name(),
                        b.learner() != null ? nullToEmpty(b.learner().user().phone()) : "",
                        b.licenceCategory() == null ? "" : b.licenceCategory().code(),
                        b.vehicle() == null ? "" : (b.vehicle().make() + " " + b.vehicle().model()),
                        nullToEmpty(b.cancellationReason()),
                        b.lessonRecord() == null ? "" : nullToEmpty(b.lessonRecord().notes()),
                        b.lessonRecord() == null ? "" : nullToEmpty(b.lessonRecord().progress()),
                        b.lessonRecord() == null ? "" : nullToEmpty(b.lessonRecord().attendance())
                );
            }
            autoSize(sheet, 13);
            return toBytes(workbook);
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }

    private static String nullToEmpty(String s) {
        return s == null ? "" : s;
    }

    private static void writeRow(Sheet sheet, int rowIdx, CellStyle style, String... values) {
        Row row = sheet.createRow(rowIdx);
        for (int i = 0; i < values.length; i++) {
            Cell cell = row.createCell(i);
            cell.setCellValue(values[i]);
            if (style != null) cell.setCellStyle(style);
        }
    }

    private static CellStyle headerStyle(Workbook workbook) {
        Font font = workbook.createFont();
        font.setBold(true);
        CellStyle style = workbook.createCellStyle();
        style.setFont(font);
        return style;
    }

    private static void autoSize(Sheet sheet, int columns) {
        for (int i = 0; i < columns; i++) sheet.autoSizeColumn(i);
    }

    private static byte[] toBytes(XSSFWorkbook workbook) throws IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        workbook.write(out);
        return out.toByteArray();
    }
}
