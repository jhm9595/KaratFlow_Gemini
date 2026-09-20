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

    private static final String[][] PASTEL_PRESET_GRADIENTS = {
        {"#38BDF8", "linear-gradient(135deg, #7dd3fc 0%, #38bdf8 100%)"}, // Pastel Sky Blue
        {"#C084FC", "linear-gradient(135deg, #e879f9 0%, #c084fc 100%)"}, // Pastel Lavender
        {"#FB923C", "linear-gradient(135deg, #fde047 0%, #fb923c 100%)"}, // Pastel Warm Peach
        {"#F472B6", "linear-gradient(135deg, #f472b6 0%, #fb7185 100%)"}, // Pastel Soft Rose
        {"#34D399", "linear-gradient(135deg, #6ee7b7 0%, #34d399 100%)"}, // Pastel Mint Green
        {"#FACC15", "linear-gradient(135deg, #fef08a 0%, #facc15 100%)"}, // Pastel Sun Yellow
        {"#818CF8", "linear-gradient(135deg, #a5b4fc 0%, #818cf8 100%)"}, // Pastel Periwinkle
        {"#2DD4BF", "linear-gradient(135deg, #99f6e4 0%, #2dd4bf 100%)"}  // Pastel Aqua
    };

    private void applyDefaultColorsIfNeeded(ProcessTemplateStep step, int idx) {
        if (step.getColorHex() == null || step.getColorHex().trim().isEmpty() || step.getColorHex().equals("#64748B")) {
            step.setColorHex(PASTEL_PRESET_GRADIENTS[idx % PASTEL_PRESET_GRADIENTS.length][0]);
        }
        if (step.getColorGradient() == null || step.getColorGradient().trim().isEmpty() || step.getColorGradient().contains("1e293b") || step.getColorGradient().contains("475569")) {
            if (step.getColorHex() != null && !step.getColorHex().startsWith("linear-gradient") && !step.getColorHex().equals("#64748B")) {
                step.setColorGradient("linear-gradient(135deg, " + step.getColorHex() + " 0%, #38bdf8 100%)");
            } else {
                step.setColorGradient(PASTEL_PRESET_GRADIENTS[idx % PASTEL_PRESET_GRADIENTS.length][1]);
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
                    ProcessTemplateStep.builder().stageName("접수").stepOrder(1).colorHex("#38BDF8").colorGradient("linear-gradient(135deg, #7dd3fc 0%, #38bdf8 100%)").template(t1).build(),
                    ProcessTemplateStep.builder().stageName("CAD").stepOrder(2).colorHex("#C084FC").colorGradient("linear-gradient(135deg, #e879f9 0%, #c084fc 100%)").template(t1).build(),
                    ProcessTemplateStep.builder().stageName("주물").stepOrder(3).colorHex("#FB923C").colorGradient("linear-gradient(135deg, #fde047 0%, #fb923c 100%)").template(t1).build(),
                    ProcessTemplateStep.builder().stageName("세공").stepOrder(4).colorHex("#F472B6").colorGradient("linear-gradient(135deg, #f472b6 0%, #fb7185 100%)").template(t1).build(),
                    ProcessTemplateStep.builder().stageName("완료").stepOrder(5).colorHex("#34D399").colorGradient("linear-gradient(135deg, #6ee7b7 0%, #34d399 100%)").template(t1).build()
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
                    ProcessTemplateStep.builder().stageName("접수").stepOrder(1).colorHex("#38BDF8").colorGradient("linear-gradient(135deg, #7dd3fc 0%, #38bdf8 100%)").template(t2).build(),
                    ProcessTemplateStep.builder().stageName("진행중").stepOrder(2).colorHex("#C084FC").colorGradient("linear-gradient(135deg, #e879f9 0%, #c084fc 100%)").template(t2).build(),
                    ProcessTemplateStep.builder().stageName("완료").stepOrder(3).colorHex("#34D399").colorGradient("linear-gradient(135deg, #6ee7b7 0%, #34d399 100%)").template(t2).build()
            );
            for (ProcessTemplateStep s : steps2) {
                processTemplateStepRepository.save(s);
            }
        } else {
            // Automatically upgrade existing steps to bright pastel gradients
            List<ProcessTemplate> all = processTemplateRepository.findAll();
            for (ProcessTemplate t : all) {
                if (t.getSteps() != null) {
                    for (int i = 0; i < t.getSteps().size(); i++) {
                        ProcessTemplateStep s = t.getSteps().get(i);
                        if (s.getColorGradient() == null || s.getColorGradient().contains("1e293b") || s.getColorGradient().contains("475569") || s.getColorHex().equals("#64748B")) {
                            s.setColorHex(PASTEL_PRESET_GRADIENTS[i % PASTEL_PRESET_GRADIENTS.length][0]);
                            s.setColorGradient(PASTEL_PRESET_GRADIENTS[i % PASTEL_PRESET_GRADIENTS.length][1]);
                            processTemplateStepRepository.save(s);
                        }
                    }
                }
            }
        }
    }

    public List<ProcessTemplate> getAllTemplates() {
        List<ProcessTemplate> list = processTemplateRepository.findAll();
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
