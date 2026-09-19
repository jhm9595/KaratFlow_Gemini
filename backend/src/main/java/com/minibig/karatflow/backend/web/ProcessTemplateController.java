package com.minibig.karatflow.backend.web;

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

    @PutMapping("/{id}/set-default")
    public ResponseEntity<ProcessTemplate> setDefault(@PathVariable Long id) {
        return ResponseEntity.ok(processTemplateService.setDefaultTemplate(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        processTemplateService.deleteTemplate(id);
        return ResponseEntity.ok().build();
    }
}
