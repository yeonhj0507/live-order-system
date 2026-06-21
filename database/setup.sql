-- ============================================================
-- TiDB 초기 설정: 이 파일 전체를 SQL Editor에 붙여넣기
-- ============================================================

CREATE DATABASE IF NOT EXISTS live_order;
USE live_order;

-- ==================== 테이블 생성 ====================

DROP TABLE IF EXISTS `order`;
DROP TABLE IF EXISTS delivery_bundle;
DROP TABLE IF EXISTS customer;
DROP TABLE IF EXISTS live_session;

CREATE TABLE live_session (
    session_id      INT PRIMARY KEY AUTO_INCREMENT,
    session_date    DATE         NOT NULL,
    session_title   VARCHAR(200) NOT NULL,
    session_status  ENUM('SCHEDULED','LIVE','ENDED') NOT NULL DEFAULT 'SCHEDULED'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE customer (
    customer_id       VARCHAR(100) PRIMARY KEY,
    customer_nickname VARCHAR(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE delivery_bundle (
    bundle_id          INT PRIMARY KEY AUTO_INCREMENT,
    customer_id        VARCHAR(100) NOT NULL,
    delivery_token     VARCHAR(36)  UNIQUE,
    delivery_recipient VARCHAR(100),
    delivery_phone     VARCHAR(20),
    delivery_address   VARCHAR(500),
    bundle_status      ENUM('SINGLE','MERGED') NOT NULL DEFAULT 'SINGLE',
    FOREIGN KEY (customer_id) REFERENCES customer(customer_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `order` (
    order_id         INT PRIMARY KEY AUTO_INCREMENT,
    session_id       INT          NOT NULL,
    customer_id      VARCHAR(100) NOT NULL,
    bundle_id        INT          NOT NULL,
    order_price      INT          NOT NULL,
    order_token      VARCHAR(36)  NOT NULL UNIQUE,
    ordered_at       DATETIME     NOT NULL DEFAULT NOW(),
    order_screenshot VARCHAR(500),
    paid_at          DATETIME,
    FOREIGN KEY (session_id)  REFERENCES live_session(session_id),
    FOREIGN KEY (customer_id) REFERENCES customer(customer_id),
    FOREIGN KEY (bundle_id)   REFERENCES delivery_bundle(bundle_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_order_session   ON `order`(session_id);
CREATE INDEX idx_order_customer  ON `order`(customer_id);
CREATE INDEX idx_order_bundle    ON `order`(bundle_id);
CREATE INDEX idx_bundle_customer ON delivery_bundle(customer_id);

-- ==================== 뷰 생성 ====================

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

-- ==================== 샘플 데이터 ====================

INSERT INTO live_session (session_date, session_title, session_status) VALUES
    ('2025-06-10', '여름 신상 원피스 라이브', 'ENDED'),
    ('2025-06-15', '악세서리 특가 라이브', 'ENDED'),
    ('2025-06-20', '여름 티셔츠 라이브', 'LIVE');

INSERT INTO customer (customer_id, customer_nickname) VALUES
    ('user_minjee',   '민지'),
    ('user_hana',     '하나'),
    ('user_soojin',   '수진'),
    ('user_yuna',     '유나'),
    ('user_jiwoo',    '지우');

INSERT INTO delivery_bundle (customer_id, delivery_token, delivery_recipient, delivery_phone, delivery_address, bundle_status) VALUES
    ('user_minjee', 'dt-aaa-111', '김민지', '010-1234-5678', '서울시 강남구 역삼동 123-4', 'SINGLE'),
    ('user_hana',   'dt-bbb-222', '이하나', '010-2345-6789', '서울시 마포구 합정동 56-7',  'MERGED'),
    ('user_soojin', NULL,         NULL,      NULL,            NULL,                         'SINGLE');

INSERT INTO delivery_bundle (customer_id, bundle_status) VALUES
    ('user_yuna',  'SINGLE'),
    ('user_jiwoo', 'SINGLE'),
    ('user_minjee','SINGLE');

INSERT INTO `order` (session_id, customer_id, bundle_id, order_price, order_token, ordered_at, order_screenshot, paid_at) VALUES
    (1, 'user_minjee', 1, 35000, 'ot-001-aaa', '2025-06-10 20:01:00', 'screenshots/ot-001.png', '2025-06-10 20:30:00'),
    (1, 'user_hana',   2, 42000, 'ot-002-bbb', '2025-06-10 20:03:00', 'screenshots/ot-002.png', '2025-06-10 20:35:00'),
    (1, 'user_hana',   2, 28000, 'ot-003-ccc', '2025-06-10 20:05:00', 'screenshots/ot-003.png', '2025-06-10 20:35:00'),
    (1, 'user_soojin', 3, 55000, 'ot-004-ddd', '2025-06-10 20:10:00', 'screenshots/ot-004.png', NULL);

INSERT INTO `order` (session_id, customer_id, bundle_id, order_price, order_token, ordered_at, order_screenshot, paid_at) VALUES
    (2, 'user_yuna',  4, 15000, 'ot-005-eee', '2025-06-15 19:30:00', 'screenshots/ot-005.png', '2025-06-15 19:50:00'),
    (2, 'user_jiwoo', 5, 22000, 'ot-006-fff', '2025-06-15 19:32:00', 'screenshots/ot-006.png', NULL);

INSERT INTO `order` (session_id, customer_id, bundle_id, order_price, order_token, ordered_at) VALUES
    (3, 'user_minjee', 6, 19000, 'ot-007-ggg', '2025-06-20 20:00:00');

-- ==================== 완료 확인 ====================
SELECT '테이블' AS type, TABLE_NAME AS name FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'live_order' AND TABLE_TYPE = 'BASE TABLE'
UNION ALL
SELECT '뷰', TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'live_order' AND TABLE_TYPE = 'VIEW';
