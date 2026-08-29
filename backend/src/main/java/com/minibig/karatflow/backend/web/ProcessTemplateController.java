package com.minibig.karatflow.backend.web;
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
