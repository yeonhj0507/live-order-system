import { useEffect, useState } from 'react';
import { api } from '../api';

export default function Bundles() {
  const [bundles, setBundles] = useState([]);
  const [showMerge, setShowMerge] = useState(false);
  const [mergeForm, setMergeForm] = useState({ customer_id: '', session_id: '' });
  const [sessions, setSessions] = useState([]);

  const load = () => api.getBundles().then(setBundles);
  useEffect(() => {
    load();
    api.getSessions().then(setSessions);
  }, []);

  const handleMerge = async (e) => {
    e.preventDefault();
    const result = await api.mergeBundles({
      customer_id: mergeForm.customer_id,
      session_id: Number(mergeForm.session_id),
    });
    alert(result.merged ? `${result.order_count}건이 번들 #${result.new_bundle_id}로 병합되었습니다` : result.message);
    setShowMerge(false);
    load();
  };

  const statusBadge = (b) => {
    if (b.delivery_token && b.delivery_recipient) return <span className="badge green">배송 준비</span>;
    if (b.delivery_token) return <span className="badge blue">배송지 대기</span>;
    return <span className="badge gray">{b.bundle_status}</span>;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-20">
        <h1>배송 관리</h1>
        <button className="btn btn-primary" onClick={() => setShowMerge(true)}>배송 묶기</button>
      </div>

      <table>
        <thead>
          <tr>
            <th>번들ID</th>
            <th>고객</th>
            <th>주문 수</th>
            <th>합계</th>
            <th>상태</th>
            <th>배송토큰</th>
            <th>수령인</th>
            <th>주소</th>
            <th>연락처</th>
          </tr>
        </thead>
        <tbody>
          {bundles.map(b => (
            <tr key={b.bundle_id}>
              <td>{b.bundle_id}</td>
              <td>{b.customer_nickname} <span className="text-sm text-muted">({b.customer_id})</span></td>
              <td>{b.order_count}건</td>
              <td>{b.total_price.toLocaleString()}원</td>
              <td>{statusBadge(b)}</td>
              <td className="text-sm">{b.delivery_token || '-'}</td>
              <td>{b.delivery_recipient || '-'}</td>
              <td className="text-sm">{b.delivery_address || '-'}</td>
              <td>{b.delivery_phone || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {showMerge && (
        <div className="modal-overlay" onClick={() => setShowMerge(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>배송 묶기 (번들 병합)</h2>
            <form onSubmit={handleMerge}>
              <div className="form-group">
                <label>고객 인스타 ID</label>
                <input type="text" value={mergeForm.customer_id} onChange={e => setMergeForm({...mergeForm, customer_id: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>현재 세션</label>
                <select value={mergeForm.session_id} onChange={e => setMergeForm({...mergeForm, session_id: e.target.value})} required>
                  <option value="">선택</option>
                  {sessions.map(s => (
                    <option key={s.session_id} value={s.session_id}>{s.session_title} ({s.session_date})</option>
                  ))}
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowMerge(false)}>취소</button>
                <button type="submit" className="btn btn-primary">병합</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
