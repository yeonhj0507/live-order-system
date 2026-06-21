import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

export default function Sessions() {
  const [sessions, setSessions] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ session_date: '', session_title: '' });

  const load = () => api.getSessions().then(setSessions);
  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    await api.createSession(form);
    setForm({ session_date: '', session_title: '' });
    setShowModal(false);
    load();
  };

  const handleStatus = async (id, status) => {
    await api.updateSessionStatus(id, status);
    load();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-20">
        <h1>라이브 세션</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ 새 세션</button>
      </div>

      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>날짜</th>
            <th>세션명</th>
            <th>상태</th>
            <th>주문</th>
            <th>매출</th>
            <th>입금률</th>
            <th>액션</th>
          </tr>
        </thead>
        <tbody>
          {sessions.map(s => (
            <tr key={s.session_id}>
              <td>{s.session_id}</td>
              <td>{s.session_date}</td>
              <td><Link to={`/sessions/${s.session_id}`}>{s.session_title}</Link></td>
              <td><SessionBadge status={s.session_status} /></td>
              <td>{s.total_orders}건</td>
              <td>{s.total_revenue.toLocaleString()}원</td>
              <td>{s.total_orders > 0 ? Math.round(s.paid_count / s.total_orders * 100) : 0}%</td>
              <td>
                <div className="flex gap-10">
                  {s.session_status === 'SCHEDULED' && (
                    <button className="btn btn-sm btn-primary" onClick={() => handleStatus(s.session_id, 'LIVE')}>시작</button>
                  )}
                  {s.session_status === 'LIVE' && (
                    <button className="btn btn-sm btn-danger" onClick={() => handleStatus(s.session_id, 'ENDED')}>종료</button>
                  )}
                  <Link to={`/sessions/${s.session_id}`} className="btn btn-sm btn-outline">상세</Link>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>새 라이브 세션</h2>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label>날짜</label>
                <input type="date" value={form.session_date} onChange={e => setForm({...form, session_date: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>세션명</label>
                <input type="text" value={form.session_title} onChange={e => setForm({...form, session_title: e.target.value})} placeholder="예: 여름 신상 라이브" required />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>취소</button>
                <button type="submit" className="btn btn-primary">생성</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function SessionBadge({ status }) {
  const map = { SCHEDULED: ['gray', '예정'], LIVE: ['blue', '진행중'], ENDED: ['green', '종료'] };
  const [color, label] = map[status] || ['gray', status];
  return <span className={`badge ${color}`}>{label}</span>;
}
