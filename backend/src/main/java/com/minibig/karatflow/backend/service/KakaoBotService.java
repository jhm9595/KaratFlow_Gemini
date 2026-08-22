package com.minibig.karatflow.backend.service;

import com.minibig.karatflow.backend.domain.Order;
import com.minibig.karatflow.backend.domain.WorkOrder;
import com.minibig.karatflow.backend.repository.OrderRepository;
import com.minibig.karatflow.backend.repository.WorkOrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class KakaoBotService {

    private final OrderRepository orderRepository;
    private final WorkOrderRepository workOrderRepository;
    private final OrderService orderService;

    public Map<String, Object> handleOrderStatusRequest(Map<String, Object> payload) {
        String orderNo = extractUtterance(payload);
        if (orderNo == null || orderNo.isEmpty()) {
            return buildSimpleTextResponse("주문 번호를 파악하지 못했습니다.");
        }

        return orderRepository.findByOrderNo(orderNo).map(order -> {
            WorkOrder workOrder = workOrderRepository.findByOrderId(order.getId()).orElse(null);
            String stage = (workOrder != null) ? workOrder.getCurrentStage() : "알 수 없음";
            
            String text = String.format("주문번호 [%s]의 현재 상태는 '%s' 단계입니다.\n(전체 상태: %s)",
                    order.getOrderNo(), stage, order.getStatus());
            
            return buildSimpleTextResponse(text);
        }).orElseGet(() -> buildSimpleTextResponse("해당 주문 번호(" + orderNo + ")를 찾을 수 없습니다."));
    }

    public Map<String, Object> handleCancelPreviewRequest(Map<String, Object> payload) {
        String orderNo = extractUtterance(payload);
        if (orderNo == null || orderNo.isEmpty()) {
            return buildSimpleTextResponse("주문 번호를 파악하지 못했습니다.");
        }

        return orderRepository.findByOrderNo(orderNo).map(order -> {
            if ("CANCELLED".equals(order.getStatus())) {
                return buildSimpleTextResponse("이미 취소된 주문입니다.");
            }
            if ("COMPLETED".equals(order.getStatus())) {
                return buildSimpleTextResponse("이미 완료된 주문은 취소할 수 없습니다.");
            }

            Double estimate = orderService.calculateCancelEstimate(order.getId());
            String text = String.format("주문번호 [%s] 취소 예상 위약금은 약 %,d원입니다.", order.getOrderNo(), estimate.longValue());
            return buildSimpleTextResponse(text);
        }).orElseGet(() -> buildSimpleTextResponse("해당 주문 번호(" + orderNo + ")를 찾을 수 없습니다."));
    }

    private String extractUtterance(Map<String, Object> payload) {
        try {
            Map<String, Object> userRequest = (Map<String, Object>) payload.get("userRequest");
            if (userRequest != null && userRequest.containsKey("utterance")) {
                String utterance = (String) userRequest.get("utterance");
                for (String word : utterance.split(" ")) {
                    if (word.startsWith("ORD-")) {
                        return word.replaceAll("[^A-Za-z0-9-]", "");
                    }
                }
                return utterance;
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }

    private Map<String, Object> buildSimpleTextResponse(String text) {
        Map<String, Object> simpleText = new HashMap<>();
        simpleText.put("text", text);

        Map<String, Object> output = new HashMap<>();
        output.put("simpleText", simpleText);

        Map<String, Object> template = new HashMap<>();
        template.put("outputs", new Object[]{output});

        Map<String, Object> response = new HashMap<>();
        response.put("version", "2.0");
        response.put("template", template);

        return response;
    }
}
