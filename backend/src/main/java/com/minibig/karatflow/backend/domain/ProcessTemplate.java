package com.minibig.karatflow.backend.domain;
import jakarta.persistence.*;
import lombok.*;
import java.util.List;

@Entity
@Table(name = "process_templates")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ProcessTemplate {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "template_id")
    private Long id;
    
    @Column(name = "template_code", unique = true)
    private String templateCode; // e.g. TEMPLATE_CASTING_STANDARD
    
    @Column(name = "template_name")
    private String templateName; // e.g. 주물 표준
    
    @Column(name = "description")
    private String description;
    
    @OneToMany(mappedBy = "template", cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    @OrderBy("stepOrder ASC")
    private List<ProcessTemplateStep> steps;
}
