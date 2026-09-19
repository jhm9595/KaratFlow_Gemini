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

    private static final String[][] PRESET_GRADIENTS = {
        {"#64748B", "linear-gradient(135deg, #475569 0%, #1e293b 100%)"},
        {"#3B82F6", "linear-gradient(135deg, #2563eb 0%, #06b6d4 100%)"},
        {"#F59E0B", "linear-gradient(135deg, #d97706 0%, #ea580c 100%)"},
        {"#EC4899", "linear-gradient(135deg, #e11d48 0%, #d946ef 100%)"},
        {"#10B981", "linear-gradient(135deg, #059669 0%, #0d9488 100%)"},
        {"#7C3AED", "linear-gradient(135deg, #7c3aed 0%, #c084fc 100%)"},
        {"#0284C7", "linear-gradient(135deg, #0284c7 0%, #1d4ed8 100%)"},
        {"#DC2626", "linear-gradient(135deg, #dc2626 0%, #f97316 100%)"}
    };

    private void applyDefaultColorsIfNeeded(ProcessTemplateStep step, int idx) {
        if (step.getColorHex() == null || step.getColorHex().trim().isEmpty()) {
            step.setColorHex(PRESET_GRADIENTS[idx % PRESET_GRADIENTS.length][0]);
        }
        if (step.getColorGradient() == null || step.getColorGradient().trim().isEmpty()) {
            // Generate a gradient if colorHex was custom specified
            if (step.getColorHex() != null && !step.getColorHex().startsWith("linear-gradient")) {
                step.setColorGradient("linear-gradient(135deg, " + step.getColorHex() + " 0%, #1e293b 100%)");
            } else {
                step.setColorGradient(PRESET_GRADIENTS[idx % PRESET_GRADIENTS.length][1]);
            }
        }
    }

    @PostConstruct
    @Transactional
    public void seedDefaultTemplates() {
        if (processTemplateRepository.count() == 0) {
            ProcessTemplate t1 = ProcessTemplate.builder()
                    .templateCode("STANDARD_5")
                    .templateName("표준 5단계 공정")
                    .description("일반적인 쥬얼리 제작 공정 (접수-CAD-주물-세공-완료)")
                    .isDefault(true)
                    .build();
            t1 = processTemplateRepository.save(t1);

            List<ProcessTemplateStep> steps = List.of(
                    ProcessTemplateStep.builder().stageName("접수").stepOrder(1).colorHex("#64748B").colorGradient("linear-gradient(135deg, #475569 0%, #1e293b 100%)").template(t1).build(),
                    ProcessTemplateStep.builder().stageName("CAD").stepOrder(2).colorHex("#3B82F6").colorGradient("linear-gradient(135deg, #2563eb 0%, #06b6d4 100%)").template(t1).build(),
                    ProcessTemplateStep.builder().stageName("주물").stepOrder(3).colorHex("#F59E0B").colorGradient("linear-gradient(135deg, #d97706 0%, #ea580c 100%)").template(t1).build(),
                    ProcessTemplateStep.builder().stageName("세공").stepOrder(4).colorHex("#EC4899").colorGradient("linear-gradient(135deg, #e11d48 0%, #d946ef 100%)").template(t1).build(),
                    ProcessTemplateStep.builder().stageName("완료").stepOrder(5).colorHex("#10B981").colorGradient("linear-gradient(135deg, #059669 0%, #0d9488 100%)").template(t1).build()
            );
            for (ProcessTemplateStep s : steps) {
                processTemplateStepRepository.save(s);
            }

            ProcessTemplate t2 = ProcessTemplate.builder()
                    .templateCode("SIMPLE_3")
                    .templateName("자체 간편 공정")
                    .description("내부에서 빠르게 처리하는 3단계 공정 (접수-진행-완료)")
                    .build();
            t2 = processTemplateRepository.save(t2);

            List<ProcessTemplateStep> steps2 = List.of(
                    ProcessTemplateStep.builder().stageName("접수").stepOrder(1).colorHex("#64748B").colorGradient("linear-gradient(135deg, #475569 0%, #1e293b 100%)").template(t2).build(),
                    ProcessTemplateStep.builder().stageName("진행중").stepOrder(2).colorHex("#3B82F6").colorGradient("linear-gradient(135deg, #2563eb 0%, #06b6d4 100%)").template(t2).build(),
                    ProcessTemplateStep.builder().stageName("완료").stepOrder(3).colorHex("#10B981").colorGradient("linear-gradient(135deg, #059669 0%, #0d9488 100%)").template(t2).build()
            );
            for (ProcessTemplateStep s : steps2) {
                processTemplateStepRepository.save(s);
            }
        }
    }

    public List<ProcessTemplate> getAllTemplates() {
        List<ProcessTemplate> list = processTemplateRepository.findAll();
        // Ensure steps have colors initialized
        for (ProcessTemplate t : list) {
            if (t.getSteps() != null) {
                for (int i = 0; i < t.getSteps().size(); i++) {
                    applyDefaultColorsIfNeeded(t.getSteps().get(i), i);
                }
            }
        }
        return list;
    }

    @Transactional
    public ProcessTemplate createTemplate(ProcessTemplate template) {
        ProcessTemplate saved = processTemplateRepository.save(template);
        if (template.getSteps() != null) {
            for (int i = 0; i < template.getSteps().size(); i++) {
                ProcessTemplateStep step = template.getSteps().get(i);
                applyDefaultColorsIfNeeded(step, i);
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
        
        if (updatedTemplate.getSteps() != null) {
            for (int i = 0; i < updatedTemplate.getSteps().size(); i++) {
                ProcessTemplateStep step = updatedTemplate.getSteps().get(i);
                applyDefaultColorsIfNeeded(step, i);
                step.setId(null);
                step.setTemplate(existing);
                existing.getSteps().add(processTemplateStepRepository.save(step));
            }
        }
        
        return processTemplateRepository.save(existing);
    }

    @Transactional
    public void deleteTemplate(Long id) {
        processTemplateRepository.deleteById(id);
    }

    @Transactional
    public ProcessTemplate setDefaultTemplate(Long id) {
        List<ProcessTemplate> all = processTemplateRepository.findAll();
        ProcessTemplate target = null;
        for (ProcessTemplate t : all) {
            if (t.getId().equals(id)) {
                t.setIsDefault(true);
                target = t;
            } else {
                t.setIsDefault(false);
            }
            processTemplateRepository.save(t);
        }
        if (target == null) throw new RuntimeException("Template not found");
        return target;
    }
}
