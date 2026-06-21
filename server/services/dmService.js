// Mock Instagram DM 서비스
// 실제 구현 시 Instagram Graph API로 대체

const dmLog = [];

function sendPaymentLink(customerId, orderToken) {
  const msg = {
    to: customerId,
    type: 'PAYMENT_LINK',
    message: `주문이 접수되었습니다. 결제 링크: /order/${orderToken}`,
    sentAt: new Date().toISOString(),
  };
  dmLog.push(msg);
  console.log(`[DM → ${customerId}] ${msg.message}`);
  return msg;
}

function sendDeliveryLink(customerId, deliveryToken) {
  const msg = {
    to: customerId,
    type: 'DELIVERY_LINK',
    message: `결제가 완료되었습니다. 배송지 입력 링크: /delivery/${deliveryToken}`,
    sentAt: new Date().toISOString(),
  };
  dmLog.push(msg);
  console.log(`[DM → ${customerId}] ${msg.message}`);
  return msg;
}

function getLog() {
  return dmLog;
}

module.exports = { sendPaymentLink, sendDeliveryLink, getLog };
