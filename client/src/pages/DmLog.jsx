import { useEffect, useState } from 'react';
import { api } from '../api';

export default function DmLog() {
  const [logs, setLogs] = useState([]);

  useEffect(() => { api.getDmLog().then(setLogs); }, []);

  return (
    <div>
      <h1>DM 발송 로그</h1>
      <p className="text-muted mt-10 mb-20">Instagram Graph API Mock - 실제 DM 대신 로그로 기록됩니다</p>

      {logs.length === 0 ? (
        <div className="card"><p className="text-muted">아직 발송된 DM이 없습니다. 주문을 접수하거나 입금을 확인하면 DM 로그가 생성됩니다.</p></div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>수신자</th>
              <th>유형</th>
              <th>메시지</th>
              <th>발송시각</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log, i) => (
              <tr key={i}>
                <td>{log.to}</td>
                <td>
                  <span className={`badge ${log.type === 'PAYMENT_LINK' ? 'orange' : 'blue'}`}>
                    {log.type === 'PAYMENT_LINK' ? '결제 링크' : '배송지 링크'}
                  </span>
                </td>
                <td className="text-sm">{log.message}</td>
                <td className="text-sm">{log.sentAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
