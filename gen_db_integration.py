import os
import re

base_path = "backend/src/main/java/com/minibig/karatflow/backend"

# 1. Create Design.java
design_code = '''package com.minibig.karatflow.backend.domain;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "designs")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Design {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "design_id")
    private Long id;
    
    @Column(name = "design_code")
    private String designCode;
    
    private String name;
    
    @Column(name = "base_labor_fee")
    private java.math.BigDecimal baseLaborFee;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
}
'''
with open(f"{base_path}/domain/Design.java", "w", encoding="utf-8") as f: f.write(design_code)

# 2. Create OrderItem.java
order_item_code = '''package com.minibig.karatflow.backend.domain;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "order_items")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class OrderItem {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "order_item_id")
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id")
    private Order order;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "design_id")
    private Design design;
    
    private Integer quantity;
    private String status;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
}
'''
with open(f"{base_path}/domain/OrderItem.java", "w", encoding="utf-8") as f: f.write(order_item_code)

# 3. Create Repositories
os.makedirs(f"{base_path}/repository", exist_ok=True)
order_repo_code = '''package com.minibig.karatflow.backend.repository;
import com.minibig.karatflow.backend.domain.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import java.util.Map;

public interface OrderRepository extends JpaRepository<Order, Long> {
    
    @Query(value = "SELECT o.order_id as id, d.design_code as design, o.order_date as date, " +
                   "w.current_stage as stage, w.is_hold as isHold " +
                   "FROM orders o " +
                   "JOIN order_items oi ON o.order_id = oi.order_id " +
                   "JOIN designs d ON oi.design_id = d.design_id " +
                   "JOIN work_orders w ON oi.order_item_id = w.order_item_id " +
                   "ORDER BY o.order_id DESC", nativeQuery = true)
    List<Map<String, Object>> findDashboardOrders();
}
'''
with open(f"{base_path}/repository/OrderRepository.java", "w", encoding="utf-8") as f: f.write(order_repo_code)

# 4. Create OrderResponseDTO
os.makedirs(f"{base_path}/dto", exist_ok=True)
dto_code = '''package com.minibig.karatflow.backend.dto;
import lombok.Builder;
import lombok.Data;
@Data
@Builder
public class OrderResponseDTO {
    private Long id;
    private String design;
    private String date;
    private String stage;
    private Boolean isHold;
}
'''
with open(f"{base_path}/dto/OrderResponseDTO.java", "w", encoding="utf-8") as f: f.write(dto_code)

# 5. Create OrderService (Updated to use native query mapping for simplicity)
service_code = '''package com.minibig.karatflow.backend.service;
import com.minibig.karatflow.backend.dto.OrderResponseDTO;
import com.minibig.karatflow.backend.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class OrderService {
    private final OrderRepository orderRepository;

    public List<OrderResponseDTO> getDashboardOrders() {
        List<Map<String, Object>> rows = orderRepository.findDashboardOrders();
        return rows.stream().map(row -> OrderResponseDTO.builder()
                .id(((Number) row.get("ID")).longValue())
                .design((String) row.get("DESIGN"))
                .date(row.get("DATE").toString())
                .stage((String) row.get("STAGE"))
                .isHold((Boolean) row.get("ISHOLD"))
                .build()
        ).collect(Collectors.toList());
    }
}
'''
with open(f"{base_path}/service/OrderService.java", "w", encoding="utf-8") as f: f.write(service_code)

# 6. Update OrderController
controller_path = f"{base_path}/web/OrderController.java"
controller_code = '''package com.minibig.karatflow.backend.web;
import com.minibig.karatflow.backend.dto.OrderResponseDTO;
import com.minibig.karatflow.backend.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {
    
    private final OrderService orderService;

    @GetMapping
    public ResponseEntity<List<OrderResponseDTO>> getActiveOrders() {
        return ResponseEntity.ok(orderService.getDashboardOrders());
    }

    @PostMapping("/{workOrderId}/hold")
    public ResponseEntity<Map<String, String>> putOrderOnHold(@PathVariable Long workOrderId) {
        Map<String, String> response = new HashMap<>();
        response.put("status", "success");
        response.put("message", "WorkOrder " + workOrderId + " placed on HOLD.");
        return ResponseEntity.ok(response);
    }
}
'''
with open(controller_path, "w", encoding="utf-8") as f: f.write(controller_code)

# 7. Add V3__seed_data.sql
seed_path = "backend/src/main/resources/db/migration/V3__seed_data.sql"
seed_code = '''
-- Insert Companies
INSERT INTO companies (name, role) VALUES ('KaratFlow Vendor', 'VENDOR');
INSERT INTO companies (name, role) VALUES ('Main Factory', 'MANUFACTURER');
INSERT INTO companies (name, role) VALUES ('Plating Subcontractor', 'SUBCONTRACTOR');

-- Insert Designs
INSERT INTO designs (company_id, design_code, name, base_labor_fee) VALUES (1, 'R-101', 'Classic Ring', 50000);
INSERT INTO designs (company_id, design_code, name, base_labor_fee) VALUES (1, 'N-202', 'Elegant Necklace', 75000);
INSERT INTO designs (company_id, design_code, name, base_labor_fee) VALUES (1, 'E-303', 'Simple Earrings', 40000);

-- Insert Orders (B2B and B2C mixed)
INSERT INTO orders (vendor_company_id, manufacturer_company_id, order_date, status, order_type, customer_name) VALUES 
(1, 2, '2026-08-17', 'IN_PROGRESS', 'B2B', NULL),
(1, 2, '2026-08-16', 'IN_PROGRESS', 'B2B', NULL),
(1, 2, '2026-08-15', 'IN_PROGRESS', 'B2C', 'Alice Park');

-- Insert Order Items
INSERT INTO order_items (order_id, design_id, quantity, status) VALUES 
(1, 1, 10, 'IN_PROGRESS'),
(2, 2, 5, 'IN_PROGRESS'),
(3, 3, 1, 'IN_PROGRESS');

-- Insert Work Orders
INSERT INTO work_orders (order_item_id, current_stage, is_hold) VALUES 
(1, 'CAD', FALSE),
(2, 'PLATING', TRUE),
(3, 'INSPECTION', FALSE);
'''
with open(seed_path, "w", encoding="utf-8") as f: f.write(seed_code)

print("Files generated successfully.")
