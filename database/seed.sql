-- ============================================================
-- 샘플 데이터
-- ============================================================

-- 라이브 세션
INSERT INTO live_session (session_date, session_title, session_status) VALUES
    ('2025-06-10', '여름 신상 원피스 라이브', 'ENDED'),
    ('2025-06-15', '악세서리 특가 라이브', 'ENDED'),
    ('2025-06-20', '여름 티셔츠 라이브', 'LIVE');

-- 고객
INSERT INTO customer (customer_id, customer_nickname) VALUES
    ('user_minjee',   '민지'),
    ('user_hana',     '하나'),
    ('user_soojin',   '수진'),
    ('user_yuna',     '유나'),
    ('user_jiwoo',    '지우');

-- 배송 묶음 (세션 1 주문들)
INSERT INTO delivery_bundle (customer_id, delivery_token, delivery_recipient, delivery_phone, delivery_address, bundle_status) VALUES
    ('user_minjee', 'dt-aaa-111', '김민지', '010-1234-5678', '서울시 강남구 역삼동 123-4', 'SINGLE'),
    ('user_hana',   'dt-bbb-222', '이하나', '010-2345-6789', '서울시 마포구 합정동 56-7',  'MERGED'),
    ('user_soojin', NULL,         NULL,      NULL,            NULL,                         'SINGLE');

-- 배송 묶음 (세션 2, 3)
INSERT INTO delivery_bundle (customer_id, bundle_status) VALUES
    ('user_yuna',  'SINGLE'),
    ('user_jiwoo', 'SINGLE'),
    ('user_minjee','SINGLE');

-- 주문 (세션 1 - 종료, 스크린샷 있음)
INSERT INTO "order" (session_id, customer_id, bundle_id, order_price, order_token, ordered_at, order_screenshot, paid_at) VALUES
    (1, 'user_minjee', 1, 35000, 'ot-001-aaa', '2025-06-10 20:01:00', 'screenshots/ot-001.png', '2025-06-10 20:30:00'),
    (1, 'user_hana',   2, 42000, 'ot-002-bbb', '2025-06-10 20:03:00', 'screenshots/ot-002.png', '2025-06-10 20:35:00'),
    (1, 'user_hana',   2, 28000, 'ot-003-ccc', '2025-06-10 20:05:00', 'screenshots/ot-003.png', '2025-06-10 20:35:00'),
    (1, 'user_soojin', 3, 55000, 'ot-004-ddd', '2025-06-10 20:10:00', 'screenshots/ot-004.png', NULL);

-- 주문 (세션 2 - 종료)
INSERT INTO "order" (session_id, customer_id, bundle_id, order_price, order_token, ordered_at, order_screenshot, paid_at) VALUES
    (2, 'user_yuna',  4, 15000, 'ot-005-eee', '2025-06-15 19:30:00', 'screenshots/ot-005.png', '2025-06-15 19:50:00'),
    (2, 'user_jiwoo', 5, 22000, 'ot-006-fff', '2025-06-15 19:32:00', 'screenshots/ot-006.png', NULL);

-- 주문 (세션 3 - 진행중, 스크린샷 없는 건 = PENDING)
INSERT INTO "order" (session_id, customer_id, bundle_id, order_price, order_token, ordered_at) VALUES
    (3, 'user_minjee', 6, 19000, 'ot-007-ggg', '2025-06-20 20:00:00');
