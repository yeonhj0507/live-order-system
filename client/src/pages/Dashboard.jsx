import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

export default function Dashboard() {
  const [sessions, setSessions] = useState([]);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    api.getSessions().then(setSessions);
    api.getOrders().then(setOrders);
  }, []);

  const totalRevenue = orders.reduce((s, o) => s + o.order_price, 0);
  const paidRevenue = orders.filter(o => o.paid_at).reduce((s, o) => s + o.order_price, 0);
  const unpaidCount = orders.filter(o => !o.paid_at).length;
  const activeSessions = sessions.filter(s => s.session_status === 'LIVE').length;

  return (
    <div>
      <h1>대시보드</h1>

      <div className="cards">
        <div className="card">
          <div className="label">총 매출</div>
          <div className="value">{totalRevenue.toLocaleString()}원</div>
        </div>
        <div className="card">
          <div className="label">입금 완료</div>
          <div className="value green">{paidRevenue.toLocaleString()}원</div>
        </div>
        <div className="card">
          <div className="label">미입금 건수</div>
          <div className="value red">{unpaidCount}건</div>
        </div>
        <div className="card">
          <div className="label">진행 중 세션</div>
          <div className="value blue">{activeSessions}개</div>
        </div>
      </div>

      <h2 className="mb-20">최근 세션</h2>
      <table>
        <thead>
          <tr>
            <th>날짜</th>
            <th>세션명</th>
            <th>상태</th>
            <th>주문 수</th>
            <th>총 매출</th>
            <th>입금</th>
          </tr>
        </thead>
        <tbody>
          {sessions.map(s => (
            <tr key={s.session_id}>
              <td>{s.session_date}</td>
              <td><Link to={`/sessions/${s.session_id}`}>{s.session_title}</Link></td>
              <td><StatusBadge status={s.session_status} /></td>
              <td>{s.total_orders}</td>
              <td>{s.total_revenue.toLocaleString()}원</td>
              <td>{s.paid_count} / {s.total_orders}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = { SCHEDULED: ['gray', '예정'], LIVE: ['blue', '진행중'], ENDED: ['green', '종료'] };
  const [color, label] = map[status] || ['gray', status];
  return <span className={`badge ${color}`}>{label}</span>;
}
