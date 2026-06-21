import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api';

export default function OrderView() {
  const { token } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getOrderByToken(token)
      .then(setOrder)
      .catch(() => setError('유효하지 않은 주문 링크입니다'));
  }, [token]);

  if (error) return (
    <div style={{ maxWidth: 480, margin: '60px auto', textAlign: 'center' }}>
      <h1>주문 조회 실패</h1>
      <p className="text-muted mt-10">{error}</p>
    </div>
  );

  if (!order) return <div style={{ textAlign: 'center', marginTop: 60 }}>로딩 중...</div>;

  const isPaid = !!order.paid_at;

  return (
    <div style={{ maxWidth: 480, margin: '40px auto' }}>
      <h1>주문 확인</h1>
      <p className="text-muted mt-10 mb-20">주문 토큰: {order.order_token}</p>

      <div className="card mb-20">
        <table style={{ width: '100%' }}>
          <tbody>
            <tr><td className="text-muted" style={{ width: 100 }}>고객</td><td><strong>{order.customer_nickname}</strong> ({order.customer_id})</td></tr>
            <tr><td className="text-muted">주문 금액</td><td><strong style={{ fontSize: 20 }}>{order.order_price.toLocaleString()}원</strong></td></tr>
            <tr><td className="text-muted">주문 시각</td><td>{order.ordered_at}</td></tr>
            <tr><td className="text-muted">결제 상태</td><td>{isPaid ? <span className="badge green">입금 완료</span> : <span className="badge red">미입금</span>}</td></tr>
            {isPaid && <tr><td className="text-muted">입금 시각</td><td>{order.paid_at}</td></tr>}
          </tbody>
        </table>
      </div>

      {!isPaid && (
        <div className="card" style={{ background: '#fff8e5', border: '1px solid #f0c040' }}>
          <p style={{ fontWeight: 600, marginBottom: 8 }}>입금 안내</p>
          <p className="text-sm">위 금액을 입금해 주세요. 입금 확인 후 배송지 입력 링크가 DM으로 발송됩니다.</p>
        </div>
      )}

      {isPaid && order.delivery_token && (
        <div className="card" style={{ background: '#e8f8ee', border: '1px solid #34c759' }}>
          <p style={{ fontWeight: 600, marginBottom: 8 }}>입금이 확인되었습니다</p>
          <p className="text-sm">DM으로 발송된 배송지 입력 링크에서 배송 정보를 입력해 주세요.</p>
        </div>
      )}
    </div>
  );
}
