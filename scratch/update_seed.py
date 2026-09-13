import codecs
import re

file_path = 'backend/src/main/java/com/minibig/karatflow/backend/service/ProcessTemplateService.java'

with codecs.open(file_path, 'r', 'utf-8') as f:
    content = f.read()

seed_logic = """
    @jakarta.annotation.PostConstruct
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
                    ProcessTemplateStep.builder().name("접수").stepOrder(1).colorHex("#64748B").isStart(true).isEnd(false).template(t1).build(),
                    ProcessTemplateStep.builder().name("CAD").stepOrder(2).colorHex("#3B82F6").isStart(false).isEnd(false).template(t1).build(),
                    ProcessTemplateStep.builder().name("주물").stepOrder(3).colorHex("#F59E0B").isStart(false).isEnd(false).template(t1).build(),
                    ProcessTemplateStep.builder().name("세공").stepOrder(4).colorHex("#EAB308").isStart(false).isEnd(false).template(t1).build(),
                    ProcessTemplateStep.builder().name("완성").stepOrder(5).colorHex("#22C55E").isStart(false).isEnd(true).template(t1).build()
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
                    ProcessTemplateStep.builder().name("접수").stepOrder(1).colorHex("#64748B").isStart(true).isEnd(false).template(t2).build(),
                    ProcessTemplateStep.builder().name("진행중").stepOrder(2).colorHex("#8B5CF6").isStart(false).isEnd(false).template(t2).build(),
                    ProcessTemplateStep.builder().name("완료").stepOrder(3).colorHex("#22C55E").isStart(false).isEnd(true).template(t2).build()
            );
            for (ProcessTemplateStep s : steps2) {
                processTemplateStepRepository.save(s);
            }
        }
    }
"""

if "seedDefaultTemplates" not in content:
    content = content.replace("public List<ProcessTemplate> getAllTemplates() {", seed_logic + "\n    public List<ProcessTemplate> getAllTemplates() {")

with codecs.open(file_path, 'w', 'utf-8') as f:
    f.write(content)

print("Seed logic added to ProcessTemplateService.")
