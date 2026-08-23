package com.minibig.karatflow.backend.service;
import com.minibig.karatflow.backend.domain.Order;
import com.minibig.karatflow.backend.domain.OrderItem;
import com.minibig.karatflow.backend.domain.Design;
import com.minibig.karatflow.backend.domain.WorkOrder;
import com.minibig.karatflow.backend.dto.OrderResponseDTO;
import com.minibig.karatflow.backend.dto.OrderCreateRequestDTO;
import com.minibig.karatflow.backend.dto.DashboardStatsDTO;
import com.minibig.karatflow.backend.repository.OrderRepository;
import com.minibig.karatflow.backend.repository.OrderItemRepository;
import com.minibig.karatflow.backend.repository.DesignRepository;
import com.minibig.karatflow.backend.repository.WorkOrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class OrderService {
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final DesignRepository designRepository;
    private final WorkOrderRepository workOrderRepository;

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
                .cancellationRate(Math.round(cancellationRate * 10.0) / 10.0) // 1 decimal place
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
        if (dto.getDesignId() != null) {
            design = designRepository.findById(dto.getDesignId())
                    .orElseThrow(() -> new IllegalArgumentException("Design not found"));
        } else if (dto.getUnmappedProductName() == null && dto.getImageUrl() == null) {
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
                .createdAt(java.time.LocalDateTime.now().toString())
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
    public com.minibig.karatflow.backend.domain.OrderDetailDTO getOrderDetails(Long orderId) {
        Order order = orderRepository.findById(orderId).orElseThrow();
        OrderItem oi = orderItemRepository.findByOrderId(orderId).get(0);
        Design d = oi.getDesign();
        List<WorkOrder> workOrders = workOrderRepository.findAllByOrderId(orderId);
        
        List<com.minibig.karatflow.backend.domain.OrderDetailDTO.WorkOrderDTO> woDTOs = workOrders.stream().map(w -> 
            com.minibig.karatflow.backend.domain.OrderDetailDTO.WorkOrderDTO.builder()
                .id(w.getId())
                .stage(w.getCurrentStage())
                .isHold(w.getIsHold())
                .createdAt(w.getCreatedAt() != null ? w.getCreatedAt().toString() : null)
                .build()
        ).collect(Collectors.toList());

        return com.minibig.karatflow.backend.domain.OrderDetailDTO.builder()
                .orderId(order.getId())
                .orderNo(order.getOrderNo())
                .brand(d != null ? d.getBrand() : oi.getUnmappedBrandName())
                .designCode(d != null ? d.getDesignCode() : null)
                .productName(d != null ? d.getName() : oi.getUnmappedProductName())
                .imageUrl(oi.getImageUrl() != null ? oi.getImageUrl() : (d != null ? d.getImageUrl() : null))
                .quantity(oi.getQuantity())
                .workOrders(woDTOs)
                .build();
    }

    public List<OrderResponseDTO> getDashboardOrders() {
        List<Map<String, Object>> rows = orderRepository.findDashboardOrders();
        return rows.stream().map(row -> OrderResponseDTO.builder()
                .id(((Number) row.get("ID")).longValue())
                .orderNo((String) row.get("ORDERNO"))
                .shortCode((String) row.get("SHORTCODE"))
                .design((String) row.get("DESIGN"))
                .brand((String) row.get("BRAND"))
                .imageUrl((String) row.get("IMAGEURL"))
                .quantity(row.get("QUANTITY") != null ? ((Number) row.get("QUANTITY")).intValue() : null)
                .unmappedProductName((String) row.get("UNMAPPEDPRODUCTNAME"))
                .date(row.get("DATE").toString())
                .stage((String) row.get("STAGE"))
                .isHold((Boolean) row.get("ISHOLD"))
                .createdAt(row.get("CREATEDAT") != null ? row.get("CREATEDAT").toString() : null)
                .pendingCompletedAt(row.get("PENDINGCOMPLETEDAT") != null ? row.get("PENDINGCOMPLETEDAT").toString() : null)
                .cadCompletedAt(row.get("CADCOMPLETEDAT") != null ? row.get("CADCOMPLETEDAT").toString() : null)
                .castingCompletedAt(row.get("CASTINGCOMPLETEDAT") != null ? row.get("CASTINGCOMPLETEDAT").toString() : null)
                .polishingCompletedAt(row.get("POLISHINGCOMPLETEDAT") != null ? row.get("POLISHINGCOMPLETEDAT").toString() : null)
                .platingCompletedAt(row.get("PLATINGCOMPLETEDAT") != null ? row.get("PLATINGCOMPLETEDAT").toString() : null)
                .completedAt(row.get("COMPLETEDAT") != null ? row.get("COMPLETEDAT").toString() : null)
                .engravingText((String) row.get("ENGRAVINGTEXT"))
                .engravingLocation((String) row.get("ENGRAVINGLOCATION"))
                .surfaceFinish((String) row.get("SURFACEFINISH"))
                .orderType((String) row.get("ORDERTYPE"))
                .customerName((String) row.get("CUSTOMERNAME"))
                .customerPhone((String) row.get("CUSTOMERPHONE"))
                .finalConsumerPrice(row.get("FINALCONSUMERPRICE") != null ? ((Number) row.get("FINALCONSUMERPRICE")).doubleValue() : null)
                .status((String) row.get("STATUS"))
                .cancellationFee(row.get("CANCELLATIONFEE") != null ? ((Number) row.get("CANCELLATIONFEE")).doubleValue() : null)
                .build()
        ).collect(Collectors.toList());
    }

    @Transactional
    public void setOrderHoldStatus(Long orderId, boolean isHold) {
        WorkOrder workOrder = workOrderRepository.findByOrderId(orderId)
            .orElseThrow(() -> new IllegalArgumentException("WorkOrder not found for orderId: " + orderId));
        workOrder.setIsHold(isHold);
        workOrderRepository.save(workOrder);
    }

    @Transactional(readOnly = true)
    public Double calculateCancelEstimate(Long orderId) {
        Order order = orderRepository.findById(orderId).orElseThrow();
        WorkOrder workOrder = workOrderRepository.findByOrderId(orderId).orElse(null);
        String stage = workOrder != null ? "PENDING" : "CAD";

        Double basePrice = order.getFinalConsumerPrice() != null ? order.getFinalConsumerPrice().doubleValue() : null;
        if (basePrice == null || basePrice == 0) {
            basePrice = order.getBaseLaborFee() != null ? order.getBaseLaborFee() * 5 : 500000.0; // Fallback estimate
        }

        double penaltyRate = 0.0;
        if ("CAD".equalsIgnoreCase(stage)) penaltyRate = 0.10;
        else if ("Casting".equalsIgnoreCase(stage) || "주물".equals(stage)) penaltyRate = 0.30;
        else if ("Polishing".equalsIgnoreCase(stage) || "세공".equals(stage)) penaltyRate = 0.50;
        else if ("Plating".equalsIgnoreCase(stage) || "도금".equals(stage) || "Inspection".equalsIgnoreCase(stage) || "검수".equals(stage)) penaltyRate = 1.0;

        return basePrice * penaltyRate;
    }

    @Transactional
    public Map<String, Object> cancelOrder(Long orderId) {
        Order order = orderRepository.findById(orderId).orElseThrow();
        Double fee = calculateCancelEstimate(orderId);
        
        order.setStatus("CANCELLED");
        order.setCancellationFee(fee);
        orderRepository.save(order);

        WorkOrder workOrder = workOrderRepository.findByOrderId(orderId).orElse(null);
        if (workOrder != null) {
            workOrder.setIsHold(true);
            workOrderRepository.save(workOrder);
        }

        return Map.of("status", "success", "cancellationFee", fee);
    }

    @Transactional
    public Map<String, Object> advanceOrderStage(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));

        if ("CANCELLED".equals(order.getStatus()) || "COMPLETED".equals(order.getStatus())) {
            throw new IllegalStateException("Cannot advance stage for CANCELLED or COMPLETED orders");
        }

        WorkOrder workOrder = workOrderRepository.findByOrderId(orderId)
                .orElseThrow(() -> new IllegalArgumentException("WorkOrder not found"));

        String currentStage = "PENDING";
        String nextStage;

        switch (currentStage) {
            case "PENDING":
            case "접수":
                nextStage = "CAD";
                workOrder.setPendingCompletedAt(LocalDateTime.now());
                break;
            case "CAD":
                nextStage = "Casting";
                workOrder.setCadCompletedAt(LocalDateTime.now());
                break;
            case "Casting":
            case "주물":
                nextStage = "Polishing";
                workOrder.setCastingCompletedAt(LocalDateTime.now());
                break;
            case "Polishing":
            case "세공":
                nextStage = "Plating/Inspection";
                workOrder.setPolishingCompletedAt(LocalDateTime.now());
                break;
            case "Plating/Inspection":
            case "도금":
            case "검수":
                nextStage = "Completed";
                workOrder.setPlatingCompletedAt(LocalDateTime.now());
                workOrder.setCompletedAt(LocalDateTime.now());
                order.setStatus("COMPLETED");
                orderRepository.save(order);
                break;
            default:
                nextStage = "Completed";
                workOrder.setCompletedAt(LocalDateTime.now());
                order.setStatus("COMPLETED");
                orderRepository.save(order);
                break;
        }

        workOrder.setCurrentStage(nextStage);
        workOrderRepository.save(workOrder);

        return Map.of(
            "orderId", orderId,
            "previousStage", currentStage,
            "newStage", nextStage,
            "orderStatus", order.getStatus()
        );
    }
}
