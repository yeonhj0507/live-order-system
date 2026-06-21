-- ============================================================
-- 라이브 커머스 주문 관리 시스템 DDL (MySQL)
-- 4개 테이블: live_session, customer, delivery_bundle, order
-- ============================================================

CREATE TABLE IF NOT EXISTS live_session (
    session_id      INT PRIMARY KEY AUTO_INCREMENT,
    session_date    DATE         NOT NULL,
    session_title   VARCHAR(200) NOT NULL,
    session_status  ENUM('SCHEDULED','LIVE','ENDED') NOT NULL DEFAULT 'SCHEDULED'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS customer (
    customer_id       VARCHAR(100) PRIMARY KEY,
    customer_nickname VARCHAR(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS delivery_bundle (
    bundle_id          INT PRIMARY KEY AUTO_INCREMENT,
    customer_id        VARCHAR(100) NOT NULL,
    delivery_token     VARCHAR(36)  UNIQUE,
    delivery_recipient VARCHAR(100),
    delivery_phone     VARCHAR(20),
    delivery_address   VARCHAR(500),
    bundle_status      ENUM('SINGLE','MERGED') NOT NULL DEFAULT 'SINGLE',
    FOREIGN KEY (customer_id) REFERENCES customer(customer_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `order` (
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

-- 인덱스
CREATE INDEX idx_order_session   ON `order`(session_id);
CREATE INDEX idx_order_customer  ON `order`(customer_id);
CREATE INDEX idx_order_bundle    ON `order`(bundle_id);
CREATE INDEX idx_bundle_customer ON delivery_bundle(customer_id);
