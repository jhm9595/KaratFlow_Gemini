package com.minibig.karatflow.backend.service;

import com.minibig.karatflow.backend.domain.*;
import com.minibig.karatflow.backend.dto.*;
import com.minibig.karatflow.backend.repository.*;
import com.minibig.karatflow.backend.security.SecurityUtils;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class OrderService {

    private final OrderRepository orderRepository;
    private final WorkOrderHistoryRepository historyRepository;
    private final ProcessTemplateRepository templateRepository;
    private final OrderItemRepository orderItemRepository;
    private final WorkOrderRepository workOrderRepository;
    private final DesignRepository designRepository;
    private final SecurityUtils securityUtils;

    // ─── Stats ───────────────────────────────────────────────────────────────

    public DashboardStatsDTO getDashboardStats() {
        List<OrderResponseDTO> orders = getDashboardOrders();
        long totalOrders = orders.size();
        long cancelledOrders = orders.stream().filter(o -> "CANCELLED".equals(o.getStatus())).count();
        long activeOrders = orders.stream().filter(o ->
                !"CANCELLED".equals(o.getStatus()) && !"COMPLETED".equals(o.getStatus())).count();
        double totalRevenue = orders.stream()
                .filter(o -> !"CANCELLED".equals(o.getStatus()))
                .mapToDouble(o -> o.getFinalConsumerPrice() != null ? o.getFinalConsumerPrice() : 0.0)
                .sum();
        double cancellationRate = totalOrders == 0 ? 0.0 : ((double) cancelledOrders / totalOrders) * 100.0;
        return DashboardStatsDTO.builder()
                .totalRevenue(totalRevenue)
                .activeOrders(activeOrders)
                .totalOrders(totalOrders)
                .cancellationRate(Math.round(cancellationRate * 10.0) / 10.0)
                .build();
    }

    // ─── Dashboard list ───────────────────────────────────────────────────────

    public List<OrderResponseDTO> getDashboardOrders() {
        Long currentUserId = securityUtils.getCurrentUserId();
        List<Map<String, Object>> rows = orderRepository.findDashboardOrders();

        List<ProcessTemplate> userTemplates = templateRepository.findAll().stream()
                .filter(t -> t.getUserId() != null && currentUserId != null && t.getUserId().equals(currentUserId))
                .toList();
        ProcessTemplate defaultTpl = userTemplates.stream()
                .filter(t -> Boolean.TRUE.equals(t.getIsDefault()))
                .findFirst()
                .orElse(userTemplates.isEmpty() ? null : userTemplates.get(0));
        Map<Long, ProcessTemplate> templateMap = templateRepository.findAll().stream()
                .collect(Collectors.toMap(ProcessTemplate::getId, t -> t, (a, b) -> a));

        // Group rows by order ID to ensure 1 entry per order (주문 기준)
        Map<Long, List<Map<String, Object>>> groupedByOrder = rows.stream()
                .filter(row -> {
                    Object uid = row.get("USERID");
                    return uid != null && currentUserId != null && ((Number) uid).longValue() == currentUserId;
                })
                .collect(Collectors.groupingBy(
                        row -> ((Number) row.get("ID")).longValue(),
                        LinkedHashMap::new,
                        Collectors.toList()
                ));

        return groupedByOrder.entrySet().stream()
                .map(entry -> {
                    Long orderId = entry.getKey();
                    List<Map<String, Object>> orderRows = entry.getValue();
                    Map<String, Object> firstRow = orderRows.get(0);

                    Long tplId = firstRow.get("TEMPLATEID") != null ? ((Number) firstRow.get("TEMPLATEID")).longValue() : null;
                    ProcessTemplate tpl = tplId != null ? templateMap.get(tplId) : defaultTpl;
                    if (tpl == null) tpl = defaultTpl;
                    List<ProcessTemplateStep> steps = (tpl != null && tpl.getSteps() != null) ? tpl.getSteps() : Collections.emptyList();

                    String rawStatus = (String) firstRow.get("STATUS");
                    String status = OrderStatus.normalize(rawStatus);
                    boolean isHold = orderRows.stream().anyMatch(r -> Boolean.TRUE.equals(r.get("ISHOLD")));

                    // Determine effective physical stage of the order across all its work orders
                    String lastStageName = !steps.isEmpty() ? steps.get(steps.size() - 1).getStageName() : "완료";
                    boolean allCompleted = !steps.isEmpty() && orderRows.stream().allMatch(r -> {
                        String s = (String) r.get("STAGE");
                        if (s == null) return false;
                        return s.trim().equalsIgnoreCase(lastStageName.trim()) || OrderStatus.isCompleted(s);
                    });

                    // If all work orders completed and not cancelled, ensure order status is COMPLETED
                    if (allCompleted && !status.equals(OrderStatus.CANCELLED.name())) {
                        status = OrderStatus.COMPLETED.name();
                    }

                    // Find the bottleneck stage (earliest uncompleted step in the template sequence)
                    int minStepIdx = Integer.MAX_VALUE;
                    String minStageName = null;
                    for (Map<String, Object> r : orderRows) {
                        String rStage = (String) r.get("STAGE");
                        int stepIdx = -1;
                        for (int i = 0; i < steps.size(); i++) {
                            ProcessTemplateStep step = steps.get(i);
                            if (step.getStageName() != null && step.getStageName().equalsIgnoreCase(rStage)) {
                                stepIdx = i;
                                break;
                            }
                        }
                        if (stepIdx >= 0 && stepIdx < minStepIdx) {
                            minStepIdx = stepIdx;
                            minStageName = steps.get(stepIdx).getStageName();
                        }
                    }

                    // Physical stage resolution:
                    // - When completed: reflects the last step of the template (e.g. "출고")
                    // - When processing or cancelled: reflects actual bottleneck physical stage
                    String stage;
                    if (status.equals(OrderStatus.COMPLETED.name())) {
                        stage = lastStageName;
                    } else if (minStageName != null) {
                        stage = minStageName;
                    } else if (!steps.isEmpty()) {
                        stage = steps.get(0).getStageName();
                    } else {
                        stage = (String) firstRow.get("STAGE");
                        if (stage == null || stage.isBlank()) stage = "접수";
                    }

                    // Total quantity: count of work orders or maximum of orderItem quantity
                    int itemQty = firstRow.get("QUANTITY") != null ? ((Number) firstRow.get("QUANTITY")).intValue() : 1;
                    int quantity = Math.max(orderRows.size(), itemQty);

                    return OrderResponseDTO.builder()
                            .id(orderId)
                            .workOrderId(firstRow.get("WORKORDERID") != null ? ((Number) firstRow.get("WORKORDERID")).longValue() : null)
                            .templateId(tpl != null ? tpl.getId() : tplId)
                            .templateName(tpl != null ? tpl.getTemplateName() : (String) firstRow.get("TEMPLATENAME"))
                            .templateSteps(steps)
                            .orderNo((String) firstRow.get("ORDERNO"))
                            .shortCode((String) firstRow.get("SHORTCODE"))
                            .design((String) firstRow.get("DESIGN"))
                            .brand((String) firstRow.get("BRAND"))
                            .imageUrl((String) firstRow.get("IMAGEURL"))
                            .quantity(quantity)
                            .unmappedProductName((String) firstRow.get("UNMAPPEDPRODUCTNAME"))
                            .date(firstRow.get("DATE") != null ? firstRow.get("DATE").toString() : null)
                            .stage(stage)
                            .isHold(isHold)
                            .engravingText((String) firstRow.get("ENGRAVINGTEXT"))
                            .engravingLocation((String) firstRow.get("ENGRAVINGLOCATION"))
                            .surfaceFinish((String) firstRow.get("SURFACEFINISH"))
                            .orderType((String) firstRow.get("ORDERTYPE"))
                            .customerName((String) firstRow.get("CUSTOMERNAME"))
                            .customerPhone((String) firstRow.get("CUSTOMERPHONE"))
                            .finalConsumerPrice(firstRow.get("FINALCONSUMERPRICE") != null
                                    ? ((Number) firstRow.get("FINALCONSUMERPRICE")).doubleValue() : null)
                            .status(status)
                            .cancellationFee(firstRow.get("CANCELLATIONFEE") != null
                                    ? ((Number) firstRow.get("CANCELLATIONFEE")).doubleValue() : null)
                            .createdAt(firstRow.get("CREATEDAT") != null ? firstRow.get("CREATEDAT").toString() : null)
                            .pendingCompletedAt(firstRow.get("PENDINGCOMPLETEDAT") != null ? firstRow.get("PENDINGCOMPLETEDAT").toString() : null)
                            .cadCompletedAt(firstRow.get("CADCOMPLETEDAT") != null ? firstRow.get("CADCOMPLETEDAT").toString() : null)
                            .castingCompletedAt(firstRow.get("CASTINGCOMPLETEDAT") != null ? firstRow.get("CASTINGCOMPLETEDAT").toString() : null)
                            .polishingCompletedAt(firstRow.get("POLISHINGCOMPLETEDAT") != null ? firstRow.get("POLISHINGCOMPLETEDAT").toString() : null)
                            .platingCompletedAt(firstRow.get("PLATINGCOMPLETEDAT") != null ? firstRow.get("PLATINGCOMPLETEDAT").toString() : null)
                            .completedAt(firstRow.get("COMPLETEDAT") != null ? firstRow.get("COMPLETEDAT").toString() : null)
                            .build();
                })
                .collect(Collectors.toList());
    }

    public OrderResponseDTO getOrderById(Long orderId) {
        return getDashboardOrders().stream()
                .filter(o -> orderId.equals(o.getId()))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Order not found: " + orderId));
    }

    // ─── Create ───────────────────────────────────────────────────────────────

    @Transactional
    public OrderResponseDTO createOrder(OrderCreateRequestDTO dto) {
        String dateStr = java.time.format.DateTimeFormatter.ofPattern("yyMMdd").format(LocalDateTime.now());
        String shortCode = java.util.UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        Long currentUserId = securityUtils.getCurrentUserId();

        Order order = Order.builder()
                .orderType(dto.getOrderType())
                .customerName(dto.getCustomerName())
                .customerPhone(dto.getCustomerPhone())
                .finalConsumerPrice(dto.getFinalConsumerPrice() != null
                        ? BigDecimal.valueOf(dto.getFinalConsumerPrice()) : null)
                .orderDate(LocalDateTime.now().toLocalDate())
                .status("PROCESSING")
                .userId(currentUserId)
                .shortCode(shortCode)
                .build();
        order = orderRepository.save(order);
        order.setOrderNo("ORD-" + dateStr + "-" + String.format("%03d", order.getId() % 1000));
        order = orderRepository.save(order);

        Design design = null;
        if (dto.getDesignId() != null && dto.getDesignId() > 0) {
            design = designRepository.findById(dto.getDesignId()).orElse(null);
        }

        OrderItem orderItem = OrderItem.builder()
                .order(order)
                .design(design)
                .unmappedProductName(dto.getUnmappedProductName())
                .unmappedBrandName(dto.getUnmappedBrandName())
                .imageUrl(dto.getImageUrl())
                .quantity(dto.getQuantity() != null ? dto.getQuantity() : 1)
                .engravingText(dto.getEngravingText())
                .engravingLocation(dto.getEngravingLocation())
                .surfaceFinish(dto.getSurfaceFinish())
                .build();
        orderItem = orderItemRepository.save(orderItem);

        ProcessTemplate selectedTemplate = null;
        if (dto.getProcessTemplateId() != null && dto.getProcessTemplateId() > 0) {
            selectedTemplate = templateRepository.findById(dto.getProcessTemplateId())
                    .filter(t -> currentUserId == null || currentUserId.equals(t.getUserId()))
                    .orElse(null);
        }
        if (selectedTemplate == null && currentUserId != null) {
            List<ProcessTemplate> userTemplates = templateRepository.findAll().stream()
                    .filter(t -> currentUserId.equals(t.getUserId()))
                    .toList();
            selectedTemplate = userTemplates.stream()
                    .filter(t -> Boolean.TRUE.equals(t.getIsDefault()))
                    .findFirst()
                    .orElse(userTemplates.isEmpty() ? null : userTemplates.get(0));
        }
        if (selectedTemplate == null) {
            throw new IllegalArgumentException("등록된 공정 템플릿이 없습니다. [공정 관리]에서 먼저 공정 템플릿을 생성해야 주문을 등록할 수 있습니다.");
        }
        if (selectedTemplate.getSteps() == null || selectedTemplate.getSteps().isEmpty()) {
            throw new IllegalArgumentException("선택된 공정 템플릿에 등록된 공정 단계가 없습니다.");
        }

        ProcessTemplateStep firstStep = selectedTemplate.getSteps().get(0);
        String initialStage = firstStep.getStageName() != null ? firstStep.getStageName() : firstStep.getStageCode();

        int qty = orderItem.getQuantity() != null ? orderItem.getQuantity() : 1;
        for (int i = 0; i < qty; i++) {
            WorkOrder wo = WorkOrder.builder()
                    .orderItem(orderItem)
                    .template(selectedTemplate)
                    .currentStage(initialStage)
                    .isHold(false)
                    .build();
            wo = workOrderRepository.save(wo);
            wo.setWorkOrderNo(WorkOrder.generateWorkOrderNo(order.getOrderNo(), i + 1));
            workOrderRepository.save(wo);
        }

        return OrderResponseDTO.builder()
                .id(order.getId())
                .templateId(selectedTemplate != null ? selectedTemplate.getId() : null)
                .templateName(selectedTemplate != null ? selectedTemplate.getTemplateName() : null)
                .templateSteps(selectedTemplate != null ? selectedTemplate.getSteps() : null)
                .orderNo(order.getOrderNo())
                .shortCode(order.getShortCode())
                .design(design != null ? design.getDesignCode() : null)
                .imageUrl(dto.getImageUrl())
                .quantity(orderItem.getQuantity())
                .unmappedProductName(dto.getUnmappedProductName())
                .date(order.getOrderDate().toString())
                .stage(initialStage).isHold(false)
                .createdAt(LocalDateTime.now().toString())
                .engravingText(orderItem.getEngravingText())
                .engravingLocation(orderItem.getEngravingLocation())
                .surfaceFinish(orderItem.getSurfaceFinish())
                .orderType(order.getOrderType())
                .customerName(order.getCustomerName())
                .customerPhone(order.getCustomerPhone())
                .finalConsumerPrice(dto.getFinalConsumerPrice())
                .status(order.getStatus())
                .cancellationFee(null)
                .build();
    }

    @Transactional
    public OrderResponseDTO changeOrderTemplate(Long orderId, Long newTemplateId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("주문을 찾을 수 없습니다: " + orderId));

        if ("COMPLETED".equalsIgnoreCase(order.getStatus()) || "CANCELLED".equalsIgnoreCase(order.getStatus())) {
            throw new IllegalStateException("이미 완료되었거나 취소된 주문은 공정 템플릿을 변경할 수 없습니다.");
        }

        ProcessTemplate newTemplate = templateRepository.findById(newTemplateId)
                .orElseThrow(() -> new IllegalArgumentException("선택한 공정 템플릿이 존재하지 않습니다: " + newTemplateId));

        if (newTemplate.getSteps() == null || newTemplate.getSteps().isEmpty()) {
            throw new IllegalArgumentException("선택한 공정 템플릿에 등록된 공정 단계가 없습니다.");
        }

        List<WorkOrder> wos = workOrderRepository.findAllByOrderId(orderId);
        for (WorkOrder wo : wos) {
            String currentStage = wo.getCurrentStage();
            boolean hasSameStage = newTemplate.getSteps().stream()
                    .anyMatch(s -> s.getStageName() != null && s.getStageName().equalsIgnoreCase(currentStage));

            String targetStage = hasSameStage ? currentStage : newTemplate.getSteps().get(0).getStageName();
            wo.setTemplate(newTemplate);
            wo.setCurrentStage(targetStage);
            workOrderRepository.save(wo);

            recordHistory(wo, "공정 템플릿 변경 -> " + newTemplate.getTemplateName() + " (" + targetStage + ")");
        }

        return getOrderById(orderId);
    }

    // ─── Detail ───────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public OrderDetailDTO getOrderDetails(Long orderId) {
        Order order = orderRepository.findById(orderId).orElseThrow();
        List<OrderItem> items = orderItemRepository.findByOrderId(orderId);
        OrderItem oi = items.isEmpty() ? null : items.get(0);
        Design d = oi != null ? oi.getDesign() : null;
        List<WorkOrder> wos = workOrderRepository.findAllByOrderId(orderId);

        WorkOrder firstWo = !wos.isEmpty() ? wos.get(0) : null;
        ProcessTemplate template = getEffectiveTemplate(firstWo);

        if (template == null || template.getSteps() == null || template.getSteps().isEmpty()) {
            throw new IllegalStateException("등록된 공정 템플릿이 없습니다. [공정 관리]에서 새로운 공정 템플릿을 추가해 주세요.");
        }

        List<OrderDetailDTO.TimelineEventDTO> timeline = new ArrayList<>();
        Map<String, String> historyMap = new HashMap<>();
        if (firstWo != null) {
            List<WorkOrderHistory> histories = historyRepository.findByWorkOrderIdOrderByStepOrderAsc(firstWo.getId());
            for (WorkOrderHistory h : histories) {
                if (h.getStepName() != null && h.getCompletedAt() != null) {
                    historyMap.put(h.getStepName(), h.getCompletedAt().toString());
                }
            }
        }

        List<ProcessTemplateStep> steps = template.getSteps();
        ProcessTemplateStep currStep = getCurrentStep(firstWo);
        int currentStepIdx = currStep != null ? steps.indexOf(currStep) : 0;

        for (int i = 0; i < steps.size(); i++) {
            ProcessTemplateStep step = steps.get(i);
            String name = step.getStageName() != null ? step.getStageName() : step.getStageCode();
            String date = historyMap.get(name) != null ? historyMap.get(name) : historyMap.get(step.getStageCode());
            
            boolean isCompleted = (date != null) || (currentStepIdx >= 0 && i <= currentStepIdx);
            if (date == null && isCompleted) {
                date = order.getCreatedAt() != null ? order.getCreatedAt().toString() : LocalDateTime.now().toString();
            }

            timeline.add(OrderDetailDTO.TimelineEventDTO.builder()
                .stage(name)
                .date(isCompleted ? date : null)
                .icon(isCompleted ? "pi pi-check" : "pi pi-circle")
                .color(isCompleted ? "#22C55E" : "#9E9E9E")
                .build());
        }

        List<OrderDetailDTO.WorkOrderDTO> woDTOs = new ArrayList<>();
        if (!wos.isEmpty()) {
            woDTOs = wos.stream().map(w ->
                    OrderDetailDTO.WorkOrderDTO.builder()
                            .id(w.getId())
                            .workOrderNo(w.getWorkOrderNo() != null ? w.getWorkOrderNo() : WorkOrder.generateWorkOrderNo(order.getOrderNo(), 1))
                            .templateId(w.getTemplate() != null ? w.getTemplate().getId() : (template != null ? template.getId() : null))
                            .templateName(w.getTemplate() != null ? w.getTemplate().getTemplateName() : (template != null ? template.getTemplateName() : null))
                            .stage(w.getCurrentStage())
                            .isHold(w.getIsHold())
                            .createdAt(w.getCreatedAt() != null ? w.getCreatedAt().toString() : null)
                            .build()
            ).collect(Collectors.toList());
        } else {
            String defaultStage = (steps != null && !steps.isEmpty())
                    ? (steps.get(0).getStageName() != null ? steps.get(0).getStageName() : steps.get(0).getStageCode())
                    : "대기";
            woDTOs.add(OrderDetailDTO.WorkOrderDTO.builder()
                    .id(order.getId())
                    .workOrderNo(WorkOrder.generateWorkOrderNo(order.getOrderNo(), 1))
                    .templateId(template != null ? template.getId() : null)
                    .templateName(template != null ? template.getTemplateName() : null)
                    .stage(currStep != null ? (currStep.getStageName() != null ? currStep.getStageName() : currStep.getStageCode()) : defaultStage)
                    .isHold(false)
                    .createdAt(order.getCreatedAt() != null ? order.getCreatedAt().toString() : null)
                    .build());
        }

        return OrderDetailDTO.builder()
                .orderId(order.getId())
                .orderNo(order.getOrderNo())
                .templateId(template != null ? template.getId() : null)
                .templateName(template != null ? template.getTemplateName() : null)
                .templateSteps(steps)
                .customerName(order.getCustomerName())
                .customerPhone(order.getCustomerPhone())
                .orderType(order.getOrderType())
                .orderDate(order.getOrderDate() != null ? order.getOrderDate().toString() : null)
                .createdAt(order.getCreatedAt() != null ? order.getCreatedAt().toString() : null)
                .brand(d != null ? d.getBrand() : (oi != null ? oi.getUnmappedBrandName() : null))
                .designCode(d != null ? d.getDesignCode() : null)
                .productName(d != null ? d.getName() : (oi != null ? oi.getUnmappedProductName() : null))
                .imageUrl(oi != null ? oi.getImageUrl() : null)
                .quantity(oi != null ? oi.getQuantity() : 1)
                .engravingText(oi != null ? oi.getEngravingText() : null)
                .engravingLocation(oi != null ? oi.getEngravingLocation() : null)
                .surfaceFinish(oi != null ? oi.getSurfaceFinish() : null)
                .workOrders(woDTOs)
                .timelineEvents(timeline)
                .build();
    }

    // ─── Stage Advancement ────────────────────────────────────────────────────

    @Transactional
    public Map<String, Object> advanceOrderStage(Long orderId) {
        Order order = orderRepository.findById(orderId).orElseThrow(() -> new IllegalArgumentException("Order not found: " + orderId));
        List<WorkOrder> wos = workOrderRepository.findAllByOrderId(orderId);
        
        if (wos.isEmpty()) {
            List<OrderItem> items = orderItemRepository.findByOrderId(orderId);
            OrderItem oi = items.isEmpty() ? null : items.get(0);
            ProcessTemplate defT = templateRepository.findAll().stream().filter(t -> Boolean.TRUE.equals(t.getIsDefault())).findFirst().orElse(null);
            String initialStage = (defT != null && defT.getSteps() != null && !defT.getSteps().isEmpty())
                    ? (defT.getSteps().get(0).getStageName() != null ? defT.getSteps().get(0).getStageName() : defT.getSteps().get(0).getStageCode())
                    : "대기";
            
            WorkOrder wo = WorkOrder.builder()
                    .orderItem(oi)
                    .template(defT)
                    .currentStage(initialStage)
                    .isHold(false)
                    .build();
            wo = workOrderRepository.save(wo);
            wo.setWorkOrderNo(WorkOrder.generateWorkOrderNo(order.getOrderNo(), 1));
            workOrderRepository.save(wo);
            wos = List.of(wo);
        }

        WorkOrder target = wos.stream()
                .filter(w -> !isWorkOrderCompleted(w))
                .findFirst().orElse(wos.get(0));

        ProcessTemplate effT = getEffectiveTemplate(target);
        if (target.getTemplate() == null) {
            target.setTemplate(effT);
        }

        String prevStage = target.getCurrentStage() != null ? target.getCurrentStage() : "접수";
        String newStage = nextStage(target);
        target.setCurrentStage(newStage);
        recordHistory(target, newStage);
        workOrderRepository.save(target);

        // Check if all work orders in the order are now completed
        boolean allFinished = !wos.isEmpty() && wos.stream().allMatch(w -> {
            if (w.getId().equals(target.getId())) {
                return isWorkOrderCompleted(target, newStage);
            }
            return isWorkOrderCompleted(w);
        });
        if (allFinished) {
            order.setStatus(OrderStatus.COMPLETED.name());
            orderRepository.save(order);
        }

        List<WorkOrder> sortedWos = new ArrayList<>(wos);
        sortedWos.sort(Comparator.comparing(WorkOrder::getId));
        int targetIdx = sortedWos.indexOf(target);
        String seq = String.format("%02d", targetIdx >= 0 ? targetIdx + 1 : 1);
        String itemLabel = "#" + orderId + "-" + seq;

        OrderItem oi = target.getOrderItem();
        Design d = oi != null ? oi.getDesign() : null;
        String prodName = d != null ? (d.getName() != null ? d.getName() : d.getDesignCode()) : (oi != null ? (oi.getUnmappedProductName() != null ? oi.getUnmappedProductName() : "제품") : "제품");

        Map<String, Object> res = new HashMap<>();
        res.put("workOrderId", target.getId());
        res.put("prevStage", prevStage);
        res.put("newStage", newStage);
        res.put("productName", prodName);
        res.put("itemLabel", itemLabel);
        res.put("orderId", orderId);
        res.put("orderNo", order.getOrderNo());
        res.put("status", order.getStatus());
        res.put("allFinished", allFinished);
        return res;
    }

    @Transactional
    public OrderResponseDTO advanceStage(Long workOrderId) {
        WorkOrder wo = workOrderRepository.findById(workOrderId)
                .orElseThrow(() -> new IllegalArgumentException("WorkOrder not found: " + workOrderId));

        OrderItem oi = wo.getOrderItem();
        if (oi == null) {
            List<OrderItem> items = orderItemRepository.findByOrderId(workOrderId);
            oi = items.isEmpty() ? null : items.get(0);
        }
        Order order = oi != null ? oi.getOrder() : null;
        Design d = oi != null ? oi.getDesign() : null;
        List<WorkOrder> all = order != null ? workOrderRepository.findAllByOrderId(order.getId()) : List.of();

        List<WorkOrder> sortedAll = new ArrayList<>(all);
        sortedAll.sort(Comparator.comparing(WorkOrder::getId));
        int woIdx = sortedAll.indexOf(wo);
        String seq = String.format("%02d", woIdx >= 0 ? woIdx + 1 : 1);
        String itemLabel = "#" + (order != null ? order.getId() : "") + "-" + seq;

        // Guard: If this work order is already completed, do not advance further
        if (isWorkOrderCompleted(wo)) {
            return OrderResponseDTO.builder()
                    .id(order != null ? order.getId() : null).orderNo(order != null ? order.getOrderNo() : null).shortCode(order != null ? order.getShortCode() : null)
                    .design(d != null ? d.getDesignCode() : null)
                    .brand(d != null ? d.getBrand() : (oi != null ? oi.getUnmappedBrandName() : null))
                    .imageUrl(oi != null ? oi.getImageUrl() : null)
                    .quantity(oi != null ? oi.getQuantity() : 1).unmappedProductName(oi != null ? oi.getUnmappedProductName() : null)
                    .date(order != null && order.getOrderDate() != null ? order.getOrderDate().toString() : null).stage(wo.getCurrentStage())
                    .itemStage(wo.getCurrentStage()).itemLabel(itemLabel).allFinished(false)
                    .isHold(all.stream().anyMatch(w -> Boolean.TRUE.equals(w.getIsHold())))
                    .orderType(order != null ? order.getOrderType() : null).customerName(order != null ? order.getCustomerName() : null)
                    .customerPhone(order != null ? order.getCustomerPhone() : null).status(order != null ? order.getStatus() : null)
                    .build();
        }

        String prevStage = wo.getCurrentStage() != null ? wo.getCurrentStage() : "접수";
        String newStage = nextStage(wo);
        wo.setCurrentStage(newStage);
        recordHistory(wo, newStage);
        workOrderRepository.save(wo);

        // Check if all work orders in the order are now completed
        boolean allFinished = !all.isEmpty() && all.stream().allMatch(w -> {
            if (w.getId().equals(wo.getId())) {
                return isWorkOrderCompleted(wo, newStage);
            }
            return isWorkOrderCompleted(w);
        });
        if (allFinished && order != null) {
            order.setStatus(OrderStatus.COMPLETED.name());
            orderRepository.save(order);
        }

        String rep = newStage;
        WorkOrder minWo = null;
        int minIdx = 999;
        for (WorkOrder w : all) {
            int idx = stageIndex(w);
            if (idx < minIdx) {
                minIdx = idx;
                minWo = w;
            }
        }
        if (minWo != null && minWo.getCurrentStage() != null) {
            rep = minWo.getCurrentStage();
        }

        String prodName = d != null ? (d.getName() != null ? d.getName() : d.getDesignCode()) : (oi != null ? (oi.getUnmappedProductName() != null ? oi.getUnmappedProductName() : "제품") : "제품");

        return OrderResponseDTO.builder()
                .id(order != null ? order.getId() : null).orderNo(order != null ? order.getOrderNo() : null).shortCode(order != null ? order.getShortCode() : null)
                .design(d != null ? d.getDesignCode() : null)
                .brand(d != null ? d.getBrand() : (oi != null ? oi.getUnmappedBrandName() : null))
                .imageUrl(oi != null ? oi.getImageUrl() : null)
                .quantity(oi != null ? oi.getQuantity() : 1).unmappedProductName(oi != null ? oi.getUnmappedProductName() : null)
                .productName(prodName)
                .date(order != null && order.getOrderDate() != null ? order.getOrderDate().toString() : null).stage(rep)
                .prevStage(prevStage)
                .itemStage(newStage).itemLabel(itemLabel).allFinished(allFinished)
                .isHold(all.stream().anyMatch(w -> Boolean.TRUE.equals(w.getIsHold())))
                .orderType(order != null ? order.getOrderType() : null).customerName(order != null ? order.getCustomerName() : null)
                .customerPhone(order != null ? order.getCustomerPhone() : null).status(order != null ? order.getStatus() : null)
                .build();
    }

    // ─── Hold ─────────────────────────────────────────────────────────────────

    @Transactional
    public void setOrderHoldStatus(Long orderId, boolean hold) {
        List<WorkOrder> wos = workOrderRepository.findAllByOrderId(orderId);
        wos.forEach(w -> { w.setIsHold(hold); workOrderRepository.save(w); });
    }

    @Transactional
    public OrderResponseDTO holdOrder(Long workOrderId) {
        WorkOrder wo = workOrderRepository.findById(workOrderId)
                .orElseThrow(() -> new IllegalArgumentException("WorkOrder not found: " + workOrderId));
        wo.setIsHold(!Boolean.TRUE.equals(wo.getIsHold()));
        workOrderRepository.save(wo);
        OrderItem oi = wo.getOrderItem();
        Order order = oi != null ? oi.getOrder() : null;
        Design d = oi != null ? oi.getDesign() : null;
        List<WorkOrder> all = order != null ? workOrderRepository.findAllByOrderId(order.getId()) : List.of();
        return OrderResponseDTO.builder()
                .id(order != null ? order.getId() : null).orderNo(order != null ? order.getOrderNo() : null).stage(wo.getCurrentStage())
                .isHold(all.stream().anyMatch(w -> Boolean.TRUE.equals(w.getIsHold())))
                .brand(d != null ? d.getBrand() : (oi != null ? oi.getUnmappedBrandName() : null))
                .imageUrl(oi != null ? oi.getImageUrl() : null)
                .quantity(oi != null ? oi.getQuantity() : 1).status(order != null ? order.getStatus() : null).build();
    }

    // ─── Cancel ───────────────────────────────────────────────────────────────

    public Double calculateCancelEstimate(Long orderId) {
        List<WorkOrder> wos = workOrderRepository.findAllByOrderId(orderId);
        if (wos.isEmpty()) return 0.0;
        WorkOrder wo = wos.get(0);
        String stage = wo.getCurrentStage();
        ProcessTemplate tpl = wo.getTemplate();
        if (tpl != null && tpl.getSteps() != null && !tpl.getSteps().isEmpty()) {
            List<ProcessTemplateStep> steps = tpl.getSteps();
            int stageIdx = -1;
            for (int i = 0; i < steps.size(); i++) {
                String name = steps.get(i).getStageName() != null ? steps.get(i).getStageName() : steps.get(i).getStageCode();
                if (stage != null && (stage.equalsIgnoreCase(name) || stage.equalsIgnoreCase(steps.get(i).getStageCode()))) {
                    stageIdx = i;
                    break;
                }
            }
            if (stageIdx <= 0) return 0.0;
            double ratio = (double) stageIdx / (double) Math.max(1, steps.size() - 1);
            return Math.round(ratio * 300000.0 / 10000.0) * 10000.0;
        }
        return 0.0;
    }

    @Transactional
    public Map<String, Object> cancelOrder(Long orderId) {
        Order order = orderRepository.findById(orderId).orElseThrow();
        Double fee = calculateCancelEstimate(orderId);
        order.setStatus("CANCELLED");
        order.setCancellationFee(fee != null ? BigDecimal.valueOf(fee) : null);
        orderRepository.save(order);

        List<WorkOrder> wos = workOrderRepository.findAllByOrderId(orderId);
        for (WorkOrder w : wos) {
            w.setCurrentStage("취소");
            workOrderRepository.save(w);
        }

        Map<String, Object> res = new HashMap<>();
        res.put("orderId", orderId);
        res.put("cancellationFee", fee);
        res.put("status", "CANCELLED");
        return res;
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private ProcessTemplate getEffectiveTemplate(WorkOrder wo) {
        Long currentUserId = securityUtils.getCurrentUserId();
        List<ProcessTemplate> userTemplates = templateRepository.findAll().stream()
                .filter(t -> t.getUserId() != null && currentUserId != null && t.getUserId().equals(currentUserId))
                .toList();
        ProcessTemplate def = userTemplates.stream()
                .filter(t -> Boolean.TRUE.equals(t.getIsDefault()))
                .findFirst()
                .orElseGet(() -> userTemplates.isEmpty() ? null : userTemplates.get(0));

        if (wo != null && wo.getTemplate() != null && templateRepository.existsById(wo.getTemplate().getId())) {
            ProcessTemplate tpl = wo.getTemplate();
            if (tpl.getSteps() != null && !tpl.getSteps().isEmpty()) {
                return tpl;
            }
        }

        if (wo != null && def != null) {
            wo.setTemplate(def);
            if (def.getSteps() != null && !def.getSteps().isEmpty()) {
                boolean hasStage = def.getSteps().stream()
                        .anyMatch(s -> s.getStageName() != null && s.getStageName().equalsIgnoreCase(wo.getCurrentStage()));
                if (!hasStage && !isWorkOrderCompleted(wo)) {
                    wo.setCurrentStage(def.getSteps().get(0).getStageName());
                }
            }
            workOrderRepository.save(wo);
        }
        return def;
    }

    public boolean isLastStageOfTemplate(WorkOrder wo, String stage) {
        if (wo == null || stage == null) return false;
        ProcessTemplate template = getEffectiveTemplate(wo);
        if (template == null || template.getSteps() == null || template.getSteps().isEmpty()) {
            return OrderStatus.isCompleted(stage);
        }
        List<ProcessTemplateStep> steps = template.getSteps();
        ProcessTemplateStep last = steps.get(steps.size() - 1);
        String lastStageName = last.getStageName() != null ? last.getStageName() : last.getStageCode();
        return stage.trim().equalsIgnoreCase(lastStageName.trim()) || OrderStatus.isCompleted(stage);
    }

    public boolean isWorkOrderCompleted(WorkOrder wo) {
        if (wo == null) return false;
        if (wo.getCompletedAt() != null) return true;
        return isLastStageOfTemplate(wo, wo.getCurrentStage());
    }

    public boolean isWorkOrderCompleted(WorkOrder wo, String stage) {
        if (wo == null) return false;
        if (wo.getCompletedAt() != null && stage != null && stage.trim().equalsIgnoreCase(wo.getCurrentStage())) return true;
        return isLastStageOfTemplate(wo, stage);
    }

    private ProcessTemplateStep getCurrentStep(WorkOrder wo) {
        ProcessTemplate template = getEffectiveTemplate(wo);
        if (template == null || template.getSteps() == null || template.getSteps().isEmpty()) return null;
        
        List<ProcessTemplateStep> steps = template.getSteps();
        String currentStage = wo != null && wo.getCurrentStage() != null ? wo.getCurrentStage() : "";

        for (ProcessTemplateStep s : steps) {
            String name = s.getStageName() != null ? s.getStageName() : s.getStageCode();
            if (currentStage.equalsIgnoreCase(name) || currentStage.equalsIgnoreCase(s.getStageCode())) {
                return s;
            }
        }

        // Return first step without silently mutating currentStage in DB
        return steps.get(0);
    }

    private String nextStage(WorkOrder wo) {
        ProcessTemplate template = getEffectiveTemplate(wo);
        if (template == null || template.getSteps() == null || template.getSteps().isEmpty()) {
            throw new IllegalStateException("등록된 공정 템플릿이 없습니다. [공정 관리]에서 새로운 공정 템플릿을 추가해 주세요.");
        }

        List<ProcessTemplateStep> steps = template.getSteps();
        ProcessTemplateStep current = getCurrentStep(wo);

        Optional<ProcessTemplateStep> nextOpt = steps.stream()
                .filter(s -> s.getStepOrder() > current.getStepOrder())
                .findFirst();

        if (nextOpt.isPresent()) {
            ProcessTemplateStep next = nextOpt.get();
            return next.getStageName() != null ? next.getStageName() : next.getStageCode();
        }

        ProcessTemplateStep last = steps.get(steps.size() - 1);
        return last.getStageName() != null ? last.getStageName() : last.getStageCode();
    }

    private int stageIndex(WorkOrder wo) {
        ProcessTemplateStep step = getCurrentStep(wo);
        return step != null ? step.getStepOrder() : 99;
    }

    private void recordHistory(WorkOrder wo, String stage) {
        ProcessTemplateStep step = getCurrentStep(wo);
        int order = step != null ? step.getStepOrder() : 0;

        WorkOrderHistory history = WorkOrderHistory.builder()
                .workOrder(wo)
                .stepName(stage)
                .stepOrder(order)
                .completedAt(LocalDateTime.now())
                .build();
        historyRepository.save(history);

        if (isWorkOrderCompleted(wo, stage)) {
            wo.setCompletedAt(LocalDateTime.now());
        }
    }
}
