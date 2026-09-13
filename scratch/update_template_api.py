import codecs
import os

base_path = 'backend/src/main/java/com/minibig/karatflow/backend/'

template_service = """package com.minibig.karatflow.backend.service;

import com.minibig.karatflow.backend.domain.ProcessTemplate;
import com.minibig.karatflow.backend.domain.ProcessTemplateStep;
import com.minibig.karatflow.backend.repository.ProcessTemplateRepository;
import com.minibig.karatflow.backend.repository.ProcessTemplateStepRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ProcessTemplateService {

    private final ProcessTemplateRepository processTemplateRepository;
    private final ProcessTemplateStepRepository processTemplateStepRepository;

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
        existing.setName(updatedTemplate.getName());
        existing.setDescription(updatedTemplate.getDescription());
        existing.setEstimatedDays(updatedTemplate.getEstimatedDays());
        
        // Very basic approach: delete old steps, add new ones (in real life, handle carefully)
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
"""

template_controller = """package com.minibig.karatflow.backend.web;

import com.minibig.karatflow.backend.domain.ProcessTemplate;
import com.minibig.karatflow.backend.service.ProcessTemplateService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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

    @PostMapping
    public ResponseEntity<ProcessTemplate> create(@RequestBody ProcessTemplate template) {
        return ResponseEntity.ok(processTemplateService.createTemplate(template));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProcessTemplate> update(@PathVariable Long id, @RequestBody ProcessTemplate template) {
        return ResponseEntity.ok(processTemplateService.updateTemplate(id, template));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        processTemplateService.deleteTemplate(id);
        return ResponseEntity.ok().build();
    }
}
"""

with codecs.open(os.path.join(base_path, 'service/ProcessTemplateService.java'), 'w', 'utf-8') as f:
    f.write(template_service)

with codecs.open(os.path.join(base_path, 'web/ProcessTemplateController.java'), 'w', 'utf-8') as f:
    f.write(template_controller)

print("Template API written.")
