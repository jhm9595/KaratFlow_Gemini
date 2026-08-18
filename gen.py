import os

base_path = 'backend/src/main/java/com/minibig/karatflow/backend/domain'
os.makedirs(base_path, exist_ok=True)

entities = {
    'Company.java': '''package com.minibig.karatflow.backend.domain;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "companies")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Company {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "company_id")
    private Long id;
    private String name;
    private String role;
    @Column(name = "created_at")
    private LocalDateTime createdAt;
}
''',
    'User.java': '''package com.minibig.karatflow.backend.domain;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class User {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id")
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id")
    private Company company;
    private String username;
    @Column(name = "password_hash")
    private String passwordHash;
    private String role;
    @Column(name = "created_at")
    private LocalDateTime createdAt;
}
''',
    'Order.java': '''package com.minibig.karatflow.backend.domain;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "orders")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Order {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "order_id")
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vendor_company_id")
    private Company vendorCompany;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "manufacturer_company_id")
    private Company manufacturerCompany;
    @Column(name = "order_date")
    private LocalDate orderDate;
    private String status;
    @Column(name = "created_at")
    private LocalDateTime createdAt;
}
''',
    'WorkOrder.java': '''package com.minibig.karatflow.backend.domain;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "work_orders")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class WorkOrder {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "work_order_id")
    private Long id;
    @Column(name = "order_item_id")
    private Long orderItemId; // Simplified relation
    @Column(name = "current_stage")
    private String currentStage;
    @Column(name = "is_hold")
    private Boolean isHold;
    @Column(name = "created_at")
    private LocalDateTime createdAt;
}
'''
}

for name, content in entities.items():
    with open(os.path.join(base_path, name), 'w') as f:
        f.write(content)

print("Entities created.")
