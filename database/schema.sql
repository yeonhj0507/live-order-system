-- ============================================================
-- 라이브 커머스 주문 관리 시스템 DDL
-- 4개 테이블: live_session, customer, delivery_bundle, order
-- ============================================================

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- 1. 라이브 세션
CREATE TABLE IF NOT EXISTS live_session (
    session_id      INTEGER PRIMARY KEY AUTOINCREMENT,
    session_date    TEXT    NOT NULL,                          -- ISO-8601 날짜
    session_title   TEXT    NOT NULL,
    session_status  TEXT    NOT NULL DEFAULT 'SCHEDULED'       -- SCHEDULED | LIVE | ENDED
        CHECK (session_status IN ('SCHEDULED', 'LIVE', 'ENDED'))
);

-- 2. 고객 (instagram_id를 PK로 사용)
CREATE TABLE IF NOT EXISTS customer (
    customer_id       TEXT PRIMARY KEY,                        -- instagram_id 그대로 사용
    customer_nickname TEXT NOT NULL
);

-- 3. 배송 묶음
CREATE TABLE IF NOT EXISTS delivery_bundle (
    bundle_id          INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id        TEXT    NOT NULL,
    delivery_token     TEXT    UNIQUE,                         -- UUID, 전액 입금 후 생성
    delivery_recipient TEXT,
    delivery_phone     TEXT,
    delivery_address   TEXT,
    bundle_status      TEXT    NOT NULL DEFAULT 'SINGLE'       -- SINGLE | MERGED
        CHECK (bundle_status IN ('SINGLE', 'MERGED')),
    FOREIGN KEY (customer_id) REFERENCES customer(customer_id)
);

-- 4. 주문
CREATE TABLE IF NOT EXISTS "order" (
    order_id         INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id       INTEGER NOT NULL,
    customer_id      TEXT    NOT NULL,
    bundle_id        INTEGER NOT NULL,
    order_price      INTEGER NOT NULL,                        -- 원 단위
    order_token      TEXT    NOT NULL UNIQUE,                  -- UUID, 주문 식별 토큰
    ordered_at       TEXT    NOT NULL DEFAULT (datetime('now', 'localtime')),
    order_screenshot TEXT,                                     -- 스크린샷 경로 (1장)
    paid_at          TEXT,                                     -- NULL이면 미입금
    FOREIGN KEY (session_id)  REFERENCES live_session(session_id),
    FOREIGN KEY (customer_id) REFERENCES customer(customer_id),
    FOREIGN KEY (bundle_id)   REFERENCES delivery_bundle(bundle_id)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_order_session    ON "order"(session_id);
CREATE INDEX IF NOT EXISTS idx_order_customer   ON "order"(customer_id);
CREATE INDEX IF NOT EXISTS idx_order_bundle     ON "order"(bundle_id);
CREATE INDEX IF NOT EXISTS idx_bundle_customer  ON delivery_bundle(customer_id);
