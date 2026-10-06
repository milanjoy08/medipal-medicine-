package com.medipal.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import jakarta.annotation.PostConstruct;
import java.util.*;

@RestController
@RequestMapping("/api")
public class MedipalController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @PostConstruct
    public void init() {
        jdbcTemplate.execute("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, email TEXT UNIQUE, password TEXT)");
        jdbcTemplate.execute("CREATE TABLE IF NOT EXISTS history (id INTEGER PRIMARY KEY AUTOINCREMENT, userId INTEGER, medicineId INTEGER, scheduledTime TEXT, actionTime TEXT, status TEXT)");
        jdbcTemplate.execute("CREATE TABLE IF NOT EXISTS appointments (id INTEGER PRIMARY KEY AUTOINCREMENT, userId INTEGER, doctorName TEXT, hospital TEXT, appointmentDate TEXT, appointmentTime TEXT, reason TEXT)");
    }

    // --- AUTHENTICATION (Basic Demo Implementation) ---
    @PostMapping("/register")
    public Map<String, Object> register(@RequestBody Map<String, String> payload) {
        try {
            jdbcTemplate.update("INSERT INTO users (name, email, password) VALUES (?, ?, ?)", 
                payload.get("name"), payload.get("email"), payload.get("password"));
            return Map.of("message", "User registered successfully");
        } catch (Exception e) {
            return Map.of("error", "Email already exists or error");
        }
    }

    @PostMapping("/login")
    public Map<String, Object> login(@RequestBody Map<String, String> payload) {
        try {
            Map<String, Object> user = jdbcTemplate.queryForMap("SELECT * FROM users WHERE email = ? AND password = ?", 
                payload.get("email"), payload.get("password"));
            return Map.of(
                "token", "demo-token-123",
                "user", Map.of("id", user.get("id"), "name", user.get("name"), "email", user.get("email"))
            );
        } catch (Exception e) {
            return Map.of("error", "Invalid credentials");
        }
    }

    // --- DASHBOARD ---
    @GetMapping("/dashboard")
    public Map<String, Object> getDashboard() {
        // Return dummy stats so the frontend dashboard loads successfully
        return Map.of(
            "total", 5, "taken", 3, "missed", 1, "remaining", 1, "adherence", 75,
            "lowStock", List.of()
        );
    }

    // --- HISTORY ---
    @GetMapping("/history")
    public List<Map<String, Object>> getHistory() {
        return jdbcTemplate.queryForList("SELECT h.*, m.name, m.dosage FROM history h LEFT JOIN medicines m ON h.medicineId = m.id ORDER BY h.id DESC");
    }

    @PostMapping("/history")
    public Map<String, Object> addHistory(@RequestBody Map<String, Object> payload) {
        jdbcTemplate.update("INSERT INTO history (medicineId, scheduledTime, actionTime, status) VALUES (?, ?, ?, ?)",
            payload.get("medicineId"), payload.get("scheduledTime"), new Date().toString(), payload.get("status"));
        
        if ("taken".equals(payload.get("status"))) {
            jdbcTemplate.update("UPDATE medicines SET stock = stock - 1 WHERE id = ?", payload.get("medicineId"));
        }
        return Map.of("success", true);
    }

    // --- APPOINTMENTS ---
    @GetMapping("/appointments")
    public List<Map<String, Object>> getAppointments() {
        return jdbcTemplate.queryForList("SELECT * FROM appointments");
    }

    @PostMapping("/appointments")
    public Map<String, Object> addAppointment(@RequestBody Map<String, Object> payload) {
        jdbcTemplate.update("INSERT INTO appointments (doctorName, hospital, appointmentDate, appointmentTime, reason) VALUES (?, ?, ?, ?, ?)",
            payload.get("doctorName"), payload.get("hospital"), payload.get("appointmentDate"), payload.get("appointmentTime"), payload.get("reason"));
        return Map.of("success", true);
    }
}
