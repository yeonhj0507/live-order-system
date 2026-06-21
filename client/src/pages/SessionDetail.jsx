import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api';

export default function SessionDetail() {
  const { id } = useParams();
  const [session, setSession] = useState(null);
  const [orders, setOrders] = useState([]);
  const [quickId, setQuickId] = useState('');
  const [quickPrice, setQuickPrice] = useState('');
  const [lastResult, setLastResult] = useState(null);
  const idRef = useRef(null);

  const load = () => {
    api.getSession(id).then(setSession);
    api.getSessionOrders(id).then(setOrders);
  };
  useEffect(() => { load(); }, [id]);

  const handleQuickOrder = async (e) => {
    e.preventDefault();
    if (!quickId.trim() || !quickPrice) return;
    try {
      const result = await api.createOrder({
        session_id: Number(id),
        customer_id: quickId.trim(),
        customer_nickname: quickId.trim(),
        order_price: Number(quickPrice),
      });
      setLastResult({ ok: true, id: quickId.trim(), price: Number(quickPrice), token: result.order_token });
      setQuickId('');
      setQuickPrice('');
      idRef.current?.focus();
      load();
    } catch (err) {
      setLastResult({ ok: false, message: err.message });
    }
  };

  const handleScreenshot = async (orderId) => {
    await api.markScreenshot(orderId);
    load();
  };

  const handlePay = async (orderId) => {
    const result = await api.payOrder(orderId);
    if (result.all_paid && result.delivery_token) {
      alert(`전액 입금 완료! 배송지 입력 토큰: ${result.delivery_token}`);
    }
    load();
  };

  const handleCsvExport = async () => {
    const blob = await api.downloadCsv(id);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `session_${id}_delivery.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!session) return <div>로딩 중...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-20">
        <div>
          <Link to="/sessions" className="text-sm text-muted">&larr; 세션 목록</Link>
          <h1 className="mt-10">{session.session_title}</h1>
          <p className="text-sm text-muted">{session.session_date} &middot; <SessionBadge status={session.session_status} /></p>
        </div>
        <div className="flex gap-10">
          <button className="btn btn-outline" onClick={handleCsvExport}>CSV 내보내기</button>
        </div>
      </div>

      {/* 간편등록: 인스타 ID + 금액만 입력, 엔터로 즉시 접수 */}
      <div className="card mb-20" style={{ background: '#f0f4ff', border: '2px solid #0071e3' }}>
        <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 14 }}>간편 주문 접수</div>
        <form onSubmit={handleQuickOrder} className="flex gap-10 items-center" style={{ flexWrap: 'wrap' }}>
          <input
            ref={idRef}
            type="text"
            value={quickId}
            onChange={e => setQuickId(e.target.value)}
            placeholder="인스타 ID"
            required
            style={{ padding: '10px 12px', border: '1px solid #d2d2d7', borderRadius: 8, fontSize: 14, width: 200 }}
          />
          <input
            type="number"
            value={quickPrice}
            onChange={e => setQuickPrice(e.target.value)}
            placeholder="금액 (원)"
            required
            min="1"
            style={{ padding: '10px 12px', border: '1px solid #d2d2d7', borderRadius: 8, fontSize: 14, width: 160 }}
          />
          <button type="submit" className="btn btn-primary">접수</button>
          <span className="text-sm text-muted">ID + 금액 입력 후 Enter</span>
        </form>
        {lastResult && (
          <div className="mt-10 text-sm" style={{ color: lastResult.ok ? '#1b7d3a' : '#c0392b' }}>
            {lastResult.ok
              ? `${lastResult.id} | ${lastResult.price.toLocaleString()}원 접수 완료 → DM 발송됨`
              : `오류: ${lastResult.message}`}
          </div>
        )}
      </div>

      <div className="cards">
        <div className="card">
          <div className="label">총 주문</div>
          <div className="value">{session.total_orders}건</div>
        </div>
        <div className="card">
          <div className="label">총 매출</div>
          <div className="value">{session.total_revenue.toLocaleString()}원</div>
        </div>
        <div className="card">
          <div className="label">입금 완료</div>
          <div className="value green">{session.paid_count}건</div>
        </div>
        <div className="card">
          <div className="label">미입금</div>
          <div className="value red">{session.unpaid_count}건</div>
        </div>
      </div>

      <h2 className="mb-20">주문 목록</h2>
      <table>
        <thead>
          <tr>
            <th>주문ID</th>
            <th>고객</th>
            <th>금액</th>
            <th>주문토큰</th>
            <th>주문시각</th>
            <th>상태</th>
            <th>번들</th>
            <th>액션</th>
          </tr>
        </thead>
        <tbody>
          {orders.map(o => (
            <tr key={o.order_id}>
              <td>{o.order_id}</td>
              <td>{o.customer_nickname} <span className="text-sm text-muted">({o.customer_id})</span></td>
              <td>{o.order_price.toLocaleString()}원</td>
              <td className="text-sm">{o.order_token}</td>
              <td className="text-sm">{o.ordered_at}</td>
              <td><OrderBadge status={o.order_status} /></td>
              <td>#{o.bundle_id} <span className="text-sm text-muted">({o.bundle_status})</span></td>
              <td>
                <div className="flex gap-10">
                  {o.order_status === 'PENDING' && (
                    <button className="btn btn-sm btn-outline" onClick={() => handleScreenshot(o.order_id)}>캡처 확인</button>
                  )}
                  {(o.order_status === 'UNPAID' || o.order_status === 'PENDING') && (
                    <button className="btn btn-sm btn-success" onClick={() => handlePay(o.order_id)}>입금 확인</button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SessionBadge({ status }) {
  const map = { SCHEDULED: ['gray', '예정'], LIVE: ['blue', '진행중'], ENDED: ['green', '종료'] };
  const [color, label] = map[status] || ['gray', status];
  return <span className={`badge ${color}`}>{label}</span>;
}

function OrderBadge({ status }) {
  const map = {
    PENDING: ['gray', '확인 대기'],
    UNPAID: ['red', '미입금'],
    PAID: ['orange', '입금완료'],
    PAID_BUNDLED: ['orange', '입금(묶음)'],
    AWAITING_ADDRESS: ['blue', '배송지 대기'],
    READY_TO_SHIP: ['green', '배송 준비'],
  };
  const [color, label] = map[status] || ['gray', status];
  return <span className={`badge ${color}`}>{label}</span>;
}
