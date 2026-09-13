import codecs

content = '''package com.minibig.karatflow.backend.service;

import com.minibig.karatflow.backend.domain.*;
import com.minibig.karatflow.backend.dto.*;
import com.minibig.karatflow.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final WorkOrderRepository workOrderRepository;
    private final DesignRepository designRepository;

    public DashboardStatsDTO getDashboardStats() {
        List<OrderResponseDTO> orders = getDashboardOrders();
        long totalOrders = orders.size();
        long cancelledOrders = orders.stream().filter(o -> "CANCELLED".equals(o.getStatus())).count();
        long activeOrders = orders.stream().filter(o -> !"CANCELLED".equals(o.getStatus()) && !"COMPLETED".equals(o.getStatus())).count();
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

    @Transactional
    public OrderResponseDTO createOrder(OrderCreateRequestDTO dto) {
        String dateStr = java.time.format.DateTimeFormatter.ofPattern("yyMMdd").format(LocalDateTime.now());
        String shortCode = java.util.UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        Order order = Order.builder()
                .orderType(dto.getOrderType())
                .customerName(dto.getCustomerName())
                .customerPhone(dto.getCustomerPhone())
                .finalConsumerPrice(dto.getFinalConsumerPrice() != null ? BigDecimal.valueOf(dto.getFinalConsumerPrice()) : null)
                .orderDate(LocalDateTime.now().toLocalDate())
                .status("PROCESSING")
                .createdAt(LocalDateTime.now())
                .shortCode(shortCode)
                .build();
        order = orderRepository.save(order);
        order.setOrderNo("ORD-" + dateStr + "-" + String.format("%03d", order.getId() % 1000));
        order = orderRepository.save(order);

        Design design = null;
        if (dto.getDesignId() != null && dto.getDesignId() > 0) {
            design = designRepository.findById(dto.getDesignId()).orElse(null);
        }
        if (design == null && dto.getUnmappedProductName() == null && dto.getImageUrl() == null) {
            throw new IllegalArgumentException("Either a registered product or an unmapped product name / image must be provided.");
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

        int qty = orderItem.getQuantity() != null ? orderItem.getQuantity() : 1;
        for (int i = 0; i < qty; i++) {
            WorkOrder workOrder = WorkOrder.builder()
                    .orderItemId(orderItem.getId())
                    .currentStage("PENDING")
                    .isHold(false)
                    .createdAt(LocalDateTime.now())
                    .build();
            workOrder = workOrderRepository.save(workOrder);
            workOrder.setWorkOrderNo(WorkOrder.generateWorkOrderNo(workOrder.getId()));
            workOrderRepository.save(workOrder);
        }

        return OrderResponseDTO.builder()
                .id(order.getId())
                .orderNo(order.getOrderNo())
                .shortCode(order.getShortCode())
                .design(design != null ? design.getDesignCode() : null)
                .brand(design != null ? design.getBrand() : dto.getUnmappedBrandName())
                .imageUrl(dto.getImageUrl() != null ? dto.getImageUrl() : (design != null ? design.getImageUrl() : null))
                .quantity(orderItem.getQuantity())
                .unmappedProductName(dto.getUnmappedProductName())
                .date(order.getOrderDate().toString())
                .stage("PENDING")
                .isHold(false)
                .createdAt(LocalDateTime.now().toString())
                .pendingCompletedAt(null)
                .cadCompletedAt(null)
                .castingCompletedAt(null)
                .polishingCompletedAt(null)
                .platingCompletedAt(null)
                .completedAt(null)
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

    @Transactional(readOnly = true)
    public OrderDetailDTO getOrderDetails(Long orderId) {
        Order order = orderRepository.findById(orderId).orElseThrow();
        List<OrderItem> items = orderItemRepository.findByOrderId(orderId);
        if (items.isEmpty()) throw new IllegalStateException("No order items found for order " + orderId);
        OrderItem oi = items.get(0);
        Design d = oi.getDesign();
        List<WorkOrder> workOrders = workOrderRepository.findAllByOrderId(orderId);

        List<OrderDetailDTO.WorkOrderDTO> woDTOs = workOrders.stream().map(w ->
            OrderDetailDTO.WorkOrderDTO.builder()
                .id(w.getId())
                .workOrderNo(w.getWorkOrderNo())
                .stage(w.getCurrentStage())
                .isHold(w.getIsHold())
                .createdAt(w.getCreatedAt() != null ? w.getCreatedAt().toString() : null)
                .build()
        ).collect(Collectors.toList());

        return OrderDetailDTO.builder()
                .orderId(order.getId())
                .orderNo(order.getOrderNo())
                .customerName(order.getCustomerName())
                .customerPhone(order.getCustomerPhone())
                .orderType(order.getOrderType())
                .orderDate(order.getOrderDate() != null ? order.getOrderDate().toString() : null)
                .brand(d != null ? d.getBrand() : oi.getUnmappedBrandName())
                .designCode(d != null ? d.getDesignCode() : null)
                .productName(d != null ? d.getName() : oi.getUnmappedProductName())
                .imageUrl(oi.getImageUrl() != null ? oi.getImageUrl() : (d != null ? d.getImageUrl() : null))
                .quantity(oi.getQuantity())
                .engravingText(oi.getEngravingText())
                .engravingLocation(oi.getEngravingLocation())
                .surfaceFinish(oi.getSurfaceFinish())
                .workOrders(woDTOs)
                .build();
    }

    @Transactional
    public OrderResponseDTO advanceStage(Long workOrderId) {
        WorkOrder workOrder = workOrderRepository.findById(workOrderId)
                .orElseThrow(() -> new IllegalArgumentException("WorkOrder not found: " + workOrderId));

        String next = nextStage(workOrder.getCurrentStage());
        workOrder.setCurrentStage(next);
        setStageTimestamp(workOrder, next);
        workOrderRepository.save(workOrder);

        // Also derive the dashboard row from the associated order item -> order
        OrderItem oi = orderItemRepository.findById(workOrder.getOrderItemId())
                .orElseThrow(() -> new IllegalStateException("OrderItem not found"));
        Order order = oi.getOrder();

        // Find the first (earliest) work order for the dashboard row stage
        List<WorkOrder> allWOs = workOrderRepository.findAllByOrderId(order.getId());
        String representativeStage = allWOs.stream()
                .map(WorkOrder::getCurrentStage)
                .min(java.util.Comparator.comparingInt(OrderService::stageIndex))
                .orElse(next);

        Design d = oi.getDesign();
        return OrderResponseDTO.builder()
                .id(order.getId())
                .orderNo(order.getOrderNo())
                .shortCode(order.getShortCode())
                .design(d != null ? d.getDesignCode() : null)
                .brand(d != null ? d.getBrand() : oi.getUnmappedBrandName())
                .imageUrl(oi.getImageUrl() != null ? oi.getImageUrl() : (d != null ? d.getImageUrl() : null))
                .quantity(oi.getQuantity())
                .unmappedProductName(oi.getUnmappedProductName())
                .date(order.getOrderDate().toString())
                .stage(representativeStage)
                .isHold(allWOs.stream().anyMatch(w -> Boolean.TRUE.equals(w.getIsHold())))
                .orderType(order.getOrderType())
                .customerName(order.getCustomerName())
                .customerPhone(order.getCustomerPhone())
                .status(order.getStatus())
                .build();
    }

    private static int stageIndex(String stage) {
        return switch (stage) {
            case "PENDING" -> 0;
            case "CAD" -> 1;
            case "CASTING" -> 2;
            case "POLISHING" -> 3;
            case "PLATING" -> 4;
            case "COMPLETED" -> 5;
            default -> 99;
        };
    }

    private String nextStage(String current) {
        return switch (current) {
            case "PENDING" -> "CAD";
            case "CAD" -> "CASTING";
            case "CASTING" -> "POLISHING";
            case "POLISHING" -> "PLATING";
            case "PLATING" -> "COMPLETED";
            default -> "COMPLETED";
        };
    }

    private void setStageTimestamp(WorkOrder wo, String stage) {
        LocalDateTime now = LocalDateTime.now();
        switch (stage) {
            case "CAD" -> wo.setPendingCompletedAt(now);
            case "CASTING" -> wo.setCadCompletedAt(now);
            case "POLISHING" -> wo.setCastingCompletedAt(now);
            case "PLATING" -> wo.setPolishingCompletedAt(now);
            case "COMPLETED" -> wo.setCompletedAt(now);
        }
    }

    @Transactional
    public OrderResponseDTO holdOrder(Long workOrderId) {
        WorkOrder workOrder = workOrderRepository.findById(workOrderId)
                .orElseThrow(() -> new IllegalArgumentException("WorkOrder not found: " + workOrderId));
        workOrder.setIsHold(!Boolean.TRUE.equals(workOrder.getIsHold()));
        workOrderRepository.save(workOrder);

        OrderItem oi = orderItemRepository.findById(workOrder.getOrderItemId()).orElseThrow();
        Order order = oi.getOrder();
        Design d = oi.getDesign();
        List<WorkOrder> allWOs = workOrderRepository.findAllByOrderId(order.getId());

        return OrderResponseDTO.builder()
                .id(order.getId())
                .orderNo(order.getOrderNo())
                .stage(workOrder.getCurrentStage())
                .isHold(allWOs.stream().anyMatch(w -> Boolean.TRUE.equals(w.getIsHold())))
                .brand(d != null ? d.getBrand() : oi.getUnmappedBrandName())
                .imageUrl(oi.getImageUrl() != null ? oi.getImageUrl() : (d != null ? d.getImageUrl() : null))
                .quantity(oi.getQuantity())
                .status(order.getStatus())
                .build();
    }

    @Transactional
    public void cancelOrder(Long orderId) {
        Order order = orderRepository.findById(orderId).orElseThrow();
        order.setStatus("CANCELLED");
        orderRepository.save(order);
    }

    public List<OrderResponseDTO> getDashboardOrders() {
        List<java.util.Map<String, Object>> rows = orderRepository.findDashboardOrders();
        return rows.stream().map(row -> {
            String createdAtRaw = row.get("CREATEDAT") != null ? row.get("CREATEDAT").toString() : null;
            String pendingRaw = row.get("PENDINGCOMPLETEDAT") != null ? row.get("PENDINGCOMPLETEDAT").toString() : null;
            String cadRaw = row.get("CADCOMPLETEDAT") != null ? row.get("CADCOMPLETEDAT").toString() : null;
            String castingRaw = row.get("CASTINGCOMPLETEDAT") != null ? row.get("CASTINGCOMPLETEDAT").toString() : null;
            String polishingRaw = row.get("POLISHINGCOMPLETEDAT") != null ? row.get("POLISHINGCOMPLETEDAT").toString() : null;
            String platingRaw = row.get("PLATINGCOMPLETEDAT") != null ? row.get("PLATINGCOMPLETEDAT").toString() : null;
            String completedRaw = row.get("COMPLETEDAT") != null ? row.get("COMPLETEDAT").toString() : null;

            return OrderResponseDTO.builder()
                    .id(row.get("ID") != null ? ((Number) row.get("ID")).longValue() : null)
                    .orderNo((String) row.get("ORDERNO"))
                    .shortCode((String) row.get("SHORTCODE"))
                    .design((String) row.get("DESIGN"))
                    .brand((String) row.get("BRAND"))
                    .imageUrl((String) row.get("IMAGEURL"))
                    .quantity(row.get("QUANTITY") != null ? ((Number) row.get("QUANTITY")).intValue() : null)
                    .unmappedProductName((String) row.get("UNMAPPEDPRODUCTNAME"))
                    .date(row.get("DATE") != null ? row.get("DATE").toString() : null)
                    .stage((String) row.get("STAGE"))
                    .isHold((Boolean) row.get("ISHOLD"))
                    .engravingText((String) row.get("ENGRAVINGTEXT"))
                    .engravingLocation((String) row.get("ENGRAVINGLOCATION"))
                    .surfaceFinish((String) row.get("SURFACEFINISH"))
                    .orderType((String) row.get("ORDERTYPE"))
                    .customerName((String) row.get("CUSTOMERNAME"))
                    .customerPhone((String) row.get("CUSTOMERPHONE"))
                    .finalConsumerPrice(row.get("FINALCONSUMERPRICE") != null ? ((Number) row.get("FINALCONSUMERPRICE")).doubleValue() : null)
                    .status((String) row.get("STATUS"))
                    .cancellationFee(row.get("CANCELLATIONFEE") != null ? ((Number) row.get("CANCELLATIONFEE")).doubleValue() : null)
                    .createdAt(createdAtRaw)
                    .pendingCompletedAt(pendingRaw)
                    .cadCompletedAt(cadRaw)
                    .castingCompletedAt(castingRaw)
                    .polishingCompletedAt(polishingRaw)
                    .platingCompletedAt(platingRaw)
                    .completedAt(completedRaw)
                    .build();
        }).collect(Collectors.toList());
    }
}
'''

with codecs.open(
    'backend/src/main/java/com/minibig/karatflow/backend/service/OrderService.java',
    'w', 'utf-8'
) as f:
    f.write(content)

print("OrderService.java written successfully")
