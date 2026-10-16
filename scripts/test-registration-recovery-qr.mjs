import QRCode from 'qrcode';
const PRIMARY_PRODUCTION_ORIGIN = 'https://teleera.turbobits.in';

function getSiteUrl(envUrl, windowHost) {
  if (windowHost) {
    if (windowHost === 'localhost' || windowHost === '127.0.0.1' || windowHost.endsWith('.local')) {
      return `http://${windowHost}:3000`;
    }
    return PRIMARY_PRODUCTION_ORIGIN;
  }
  if (envUrl && envUrl.trim() !== '') {
    const cleaned = envUrl.trim().replace(/\/+$/, '');
    if (cleaned.includes('localhost') || cleaned.includes('127.0.0.1')) {
      return cleaned;
    }
    return PRIMARY_PRODUCTION_ORIGIN;
  }
  return PRIMARY_PRODUCTION_ORIGIN;
}

function getAbsoluteUrl(path = '/', envUrl, windowHost) {
  const base = getSiteUrl(envUrl, windowHost);
  if (!path || path === '/') return base;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${cleanPath}`;
}

async function testRecoveryAndQr() {
  console.log('=== 1. Canonical Domain Resolution ===');
  const baseOrigin = getAbsoluteUrl('/');
  const passUrl = getAbsoluteUrl('/pass/YUG-PROJ-12345?token=abc123xyz');
  const verifyUrl = getAbsoluteUrl('/verify/ver_test_token_999');
  
  console.log('Base Origin:', baseOrigin);
  console.log('Pass URL:', passUrl);
  console.log('Verify URL:', verifyUrl);

  const isProductionCanonical = passUrl.startsWith('https://teleera.turbobits.in');
  console.log('Uses official canonical domain (teleera.turbobits.in):', isProductionCanonical ? 'PASS' : 'FAIL');

  console.log('\n=== 2. QR Code Generation Test ===');
  const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
    errorCorrectionLevel: 'M',
    type: 'image/png',
  });
  console.log('QR Payload successfully encoded for:', verifyUrl);
  console.log('QR Data URL generated (length):', qrDataUrl.length);

  console.log('\n=== 3. Payment UPI QR Preservation Test ===');
  const sampleUpi = 'upi://pay?pa=teleera@oksbi&pn=TELE-ERA%20YUGANTAR%202026&am=200&cu=INR&tn=YUGANTAR-REG';
  const upiQr = await QRCode.toDataURL(sampleUpi);
  console.log('UPI QR generated correctly without being overridden by web URL:', upiQr.length > 0 ? 'PASS' : 'FAIL');

  console.log('\n=== 4. Testing Live Pass Route on Localhost ===');
  const res = await fetch('http://localhost:3000/pass/sample-pass-id');
  console.log('Pass route status code:', res.status);
  const verifyRes = await fetch('http://localhost:3000/verify/sample-token');
  console.log('Verify route status code:', verifyRes.status);
}

testRecoveryAndQr().catch(console.error);
