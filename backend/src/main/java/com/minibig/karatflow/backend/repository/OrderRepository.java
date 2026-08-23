package com.minibig.karatflow.backend.repository;
import com.minibig.karatflow.backend.domain.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import java.util.Map;

public interface OrderRepository extends JpaRepository<Order, Long> {
    
    @Query(value = "SELECT o.order_id as id, o.order_no as orderNo, o.short_code as shortCode, d.design_code as design, o.order_date as date, " +
                   "d.brand as brand, oi.image_url as imageUrl, oi.quantity as quantity, oi.unmapped_product_name as unmappedProductName, " +
                   "w.current_stage as stage, w.is_hold as isHold, " +
                   "w.created_at as createdAt, w.pending_completed_at as pendingCompletedAt, " +
                   "w.cad_completed_at as cadCompletedAt, w.casting_completed_at as castingCompletedAt, " +
                   "w.polishing_completed_at as polishingCompletedAt, w.plating_completed_at as platingCompletedAt, w.completed_at as completedAt, " +
                   "oi.engraving_text as engravingText, oi.engraving_location as engravingLocation, oi.surface_finish as surfaceFinish, " +
                   "o.order_type as orderType, o.customer_name as customerName, o.customer_phone as customerPhone, o.final_consumer_price as finalConsumerPrice, " +
                   "o.status as status, o.cancellation_fee as cancellationFee " +
                   "FROM orders o " +
                   "JOIN order_items oi ON o.order_id = oi.order_id " +
                   "LEFT JOIN designs d ON oi.design_id = d.design_id " +
                   "JOIN work_orders w ON oi.order_item_id = w.order_item_id " +
                   "ORDER BY o.order_id DESC", nativeQuery = true)
    List<Map<String, Object>> findDashboardOrders();

    java.util.Optional<Order> findByOrderNo(String orderNo);
    java.util.Optional<Order> findByShortCode(String shortCode);
}
