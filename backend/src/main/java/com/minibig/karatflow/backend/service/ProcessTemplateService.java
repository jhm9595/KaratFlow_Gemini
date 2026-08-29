package com.minibig.karatflow.backend.service;
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
