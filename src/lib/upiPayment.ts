/**
 * UPI Payment Helpers — YUGANTAR 2026
 *
 * Implements strict, standard UPI URI construction, fee extraction,
 * and VPA validation compliant with NPCI UPI 2.0 specifications.
 */

export interface UpiPaymentConfig {
  upiId: string;
  payeeName: string;
  amount?: string | number | null;
  isFeeFixed?: boolean;
  transactionNote?: string;
  currency?: string;
}

/**
 * Validates whether a given string is a valid UPI VPA (Virtual Payment Address).
 * Standard format: username@bankhandle (e.g. teleera@oksbi, student@okhdfcbank, admin@icici).
 */
export function isValidUpiId(upiId: string | null | undefined): boolean {
  if (!upiId) return false;
  const trimmed = upiId.trim();
  // Standard VPA regex: allows alphanumeric, dots, hyphens, underscores before '@', and alphabet handle after
  const vpaRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
  return vpaRegex.test(trimmed);
}

/**
 * Cleanly extracts numeric INR amount from various fee string formats.
 * Examples:
 *   "₹300 per team" -> "300.00"
 *   "₹100 per person / ₹150 team" -> "100.00" (extracts base fee)
 *   "250" -> "250.00"
 *   "Free" -> null
 */
export function extractNumericFee(feeString: string | null | undefined): string | null {
  if (!feeString) return null;
  const str = feeString.trim();
  if (str.toLowerCase() === 'free' || str === '0') return null;

  // Match the first numeric sequence
  const match = str.match(/(\d+(?:\.\d{1,2})?)/);
  if (!match) return null;

  const num = parseFloat(match[1]);
  if (isNaN(num) || num <= 0) return null;

  return num.toFixed(2);
}

/**
 * Generates an authoritative, standard UPI payment URI using URLSearchParams.
 * Guarantees zero unescaped concatenation or corrupted queries.
 *
 * Format:
 *   upi://pay?pa=PAYEE_VPA&pn=PAYEE_NAME&am=300.00&cu=INR&tn=TRANSACTION_NOTE
 */
export function buildUpiPaymentUri(config: UpiPaymentConfig): string {
  const {
    upiId,
    payeeName,
    amount,
    isFeeFixed = true,
    transactionNote,
    currency = 'INR',
  } = config;

  const cleanUpi = (upiId || '').trim();
  const cleanPayee = (payeeName || 'TELE-ERA YUGANTAR 2026').trim();

  const params = new URLSearchParams();
  params.set('pa', cleanUpi);
  params.set('pn', cleanPayee);

  // If fixed fee is enabled, resolve numeric amount
  if (isFeeFixed !== false && amount !== null && amount !== undefined) {
    const numericStr =
      typeof amount === 'number'
        ? amount.toFixed(2)
        : extractNumericFee(String(amount));
    if (numericStr) {
      params.set('am', numericStr);
    }
  }

  params.set('cu', currency);

  if (transactionNote) {
    params.set('tn', transactionNote.trim().slice(0, 80));
  }

  return `upi://pay?${params.toString()}`;
}
