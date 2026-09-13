import codecs
import os

os.makedirs('backend/src/main/java/com/minibig/karatflow/backend/domain', exist_ok=True)
os.makedirs('backend/src/main/java/com/minibig/karatflow/backend/repository', exist_ok=True)
os.makedirs('backend/src/main/java/com/minibig/karatflow/backend/service', exist_ok=True)
os.makedirs('backend/src/main/java/com/minibig/karatflow/backend/web', exist_ok=True)

pt_java = """package com.minibig.karatflow.backend.domain;
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
"""

pts_java = """package com.minibig.karatflow.backend.domain;
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
"""

ptr_java = """package com.minibig.karatflow.backend.repository;
import com.minibig.karatflow.backend.domain.ProcessTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
public interface ProcessTemplateRepository extends JpaRepository<ProcessTemplate, Long> {
    Optional<ProcessTemplate> findByTemplateCode(String templateCode);
}
"""

ptsrv_java = """package com.minibig.karatflow.backend.service;
import com.minibig.karatflow.backend.domain.ProcessTemplate;
import com.minibig.karatflow.backend.domain.ProcessTemplateStep;
import com.minibig.karatflow.backend.repository.ProcessTemplateRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProcessTemplateService {

    private final ProcessTemplateRepository processTemplateRepository;

    @PostConstruct
    @Transactional
    public void seedTemplates() {
        if (processTemplateRepository.count() == 0) {
            ProcessTemplate t1 = ProcessTemplate.builder()
                .templateCode("TEMPLATE_CASTING_STANDARD")
                .templateName("주물 표준")
                .description("일반적인 캐드/주물 공정")
                .build();
            t1.setSteps(Arrays.asList(
                ProcessTemplateStep.builder().template(t1).stepOrder(1).stageCode("PENDING").stageName("접수").isOptional(false).isSubcontract(false).build(),
                ProcessTemplateStep.builder().template(t1).stepOrder(2).stageCode("CAD").stageName("CAD/도면").isOptional(false).isSubcontract(false).build(),
                ProcessTemplateStep.builder().template(t1).stepOrder(3).stageCode("CASTING").stageName("주물").isOptional(false).isSubcontract(false).build(),
                ProcessTemplateStep.builder().template(t1).stepOrder(4).stageCode("POLISHING").stageName("세공").isOptional(false).isSubcontract(false).build(),
                ProcessTemplateStep.builder().template(t1).stepOrder(5).stageCode("PLATING").stageName("도금").isOptional(true).isSubcontract(false).build(),
                ProcessTemplateStep.builder().template(t1).stepOrder(6).stageCode("COMPLETED").stageName("완료").isOptional(false).isSubcontract(false).build()
            ));

            ProcessTemplate t2 = ProcessTemplate.builder()
                .templateCode("TEMPLATE_HANDMADE")
                .templateName("핸드메이드")
                .description("CAD/주물 생략 손세공")
                .build();
            t2.setSteps(Arrays.asList(
                ProcessTemplateStep.builder().template(t2).stepOrder(1).stageCode("PENDING").stageName("접수").isOptional(false).isSubcontract(false).build(),
                ProcessTemplateStep.builder().template(t2).stepOrder(2).stageCode("POLISHING").stageName("손세공").isOptional(false).isSubcontract(false).build(),
                ProcessTemplateStep.builder().template(t2).stepOrder(3).stageCode("PLATING").stageName("도금").isOptional(true).isSubcontract(false).build(),
                ProcessTemplateStep.builder().template(t2).stepOrder(4).stageCode("COMPLETED").stageName("완료").isOptional(false).isSubcontract(false).build()
            ));

            ProcessTemplate t3 = ProcessTemplate.builder()
                .templateCode("TEMPLATE_REPAIR_RESIZE")
                .templateName("수선/호수변경")
                .description("기존 제품 수선")
                .build();
            t3.setSteps(Arrays.asList(
                ProcessTemplateStep.builder().template(t3).stepOrder(1).stageCode("PENDING").stageName("접수/입고").isOptional(false).isSubcontract(false).build(),
                ProcessTemplateStep.builder().template(t3).stepOrder(2).stageCode("POLISHING").stageName("세공/호수변경").isOptional(false).isSubcontract(false).build(),
                ProcessTemplateStep.builder().template(t3).stepOrder(3).stageCode("COMPLETED").stageName("완료").isOptional(false).isSubcontract(false).build()
            ));

            processTemplateRepository.saveAll(Arrays.asList(t1, t2, t3));
        }
    }

    public List<ProcessTemplate> getAllTemplates() {
        return processTemplateRepository.findAll();
    }
}
"""

ptctrl_java = """package com.minibig.karatflow.backend.web;
import com.minibig.karatflow.backend.domain.ProcessTemplate;
import com.minibig.karatflow.backend.service.ProcessTemplateService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;

@RestController
@RequestMapping("/api/process-templates")
@RequiredArgsConstructor
public class ProcessTemplateController {
    
    private final ProcessTemplateService processTemplateService;

    @GetMapping
    public ResponseEntity<List<ProcessTemplate>> getAll() {
        return ResponseEntity.ok(processTemplateService.getAllTemplates());
    }
}
"""

def write_file(path, content):
    with codecs.open(path, 'w', 'utf-8') as f:
        f.write(content)

write_file('backend/src/main/java/com/minibig/karatflow/backend/domain/ProcessTemplate.java', pt_java)
write_file('backend/src/main/java/com/minibig/karatflow/backend/domain/ProcessTemplateStep.java', pts_java)
write_file('backend/src/main/java/com/minibig/karatflow/backend/repository/ProcessTemplateRepository.java', ptr_java)
write_file('backend/src/main/java/com/minibig/karatflow/backend/service/ProcessTemplateService.java', ptsrv_java)
write_file('backend/src/main/java/com/minibig/karatflow/backend/web/ProcessTemplateController.java', ptctrl_java)

print("Process Template files generated.")
