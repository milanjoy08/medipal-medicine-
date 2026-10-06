package com.medipal.controller;

import com.medipal.repository.MedicineRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/medicines")
public class MedicineController {

    @Autowired
    private MedicineRepository medicineRepository;

    @PostConstruct
    public void init() {
        medicineRepository.initializeDatabase();
    }

    @GetMapping
    public List<Map<String, Object>> getMedicines() {
        return medicineRepository.getAllMedicines();
    }

    @PostMapping
    public Map<String, String> addMedicine(@RequestBody Map<String, Object> payload) {
        String name = (String) payload.get("name");
        String dosage = (String) payload.get("dosage");
        String type = (String) payload.get("type");
        String frequency = (String) payload.get("frequency");
        int stock = Integer.parseInt(payload.get("stock").toString());
        int minStock = Integer.parseInt(payload.get("minStock").toString());
        String expiryDate = (String) payload.get("expiryDate");
        
        medicineRepository.addMedicine(name, dosage, type, frequency, stock, minStock, expiryDate);
        return Map.of("status", "success", "message", "Medicine added via JDBC");
    }
}
