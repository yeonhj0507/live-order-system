-- ============================================================
-- 뷰 정의 (MySQL)
-- ============================================================

-- 주문 상태 뷰: order_screenshot · paid_at · bundle_status 조합으로 판별
CREATE OR REPLACE VIEW v_order_status AS
SELECT
    o.order_id,
    o.session_id,
    o.customer_id,
    c.customer_nickname,
    o.order_price,
    o.order_token,
    o.ordered_at,
    o.paid_at,
    o.order_screenshot,
    o.bundle_id,
    b.bundle_status,
    b.delivery_token,
    b.delivery_recipient,
    b.delivery_address,
    b.delivery_phone,
    CASE
        WHEN o.order_screenshot IS NULL AND o.paid_at IS NULL THEN 'PENDING'
        WHEN o.paid_at IS NULL                                THEN 'UNPAID'
        WHEN b.bundle_status = 'MERGED' AND b.delivery_token IS NULL THEN 'PAID_BUNDLED'
        WHEN b.delivery_token IS NULL                         THEN 'PAID'
        WHEN b.delivery_recipient IS NULL                     THEN 'AWAITING_ADDRESS'
        ELSE 'READY_TO_SHIP'
    END AS order_status
FROM `order` o
JOIN customer c        ON o.customer_id = c.customer_id
JOIN delivery_bundle b ON o.bundle_id   = b.bundle_id;

-- 세션별 매출 집계 뷰
CREATE OR REPLACE VIEW v_session_revenue AS
SELECT
    s.session_id,
    s.session_date,
    s.session_title,
    s.session_status,
    COUNT(o.order_id)                                          AS total_orders,
    COALESCE(SUM(o.order_price), 0)                            AS total_revenue,
    SUM(CASE WHEN o.paid_at IS NOT NULL THEN 1 ELSE 0 END)    AS paid_count,
    SUM(CASE WHEN o.paid_at IS NULL THEN 1 ELSE 0 END)        AS unpaid_count,
    COALESCE(SUM(CASE WHEN o.paid_at IS NOT NULL THEN o.order_price ELSE 0 END), 0) AS paid_revenue
FROM live_session s
LEFT JOIN `order` o ON s.session_id = o.session_id
GROUP BY s.session_id, s.session_date, s.session_title, s.session_status;

-- 미입금 주문 뷰
CREATE OR REPLACE VIEW v_unpaid_orders AS
SELECT
    o.order_id,
    o.session_id,
    s.session_title,
    o.customer_id,
    c.customer_nickname,
    o.order_price,
    o.order_token,
    o.ordered_at,
    o.bundle_id
FROM `order` o
JOIN customer c      ON o.customer_id = c.customer_id
JOIN live_session s  ON o.session_id  = s.session_id
WHERE o.paid_at IS NULL;
