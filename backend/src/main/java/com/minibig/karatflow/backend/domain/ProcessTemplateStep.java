package com.minibig.karatflow.backend.domain;
import jakarta.persistence.*;
import lombok.*;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "process_template_steps")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ProcessTemplateStep {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "step_id")
    private Long id;
    
    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "template_id")
    private ProcessTemplate template;
    
    @Column(name = "step_order")
    private Integer stepOrder;
    
    @Column(name = "stage_code")
    private String stageCode; // e.g. CAD, CASTING, POLISHING
    
    @Column(name = "stage_name")
    private String stageName; // Korean display name
    
    @Column(name = "is_optional")
    private Boolean isOptional;
    
    @Column(name = "is_subcontract")
    private Boolean isSubcontract;
}
