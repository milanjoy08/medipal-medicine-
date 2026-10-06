package com.medipal.repository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;

@Repository
public class MedicineRepository {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    public void initializeDatabase() {
        jdbcTemplate.execute("CREATE TABLE IF NOT EXISTS medicines (" +
                "id INTEGER PRIMARY KEY AUTOINCREMENT," +
                "name TEXT, dosage TEXT, type TEXT, frequency TEXT," +
                "stock INTEGER, minStock INTEGER, expiryDate TEXT" +
                ")");
    }

    public List<Map<String, Object>> getAllMedicines() {
        return jdbcTemplate.queryForList("SELECT * FROM medicines");
    }

    public int addMedicine(String name, String dosage, String type, String frequency, int stock, int minStock, String expiryDate) {
        String sql = "INSERT INTO medicines (name, dosage, type, frequency, stock, minStock, expiryDate) VALUES (?, ?, ?, ?, ?, ?, ?)";
        return jdbcTemplate.update(sql, name, dosage, type, frequency, stock, minStock, expiryDate);
    }
}
