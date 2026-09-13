import codecs

with codecs.open('backend/src/main/java/com/minibig/karatflow/backend/repository/OrderRepository.java', 'r', 'utf-8') as f:
    text = f.read()

old_query = """    @Query(value = "SELECT o.order_id as id, o.order_no as orderNo, o.short_code as shortCode, d.design_code as design, o.order_date as date, " +
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
                   "ORDER BY o.order_id DESC", nativeQuery = true)"""

new_query = """    @Query(value = "SELECT o.order_id as id, o.order_no as orderNo, o.short_code as shortCode, d.design_code as design, o.order_date as date, " +
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
                   "JOIN (SELECT * FROM (SELECT w.*, ROW_NUMBER() OVER(PARTITION BY w.order_item_id ORDER BY w.work_order_id) as rn FROM work_orders w) as w_sub WHERE w_sub.rn = 1) w ON oi.order_item_id = w.order_item_id " +
                   "ORDER BY o.order_id DESC", nativeQuery = true)"""

text = text.replace(old_query, new_query)

with codecs.open('backend/src/main/java/com/minibig/karatflow/backend/repository/OrderRepository.java', 'w', 'utf-8') as f:
    f.write(text)
