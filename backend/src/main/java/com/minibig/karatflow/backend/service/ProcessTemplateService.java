package com.minibig.karatflow.backend.service;

import com.minibig.karatflow.backend.domain.ProcessTemplate;
import com.minibig.karatflow.backend.domain.ProcessTemplateStep;
import com.minibig.karatflow.backend.repository.ProcessTemplateRepository;
import com.minibig.karatflow.backend.repository.ProcessTemplateStepRepository;
import com.minibig.karatflow.backend.security.SecurityUtils;
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
    private final SecurityUtils securityUtils;

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

    public List<ProcessTemplate> getAllTemplates() {
        Long currentUserId = securityUtils.getCurrentUserId();
        boolean isDemo = securityUtils.isDemoSession();

        List<ProcessTemplate> list = processTemplateRepository.findAll().stream()
                .filter(t -> t.getTemplateName() != null && !t.getTemplateName().trim().isEmpty())
                .filter(t -> {
                    boolean isSystemDefault = Boolean.TRUE.equals(t.getIsDefault()) || 
                                              "STANDARD_5".equals(t.getTemplateCode()) || 
                                              "SIMPLE_3".equals(t.getTemplateCode());
                    if (isSystemDefault) {
                        return true;
                    }
                    if (isDemo) {
                        return t.getUserId() == null || t.getUserId().equals(currentUserId);
                    } else {
                        return t.getUserId() != null && t.getUserId().equals(currentUserId);
                    }
                })
                .toList();

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
        if (template.getTemplateName() == null || template.getTemplateName().trim().isEmpty()) {
            throw new IllegalArgumentException("공정 템플릿 이름은 필수 입력 항목입니다.");
        }
        Long currentUserId = securityUtils.getCurrentUserId();
        template.setUserId(currentUserId);

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
        if (updatedTemplate.getTemplateName() == null || updatedTemplate.getTemplateName().trim().isEmpty()) {
            throw new IllegalArgumentException("공정 템플릿 이름은 필수 입력 항목입니다.");
        }
        Long currentUserId = securityUtils.getCurrentUserId();
        Optional<ProcessTemplate> existingOpt = processTemplateRepository.findById(id);
        if (existingOpt.isEmpty()) throw new RuntimeException("Template not found");
        
        ProcessTemplate existing = existingOpt.get();
        boolean isSystemDefault = Boolean.TRUE.equals(existing.getIsDefault()) || 
                                  "STANDARD_5".equals(existing.getTemplateCode()) || 
                                  "SIMPLE_3".equals(existing.getTemplateCode());
        if (!isSystemDefault && existing.getUserId() != null && !existing.getUserId().equals(currentUserId)) {
            throw new SecurityException("다른 사용자의 공정 템플릿은 수정할 수 없습니다.");
        }

        existing.setTemplateName(updatedTemplate.getTemplateName());
        existing.setDescription(updatedTemplate.getDescription());
        existing.setUserId(currentUserId);
        
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
        Long currentUserId = securityUtils.getCurrentUserId();
        Optional<ProcessTemplate> existingOpt = processTemplateRepository.findById(id);
        if (existingOpt.isPresent()) {
            ProcessTemplate t = existingOpt.get();
            boolean isSystemDefault = Boolean.TRUE.equals(t.getIsDefault()) || 
                                      "STANDARD_5".equals(t.getTemplateCode()) || 
                                      "SIMPLE_3".equals(t.getTemplateCode());
            if (isSystemDefault) {
                throw new SecurityException("시스템 기본 공정 템플릿은 삭제할 수 없습니다.");
            }
            if (t.getUserId() != null && !t.getUserId().equals(currentUserId)) {
                throw new SecurityException("다른 사용자의 공정 템플릿은 삭제할 수 없습니다.");
            }
            processTemplateRepository.deleteById(id);
        }
    }

    @Transactional
    public ProcessTemplate setDefaultTemplate(Long id) {
        Long currentUserId = securityUtils.getCurrentUserId();
        List<ProcessTemplate> all = getAllTemplates();

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
