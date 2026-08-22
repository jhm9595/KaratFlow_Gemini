package com.minibig.karatflow.backend.service;

import com.minibig.karatflow.backend.domain.DailyMetalPrice;
import com.minibig.karatflow.backend.domain.Order;
import com.minibig.karatflow.backend.dto.InvoiceResponseDTO;
import com.minibig.karatflow.backend.repository.DailyMetalPriceRepository;
import com.minibig.karatflow.backend.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Optional;

import com.minibig.karatflow.backend.domain.SubcontractTask;
import com.minibig.karatflow.backend.repository.SubcontractTaskRepository;
import java.util.List;

@Service
@RequiredArgsConstructor
public class InvoiceCalculationService {

    private final OrderRepository orderRepository;
    private final DailyMetalPriceRepository dailyMetalPriceRepository;
    private final SubcontractTaskRepository subcontractTaskRepository;

    @Transactional(readOnly = true)
    public InvoiceResponseDTO calculateInvoice(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found: " + orderId));

        // fetch subcontracts
        List<SubcontractTask> subcontracts = subcontractTaskRepository.findByOrderId(orderId);
        double totalSubcontractFee = subcontracts.stream()
                .filter(t -> "RECEIVED".equals(t.getStatus()))
                .mapToDouble(SubcontractTask::getAgreedLaborFee)
                .sum();

        // defaults
        double completedWeight = order.getCompletedWeightG() != null ? order.getCompletedWeightG() : 3.75;
        double stoneWeight = order.getStoneWeightG() != null ? order.getStoneWeightG() : 0.0;
        double lossRate = order.getLossRatePercent() != null ? order.getLossRatePercent() : 10.0;
        double baseLaborFee = order.getBaseLaborFee() != null ? order.getBaseLaborFee() : 50000.0;
        double stoneFee = order.getStoneFee() != null ? order.getStoneFee() : 0.0;

        // 1. 순수 금 중량 = 완제품 실측 중량 - 스톤 중량
        double pureGoldWeight = completedWeight - stoneWeight;
        
        // 2. 정산 기준 중량 = 순수 금 중량 * (1 + 해리율/100)
        double settlementBaseWeight = pureGoldWeight * (1 + lossRate / 100.0);

        // get today's gold price
        Optional<DailyMetalPrice> priceOpt = dailyMetalPriceRepository.findByPriceDateAndMetalType(LocalDate.now(), "GOLD_24K");
        double pricePer375 = priceOpt.map(DailyMetalPrice::getPricePer375g).orElse(400000.0);
        LocalDate priceDate = priceOpt.map(DailyMetalPrice::getPriceDate).orElse(LocalDate.now());

        // 3. 금 금액 = (정산 기준 중량 / 3.75) * 당일 금 시세
        double calculatedGoldPrice = (settlementBaseWeight / 3.75) * pricePer375;

        // 4. 최종 청구액 = 금 금액 + 공임 + 스톤비 + 외주공임
        double finalAmount = calculatedGoldPrice + baseLaborFee + stoneFee + totalSubcontractFee;

        return InvoiceResponseDTO.builder()
                .orderId(order.getId())
                .orderType(order.getOrderType())
                .completedWeightG(completedWeight)
                .stoneWeightG(stoneWeight)
                .pureGoldWeightG(pureGoldWeight)
                .lossRatePercent(lossRate)
                .settlementBaseWeightG(settlementBaseWeight)
                .priceDate(priceDate)
                .goldPricePer375g(pricePer375)
                .calculatedGoldPrice(calculatedGoldPrice)
                .baseLaborFee(baseLaborFee)
                // store sum of subcontract fee in the DTO? Or just add it to final amount. We can return it too.
                // For simplicity, just send final amount.
                .stoneFee(stoneFee)
                .finalBillingAmount(finalAmount)
                .build();
    }
}
