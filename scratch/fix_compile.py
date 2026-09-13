import codecs

# Fix OrderDetailDTO
with codecs.open('backend/src/main/java/com/minibig/karatflow/backend/domain/OrderDetailDTO.java', 'r', 'utf-8') as f:
    dto_content = f.read()

dto_content = dto_content.replace('private List<WorkOrderDTO> workOrders;', 'private String surfaceFinish;\n    private List<WorkOrderDTO> workOrders;')
with codecs.open('backend/src/main/java/com/minibig/karatflow/backend/domain/OrderDetailDTO.java', 'w', 'utf-8') as f:
    f.write(dto_content)

# Fix OrderService
with codecs.open('backend/src/main/java/com/minibig/karatflow/backend/service/OrderService.java', 'r', 'utf-8') as f:
    content = f.read()

content = content.replace("getStepName()", "getStageCode()")
content = content.replace("step.getIcon() != null ? step.getIcon() : ", "")
content = content.replace("step.getColor() != null ? step.getColor() : ", "")

# Fix defaultTemplate variable visibility issue in createOrder (it might be outside lambda)
# Wait, defaultTemplate in createOrder:
content = content.replace(".template(defaultTemplate).", "")
content = content.replace("ProcessTemplate defaultTemplate = templateRepository.findAll().stream().findFirst().orElse(null);", "")
content = content.replace("workOrderRepository.saveAll(wos);", """
        ProcessTemplate defaultTemplate = templateRepository.findAll().stream().findFirst().orElse(null);
        wos.forEach(wo -> wo.setTemplate(defaultTemplate));
        workOrderRepository.saveAll(wos);
""")

# Fix stream min compiler error
content = content.replace(".min(Comparator.comparingInt(this::stageIndex))", ".min(Comparator.comparingInt(this::stageIndex)).map(WorkOrder::getCurrentStage)")
content = content.replace(".map(WorkOrder::getCurrentStage).orElse(newStage);", ".orElse(newStage);")
# Wait, the stream is of WorkOrder. 
# all.stream().min(Comparator.comparingInt(this::stageIndex)).map(WorkOrder::getCurrentStage).orElse(newStage);

with codecs.open('backend/src/main/java/com/minibig/karatflow/backend/service/OrderService.java', 'w', 'utf-8') as f:
    f.write(content)
print("Fix script completed")
