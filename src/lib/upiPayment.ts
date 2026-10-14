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

export interface CompetitionFeeValidation {
  isValid: boolean;
  isPaid: boolean;
  numericAmount: string | null;
  displayFee: string;
  errorMessage?: string;
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
 * Supports compound tier formats (e.g. "₹100 per person / ₹150 team") based on teamSize.
 *
 * Examples:
 *   "₹300 per team" -> "300.00"
 *   "₹100 per person / ₹150 team", teamSize=1 -> "100.00"
 *   "₹100 per person / ₹150 team", teamSize=2 -> "150.00"
 *   "250" -> "250.00"
 *   "Free" -> null
 */
export function extractNumericFee(
  feeString: string | null | undefined,
  teamSize?: string | number,
): string | null {
  if (!feeString) return null;
  const str = feeString.trim();
  if (str.toLowerCase() === 'free' || str === '0') return null;

  // If a compound fee string like "₹100 per person / ₹150 team" is provided with a team size:
  if (teamSize !== undefined && teamSize !== null && str.includes('/')) {
    const isTeam = Number(teamSize) > 1 || String(teamSize).toLowerCase().includes('team');
    const parts = str.split('/');
    const targetPart = isTeam ? (parts[1] || parts[0]) : parts[0];
    const tierMatch = targetPart.match(/(\d+(?:\.\d{1,2})?)/);
    if (tierMatch) {
      const num = parseFloat(tierMatch[1]);
      if (!isNaN(num) && num > 0) return num.toFixed(2);
    }
  }

  // Standard match for the primary numeric sequence
  const match = str.match(/(\d+(?:\.\d{1,2})?)/);
  if (!match) return null;

  const num = parseFloat(match[1]);
  if (isNaN(num) || num <= 0) return null;

  return num.toFixed(2);
}

/**
 * Validates a competition's payment configuration to prevent misleading QR codes,
 * silent fee substitution, or unconfigured paid tracks.
 */
export function validateCompetitionFee(
  isPaid: boolean,
  registrationFee: string | null | undefined,
  upiId?: string | null | undefined,
  teamSize?: string | number,
): CompetitionFeeValidation {
  if (!isPaid) {
    return {
      isValid: true,
      isPaid: false,
      numericAmount: null,
      displayFee: 'Free',
    };
  }

  const cleanFee = (registrationFee || '').trim();
  if (!cleanFee || cleanFee.toLowerCase() === 'free' || cleanFee === '0') {
    return {
      isValid: false,
      isPaid: true,
      numericAmount: null,
      displayFee: cleanFee || 'Fee Not Configured',
      errorMessage:
        'This competition is designated as a paid arena, but its registration fee has not been configured. Please contact the arena coordinators.',
    };
  }

  const numeric = extractNumericFee(cleanFee, teamSize);
  if (!numeric || parseFloat(numeric) <= 0) {
    return {
      isValid: false,
      isPaid: true,
      numericAmount: null,
      displayFee: cleanFee,
      errorMessage: `The configured registration fee "${cleanFee}" could not be parsed into a valid INR amount. Please contact coordinators.`,
    };
  }

  if (!isValidUpiId(upiId)) {
    return {
      isValid: false,
      isPaid: true,
      numericAmount: numeric,
      displayFee: cleanFee,
      errorMessage:
        'The recipient UPI address (VPA) for this competition is missing or invalid. Please contact the coordinators.',
    };
  }

  return {
    isValid: true,
    isPaid: true,
    numericAmount: numeric,
    displayFee: cleanFee,
  };
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
