package com.minibig.karatflow.backend.service;

import com.minibig.karatflow.backend.domain.ProcessTemplate;
import com.minibig.karatflow.backend.domain.ProcessTemplateStep;
import com.minibig.karatflow.backend.repository.ProcessTemplateRepository;
import com.minibig.karatflow.backend.repository.ProcessTemplateStepRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import jakarta.annotation.PostConstruct;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ProcessTemplateService {

    private final ProcessTemplateRepository processTemplateRepository;
    private final ProcessTemplateStepRepository processTemplateStepRepository;

    @PostConstruct
    @Transactional
    public void seedDefaultTemplates() {
        if (processTemplateRepository.count() == 0) {
            ProcessTemplate t1 = ProcessTemplate.builder()
                    .templateCode("STANDARD_5")
                    .templateName("표준 5단계 공정")
                    .description("일반적인 쥬얼리 제작 공정 (접수-CAD-주물-세공-완성)")
                    .build();
            t1 = createTemplate(t1);

            List<ProcessTemplateStep> steps = List.of(
                    ProcessTemplateStep.builder().stageName("접수").stepOrder(1).template(t1).build(),
                    ProcessTemplateStep.builder().stageName("CAD").stepOrder(2).template(t1).build(),
                    ProcessTemplateStep.builder().stageName("주물").stepOrder(3).template(t1).build(),
                    ProcessTemplateStep.builder().stageName("세공").stepOrder(4).template(t1).build(),
                    ProcessTemplateStep.builder().stageName("완성").stepOrder(5).template(t1).build()
            );
            for (ProcessTemplateStep s : steps) {
                processTemplateStepRepository.save(s);
            }

            ProcessTemplate t2 = ProcessTemplate.builder()
                    .templateCode("SIMPLE_3")
                    .templateName("자체 간편 공정")
                    .description("내부에서 빠르게 처리하는 3단계 공정 (접수-진행-완료)")
                    .build();
            t2 = createTemplate(t2);

            List<ProcessTemplateStep> steps2 = List.of(
                    ProcessTemplateStep.builder().stageName("접수").stepOrder(1).template(t2).build(),
                    ProcessTemplateStep.builder().stageName("진행중").stepOrder(2).template(t2).build(),
                    ProcessTemplateStep.builder().stageName("완료").stepOrder(3).template(t2).build()
            );
            for (ProcessTemplateStep s : steps2) {
                processTemplateStepRepository.save(s);
            }
        }
    }

    public List<ProcessTemplate> getAllTemplates() {
        return processTemplateRepository.findAll();
    }

    @Transactional
    public ProcessTemplate createTemplate(ProcessTemplate template) {
        ProcessTemplate saved = processTemplateRepository.save(template);
        if (template.getSteps() != null) {
            for (ProcessTemplateStep step : template.getSteps()) {
                step.setTemplate(saved);
                processTemplateStepRepository.save(step);
            }
        }
        return saved;
    }

    @Transactional
    public ProcessTemplate updateTemplate(Long id, ProcessTemplate updatedTemplate) {
        Optional<ProcessTemplate> existingOpt = processTemplateRepository.findById(id);
        if (existingOpt.isEmpty()) throw new RuntimeException("Template not found");
        
        ProcessTemplate existing = existingOpt.get();
        existing.setTemplateName(updatedTemplate.getTemplateName());
        existing.setDescription(updatedTemplate.getDescription());
        
        processTemplateStepRepository.deleteAll(existing.getSteps());
        existing.getSteps().clear();
        
        for (ProcessTemplateStep step : updatedTemplate.getSteps()) {
            step.setId(null);
            step.setTemplate(existing);
            existing.getSteps().add(processTemplateStepRepository.save(step));
        }
        
        return processTemplateRepository.save(existing);
    }

    @Transactional
    public void deleteTemplate(Long id) {
        processTemplateRepository.deleteById(id);
    }
}
