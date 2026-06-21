import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api';

export default function DeliveryForm() {
  const { token } = useParams();
  const [bundle, setBundle] = useState(null);
  const [form, setForm] = useState({ delivery_recipient: '', delivery_phone: '', delivery_address: '' });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getBundleByToken(token)
      .then(data => {
        setBundle(data);
        if (data.delivery_recipient) {
          setForm({
            delivery_recipient: data.delivery_recipient,
            delivery_phone: data.delivery_phone,
            delivery_address: data.delivery_address,
          });
          setSubmitted(true);
        }
      })
      .catch(() => setError('유효하지 않은 배송 토큰입니다'));
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await api.saveAddress(token, form);
    setSubmitted(true);
  };

  if (error) return <div><h1>오류</h1><p>{error}</p></div>;
  if (!bundle) return <div>로딩 중...</div>;

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <h1>배송지 입력</h1>
      <p className="text-muted mt-10 mb-20">
        {bundle.customer_nickname}님의 주문 {bundle.orders?.length}건 (번들 #{bundle.bundle_id})
      </p>

      {bundle.orders && (
        <table className="mb-20">
          <thead><tr><th>주문ID</th><th>금액</th><th>주문일</th></tr></thead>
          <tbody>
            {bundle.orders.map(o => (
              <tr key={o.order_id}>
                <td>{o.order_id}</td>
                <td>{o.order_price.toLocaleString()}원</td>
                <td className="text-sm">{o.ordered_at}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {submitted ? (
        <div className="card">
          <p style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>배송지가 등록되었습니다</p>
          <p><strong>수령인:</strong> {form.delivery_recipient}</p>
          <p><strong>연락처:</strong> {form.delivery_phone}</p>
          <p><strong>주소:</strong> {form.delivery_address}</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="card">
          <div className="form-group">
            <label>수령인</label>
            <input type="text" value={form.delivery_recipient} onChange={e => setForm({...form, delivery_recipient: e.target.value})} required />
          </div>
          <div className="form-group">
            <label>연락처</label>
            <input type="tel" value={form.delivery_phone} onChange={e => setForm({...form, delivery_phone: e.target.value})} placeholder="010-0000-0000" required />
          </div>
          <div className="form-group">
            <label>배송 주소</label>
            <input type="text" value={form.delivery_address} onChange={e => setForm({...form, delivery_address: e.target.value})} required />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>배송지 등록</button>
        </form>
      )}
    </div>
  );
}
