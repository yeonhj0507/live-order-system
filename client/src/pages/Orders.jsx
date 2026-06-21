import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => { api.getOrders().then(setOrders); }, []);

  const filtered = filter === 'ALL' ? orders : orders.filter(o => o.order_status === filter);

  const handleScreenshot = async (orderId) => {
    await api.markScreenshot(orderId);
    api.getOrders().then(setOrders);
  };

  const handlePay = async (orderId) => {
    const result = await api.payOrder(orderId);
    if (result.all_paid && result.delivery_token) {
      alert(`전액 입금 완료! 배송지 입력 토큰: ${result.delivery_token}`);
    }
    api.getOrders().then(setOrders);
  };

  return (
    <div>
      <h1>주문 관리</h1>

      <div className="flex gap-10 mb-20 mt-20" style={{ flexWrap: 'wrap' }}>
        {['ALL', 'PENDING', 'UNPAID', 'PAID', 'PAID_BUNDLED', 'AWAITING_ADDRESS', 'READY_TO_SHIP'].map(f => (
          <button
            key={f}
            className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setFilter(f)}
          >
            {f === 'ALL' ? '전체' : { PENDING: '확인 대기', UNPAID: '미입금', PAID: '입금완료', PAID_BUNDLED: '입금(묶음)', AWAITING_ADDRESS: '배송지 대기', READY_TO_SHIP: '배송 준비' }[f]}
            {f !== 'ALL' && ` (${orders.filter(o => o.order_status === f).length})`}
          </button>
        ))}
      </div>

      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>세션</th>
            <th>고객</th>
            <th>금액</th>
            <th>주문토큰</th>
            <th>주문시각</th>
            <th>상태</th>
            <th>액션</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(o => (
            <tr key={o.order_id}>
              <td>{o.order_id}</td>
              <td><Link to={`/sessions/${o.session_id}`}>#{o.session_id}</Link></td>
              <td>{o.customer_nickname}</td>
              <td>{o.order_price.toLocaleString()}원</td>
              <td className="text-sm">{o.order_token}</td>
              <td className="text-sm">{o.ordered_at}</td>
              <td><OrderBadge status={o.order_status} /></td>
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
