import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';

export default function DmSimulator() {
  const [logs, setLogs] = useState([]);
  const [selected, setSelected] = useState(null);
  const navigate = useNavigate();
  const bottomRef = useRef(null);

  const load = () => api.getDmLog().then(setLogs);
  useEffect(() => { load(); const t = setInterval(load, 2000); return () => clearInterval(t); }, []);

  const customers = [...new Set(logs.map(l => l.to))];
  const conversation = selected ? logs.filter(l => l.to === selected) : [];

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [conversation.length]);

  const extractLink = (msg) => {
    const match = msg.match(/\/(order|delivery)\/([^\s]+)/);
    if (match) return { type: match[1], path: `/${match[1]}/${match[2]}` };
    return null;
  };

  return (
    <div>
      <h1>DM 시뮬레이터</h1>
      <p className="text-sm text-muted mt-10 mb-20">Instagram DM을 시뮬레이션합니다. 고객을 선택하고 링크를 클릭하면 고객 화면으로 이동합니다.</p>

      <div style={styles.container}>
        {/* 고객 목록 */}
        <div style={styles.sidebar}>
          <div style={styles.sidebarHeader}>받은 DM</div>
          {customers.length === 0 && (
            <div style={styles.empty}>아직 발송된 DM이 없습니다.<br/>주문을 접수하면 DM이 생성됩니다.</div>
          )}
          {customers.map(c => {
            const msgs = logs.filter(l => l.to === c);
            const last = msgs[msgs.length - 1];
            return (
              <div
                key={c}
                style={{ ...styles.contact, ...(selected === c ? styles.contactActive : {}) }}
                onClick={() => setSelected(c)}
              >
                <div style={styles.avatar}>{c.charAt(0).toUpperCase()}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={styles.contactName}>@{c}</div>
                  <div style={styles.contactPreview}>
                    {last?.type === 'PAYMENT_LINK' ? '결제 링크 발송됨' : '배송지 입력 링크 발송됨'}
                  </div>
                </div>
                <div style={styles.badge}>{msgs.length}</div>
              </div>
            );
          })}
        </div>

        {/* 대화 영역 */}
        <div style={styles.chat}>
          {!selected ? (
            <div style={styles.chatEmpty}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>{'<-'}</div>
              <div>고객을 선택하세요</div>
            </div>
          ) : (
            <>
              <div style={styles.chatHeader}>
                <div style={styles.avatar}>{selected.charAt(0).toUpperCase()}</div>
                <div>
                  <div style={{ fontWeight: 600 }}>@{selected}</div>
                  <div style={{ fontSize: 12, color: '#86868b' }}>Instagram DM</div>
                </div>
              </div>

              <div style={styles.messages}>
                {conversation.map((msg, i) => (
                  <div key={i} style={styles.msgWrapper}>
                    {/* 셀러(시스템) → 고객 메시지 */}
                    <div style={styles.msgBubble}>
                      <div style={styles.msgType}>
                        {msg.type === 'PAYMENT_LINK' ? '결제 안내' : '배송지 입력 안내'}
                      </div>

                      {msg.type === 'PAYMENT_LINK' ? (
                        <div>
                          <p style={{ marginBottom: 10 }}>주문이 접수되었습니다.</p>
                          <p style={{ marginBottom: 12 }}>아래 링크에서 주문 내용을 확인하고 안내에 따라 입금해 주세요.</p>
                          {(() => {
                            const link = extractLink(msg.message);
                            return link && (
                              <button
                                style={styles.linkBtn}
                                onClick={() => navigate(link.path)}
                              >
                                주문 확인 / 결제하기
                              </button>
                            );
                          })()}
                        </div>
                      ) : (
                        <div>
                          <p style={{ marginBottom: 10 }}>결제가 확인되었습니다. 감사합니다!</p>
                          <p style={{ marginBottom: 12 }}>아래 링크에서 배송지 정보를 입력해 주세요.</p>
                          {(() => {
                            const link = extractLink(msg.message);
                            return link && (
                              <button
                                style={styles.linkBtn}
                                onClick={() => navigate(link.path)}
                              >
                                배송지 입력하기
                              </button>
                            );
                          })()}
                        </div>
                      )}

                      <div style={styles.msgTime}>
                        {new Date(msg.sentAt).toLocaleString('ko-KR')}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    height: 'calc(100vh - 180px)',
    background: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    boxShadow: '0 2px 12px rgba(0,0,0,.08)',
  },
  sidebar: {
    width: 280,
    borderRight: '1px solid #e5e5e5',
    overflowY: 'auto',
    flexShrink: 0,
  },
  sidebarHeader: {
    padding: '16px 20px',
    fontWeight: 700,
    fontSize: 15,
    borderBottom: '1px solid #e5e5e5',
    background: '#fafafa',
  },
  empty: {
    padding: 24,
    textAlign: 'center',
    color: '#86868b',
    fontSize: 13,
    lineHeight: 1.6,
  },
  contact: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '14px 16px',
    cursor: 'pointer',
    borderBottom: '1px solid #f0f0f0',
    transition: 'background .1s',
  },
  contactActive: {
    background: '#e8f0fe',
  },
  contactName: {
    fontWeight: 600,
    fontSize: 14,
  },
  contactPreview: {
    fontSize: 12,
    color: '#86868b',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: 16,
    flexShrink: 0,
  },
  badge: {
    background: '#0071e3',
    color: '#fff',
    borderRadius: 10,
    padding: '2px 8px',
    fontSize: 11,
    fontWeight: 600,
  },
  chat: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  chatEmpty: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#86868b',
    fontSize: 15,
  },
  chatHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '14px 20px',
    borderBottom: '1px solid #e5e5e5',
    background: '#fafafa',
  },
  messages: {
    flex: 1,
    overflowY: 'auto',
    padding: '20px',
    background: '#f5f5f7',
  },
  msgWrapper: {
    display: 'flex',
    justifyContent: 'flex-start',
    marginBottom: 16,
  },
  msgBubble: {
    maxWidth: 360,
    background: '#fff',
    borderRadius: '4px 16px 16px 16px',
    padding: '14px 18px',
    boxShadow: '0 1px 3px rgba(0,0,0,.06)',
    fontSize: 14,
    lineHeight: 1.5,
  },
  msgType: {
    fontSize: 11,
    fontWeight: 700,
    color: '#0071e3',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  msgTime: {
    fontSize: 11,
    color: '#86868b',
    marginTop: 10,
    textAlign: 'right',
  },
  linkBtn: {
    display: 'block',
    width: '100%',
    padding: '10px 16px',
    background: '#0071e3',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    textAlign: 'center',
  },
};
