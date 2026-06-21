import { useEffect, useState } from 'react';
import { api } from '../api';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);

  useEffect(() => { api.getCustomers().then(setCustomers); }, []);

  const handleSelect = async (id) => {
    if (selected === id) { setSelected(null); setDetail(null); return; }
    setSelected(id);
    const data = await api.getCustomer(id);
    setDetail(data);
  };

  return (
    <div>
      <h1>고객 관리</h1>
      <table className="mt-20">
        <thead>
          <tr>
            <th>인스타 ID</th>
            <th>닉네임</th>
            <th>주문 수</th>
            <th>총 구매액</th>
          </tr>
        </thead>
        <tbody>
          {customers.map(c => (
            <>
              <tr key={c.customer_id} onClick={() => handleSelect(c.customer_id)} style={{ cursor: 'pointer' }}>
                <td>{c.customer_id}</td>
                <td>{c.customer_nickname}</td>
                <td>{c.order_count}건</td>
                <td>{c.total_spent.toLocaleString()}원</td>
              </tr>
              {selected === c.customer_id && detail && (
                <tr key={c.customer_id + '_detail'}>
                  <td colSpan={4} style={{ padding: '16px', background: '#f9f9fb' }}>
                    <strong>{detail.customer_nickname}님의 주문 내역</strong>
                    <table className="mt-10">
                      <thead>
                        <tr><th>주문ID</th><th>세션</th><th>금액</th><th>상태</th><th>주문일</th></tr>
                      </thead>
                      <tbody>
                        {detail.orders.map(o => (
                          <tr key={o.order_id}>
                            <td>{o.order_id}</td>
                            <td>#{o.session_id}</td>
                            <td>{o.order_price.toLocaleString()}원</td>
                            <td><OrderBadge status={o.order_status} /></td>
                            <td className="text-sm">{o.ordered_at}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </td>
                </tr>
              )}
            </>
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
