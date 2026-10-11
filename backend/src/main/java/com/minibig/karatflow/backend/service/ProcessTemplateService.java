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

import java.util.Collections;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ProcessTemplateService {

    private final ProcessTemplateRepository processTemplateRepository;
    private final ProcessTemplateStepRepository processTemplateStepRepository;
    private final com.minibig.karatflow.backend.repository.WorkOrderRepository workOrderRepository;
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
        if (currentUserId == null) return Collections.emptyList();

        List<ProcessTemplate> list = processTemplateRepository.findAll().stream()
                .filter(t -> t.getTemplateName() != null && !t.getTemplateName().trim().isEmpty())
                .filter(t -> t.getUserId() != null && t.getUserId().equals(currentUserId))
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
        validateTemplateStructure(template);

        Long currentUserId = securityUtils.getCurrentUserId();
        template.setUserId(currentUserId);

        // Ensure unique templateCode (TPL_timestamp format)
        if (template.getTemplateCode() == null || template.getTemplateCode().trim().isEmpty()) {
            template.setTemplateCode("TPL_" + System.currentTimeMillis());
        }
        if (processTemplateRepository.existsByTemplateCode(template.getTemplateCode())) {
            template.setTemplateCode("TPL_" + System.currentTimeMillis() + "_" + java.util.UUID.randomUUID().toString().substring(0, 4).toUpperCase());
        }

        // If this is the user's very first template, make it the default template automatically
        long existingCount = getAllTemplates().size();
        if (existingCount == 0) {
            template.setIsDefault(true);
        }

        ProcessTemplate saved = processTemplateRepository.save(template);
        if (template.getSteps() != null) {
            for (int i = 0; i < template.getSteps().size(); i++) {
                ProcessTemplateStep step = template.getSteps().get(i);
                step.setStepOrder(i + 1); // 1-based sequential normalization
                applyDefaultColorsIfNeeded(step, i);
                step.setTemplate(saved);
                processTemplateStepRepository.save(step);
            }
        }
        return saved;
    }

    @Transactional
    public ProcessTemplate updateTemplate(Long id, ProcessTemplate updatedTemplate) {
        validateTemplateStructure(updatedTemplate);

        Long currentUserId = securityUtils.getCurrentUserId();
        Optional<ProcessTemplate> existingOpt = processTemplateRepository.findById(id);
        if (existingOpt.isEmpty()) throw new IllegalArgumentException("해당 공정 템플릿을 찾을 수 없습니다. (ID: " + id + ")");
        
        ProcessTemplate existing = existingOpt.get();
        if (existing.getUserId() != null && !existing.getUserId().equals(currentUserId)) {
            throw new SecurityException("다른 사용자의 공정 템플릿은 수정할 수 없습니다.");
        }

        existing.setTemplateName(updatedTemplate.getTemplateName());
        existing.setDescription(updatedTemplate.getDescription());
        
        processTemplateStepRepository.deleteAll(existing.getSteps());
        existing.getSteps().clear();
        
        if (updatedTemplate.getSteps() != null) {
            for (int i = 0; i < updatedTemplate.getSteps().size(); i++) {
                ProcessTemplateStep step = updatedTemplate.getSteps().get(i);
                step.setStepOrder(i + 1); // 1-based sequential normalization
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
        if (existingOpt.isEmpty()) return;

        ProcessTemplate t = existingOpt.get();
        if (t.getUserId() != null && !t.getUserId().equals(currentUserId)) {
            throw new SecurityException("다른 사용자의 공정 템플릿은 삭제할 수 없습니다.");
        }

        // Situation 1: Check active work orders linked to this template
        long activeCount = workOrderRepository.countActiveByTemplateId(id);
        if (activeCount > 0) {
            throw new IllegalStateException("현재 진행 중인 작업(" + activeCount + "건)이 이 공정 템플릿을 사용하고 있어 삭제할 수 없습니다. 관련 작업을 마감하거나 템플릿을 변경한 후 삭제해 주세요.");
        }

        long totalCount = workOrderRepository.countByTemplateId(id);
        if (totalCount > 0) {
            throw new IllegalStateException("이 공정 템플릿과 연결된 작업 이력(" + totalCount + "건)이 존재하여 삭제할 수 없습니다.");
        }

        processTemplateRepository.deleteById(id);
    }

    @Transactional
    public ProcessTemplate setDefaultTemplate(Long id) {
        Long currentUserId = securityUtils.getCurrentUserId();
        Optional<ProcessTemplate> targetOpt = processTemplateRepository.findById(id);
        if (targetOpt.isEmpty()) throw new IllegalArgumentException("해당 공정 템플릿을 찾을 수 없습니다.");

        ProcessTemplate target = targetOpt.get();
        if (target.getUserId() != null && !target.getUserId().equals(currentUserId)) {
            throw new SecurityException("다른 사용자의 공정 템플릿은 기본 공정으로 지정할 수 없습니다.");
        }
        if (target.getSteps() == null || target.getSteps().isEmpty()) {
            throw new IllegalArgumentException("공정 단계가 등록되지 않은 템플릿은 기본 공정으로 지정할 수 없습니다.");
        }

        // Situation 3: Exactly one default template per user (atomic switch)
        List<ProcessTemplate> all = getAllTemplates();
        for (ProcessTemplate t : all) {
            t.setIsDefault(t.getId().equals(id));
            processTemplateRepository.save(t);
        }
        return target;
    }

    private void validateTemplateStructure(ProcessTemplate template) {
        if (template.getTemplateName() == null || template.getTemplateName().trim().isEmpty()) {
            throw new IllegalArgumentException("공정 템플릿 이름은 필수 입력 항목입니다.");
        }
        if (template.getSteps() == null || template.getSteps().isEmpty()) {
            throw new IllegalArgumentException("공정 템플릿은 최소 1개 이상의 공정 단계를 포함해야 합니다.");
        }

        // Check for duplicate or empty stage names
        java.util.Set<String> seenNames = new java.util.HashSet<>();
        for (ProcessTemplateStep s : template.getSteps()) {
            String name = s.getStageName() != null ? s.getStageName().trim() : "";
            if (name.isEmpty()) {
                throw new IllegalArgumentException("공정 단계 이름은 비워둘 수 없습니다.");
            }
            if (!seenNames.add(name)) {
                throw new IllegalArgumentException("동일한 공정 단계 이름('" + name + "')이 중복으로 포함될 수 없습니다.");
            }
        }
    }
}
