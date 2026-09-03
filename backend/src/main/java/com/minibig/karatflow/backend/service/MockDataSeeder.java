package com.minibig.karatflow.backend.service;

import com.minibig.karatflow.backend.dto.OrderCreateRequestDTO;
import com.minibig.karatflow.backend.dto.OrderResponseDTO;
import com.minibig.karatflow.backend.repository.OrderRepository;
import com.minibig.karatflow.backend.domain.DailyMetalPrice;
import com.minibig.karatflow.backend.repository.DailyMetalPriceRepository;
import java.time.LocalDate;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class MockDataSeeder {

    private final OrderService orderService;
    private final OrderRepository orderRepository;
    private final DailyMetalPriceRepository dailyMetalPriceRepository;

    @PostConstruct
    public void seedMockOrders() {
        if (orderRepository.count() == 0) {
            log.info("No orders found. Seeding mock orders for monitoring...");

            // Order 1: B2C, 2 items, progressed to CAD
            OrderCreateRequestDTO o1 = new OrderCreateRequestDTO();
            o1.setOrderType("B2C");
            o1.setCustomerName("김철수");
            o1.setCustomerPhone("010-1234-5678");
            o1.setUnmappedProductName("클래식 14K 웨딩 밴드");
            o1.setUnmappedBrandName("KaratFlow Original");
            o1.setQuantity(2);
            o1.setEngravingText("S & C");
            o1.setEngravingLocation("반지 안쪽");
            o1.setSurfaceFinish("유광");
            o1.setFinalConsumerPrice(450000.0);
            OrderResponseDTO res1 = orderService.createOrder(o1);
            orderService.advanceOrderStage(res1.getId()); // PENDING -> CAD

            // Order 2: B2B, 5 items, progressed to CASTING
            OrderCreateRequestDTO o2 = new OrderCreateRequestDTO();
            o2.setOrderType("B2B");
            o2.setCustomerName("제일귀금속");
            o2.setCustomerPhone("02-987-6543");
            o2.setUnmappedProductName("다이아몬드 테니스 팔찌");
            o2.setUnmappedBrandName("도매업체 A");
            o2.setQuantity(5);
            o2.setSurfaceFinish("무광");
            o2.setFinalConsumerPrice(2500000.0);
            OrderResponseDTO res2 = orderService.createOrder(o2);
            orderService.advanceOrderStage(res2.getId()); // PENDING -> CAD
            orderService.advanceOrderStage(res2.getId()); // CAD -> CASTING

            // Order 3: B2C, 1 item, PENDING
            OrderCreateRequestDTO o3 = new OrderCreateRequestDTO();
            o3.setOrderType("B2C");
            o3.setCustomerName("이영희");
            o3.setCustomerPhone("010-9999-8888");
            o3.setUnmappedProductName("심플 진주 목걸이");
            o3.setUnmappedBrandName("KaratFlow Original");
            o3.setQuantity(1);
            o3.setSurfaceFinish("유광");
            o3.setFinalConsumerPrice(150000.0);
            orderService.createOrder(o3);
            
            // Order 4: B2C, 1 item, progressed to POLISHING, put on HOLD
            OrderCreateRequestDTO o4 = new OrderCreateRequestDTO();
            o4.setOrderType("B2C");
            o4.setCustomerName("박지성");
            o4.setCustomerPhone("010-7777-6666");
            o4.setUnmappedProductName("18K 커플링 세트");
            o4.setUnmappedBrandName("KaratFlow Original");
            o4.setQuantity(1);
            o4.setEngravingText("Forever");
            o4.setEngravingLocation("안쪽");
            o4.setSurfaceFinish("유광");
            o4.setFinalConsumerPrice(850000.0);
            OrderResponseDTO res4 = orderService.createOrder(o4);
            orderService.advanceOrderStage(res4.getId()); // PENDING -> CAD
            orderService.advanceOrderStage(res4.getId()); // CAD -> CASTING
            orderService.advanceOrderStage(res4.getId()); // CASTING -> POLISHING
            orderService.setOrderHoldStatus(res4.getId(), true); // Put on hold

            log.info("Mock orders seeded successfully!");

        if (dailyMetalPriceRepository.count() == 0) {
            log.info("Seeding mock gold prices...");
            double[] mockPrices = {442000, 445000, 443500, 448000, 451000, 453000, 455000};
            for (int i = 0; i < mockPrices.length; i++) {
                DailyMetalPrice price = new DailyMetalPrice();
                price.setMetalType("GOLD_24K");
                price.setPricePer375g(mockPrices[i]);
                price.setPriceDate(LocalDate.now().minusDays(mockPrices.length - 1 - i));
                dailyMetalPriceRepository.save(price);
            }
        }
    
        }
    }
}
