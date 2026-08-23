package com.minibig.karatflow.backend.service;

import com.minibig.karatflow.backend.domain.Design;
import com.minibig.karatflow.backend.domain.OrderItem;
import com.minibig.karatflow.backend.repository.DesignRepository;
import com.minibig.karatflow.backend.repository.OrderItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final DesignRepository designRepository;
    private final OrderItemRepository orderItemRepository;

    
    @Transactional
    public Design createProduct(String brand, String designCode, String name, java.math.BigDecimal baseLaborFee, String imageUrl) {
        Design product = Design.builder()
                .brand(brand)
                .designCode(designCode)
                .name(name)
                .imageUrl(imageUrl)
                .baseLaborFee(baseLaborFee)
                .isVerified(true)
                .createdAt(java.time.LocalDateTime.now())
                .build();
        return designRepository.save(product);
    }

    public List<Design> getAllProducts() {
        return designRepository.findAll();
    }

    @Transactional
    public Design confirmProduct(Long orderItemId, String brand, String designCode, String name, java.math.BigDecimal baseLaborFee) {
        OrderItem orderItem = orderItemRepository.findById(orderItemId)
                .orElseThrow(() -> new IllegalArgumentException("OrderItem not found"));
        
        if (orderItem.getDesign() != null) {
            throw new IllegalArgumentException("Already mapped to a product.");
        }

        Design product = Design.builder()
                .brand(brand != null ? brand : orderItem.getUnmappedBrandName())
                .designCode(designCode != null ? designCode : orderItem.getUnmappedProductName())
                .name(name != null ? name : orderItem.getUnmappedProductName())
                .imageUrl(orderItem.getImageUrl())
                .baseLaborFee(baseLaborFee)
                .isVerified(true)
                .createdAt(java.time.LocalDateTime.now())
                .build();
        
        product = designRepository.save(product);
        
        orderItem.setDesign(product);
        orderItemRepository.save(orderItem);
        
        return product;
    }

    @Transactional
    public OrderItem mapToExistingProduct(Long orderItemId, Long designId) {
        OrderItem orderItem = orderItemRepository.findById(orderItemId)
                .orElseThrow(() -> new IllegalArgumentException("OrderItem not found"));
        Design product = designRepository.findById(designId)
                .orElseThrow(() -> new IllegalArgumentException("Product not found"));
        
        orderItem.setDesign(product);
        return orderItemRepository.save(orderItem);
    }
    
    public List<OrderItem> getUnmappedCandidates() {
        return orderItemRepository.findAll().stream()
                .filter(item -> item.getDesign() == null && (item.getUnmappedProductName() != null || item.getImageUrl() != null))
                .collect(Collectors.toList());
    }
}
