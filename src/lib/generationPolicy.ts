import { db } from '@/lib/db';

export interface GenerationPolicyResult {
  allowed: boolean;
  reason?: string;
}

/**
 * Checks if pass generation and downloads are permitted.
 * Hierarchical Policy:
 * 1. Global Master Switch: pass_certificate_generation_global_open must be ON ('1').
 * 2. Pass Sub-Switch: pass_generation_global_open must be ON ('1').
 * 3. Competition Switch: If a competitionSlug is given, competitions.pass_enabled must be true.
 */
export async function isPassGenerationAllowed(
  competitionSlug?: string
): Promise<GenerationPolicyResult> {
  try {
    const settings = await db.query<{ setting_key: string; setting_value: string }>(
      `SELECT setting_key, setting_value FROM site_settings 
       WHERE setting_key IN ('pass_certificate_generation_global_open', 'pass_generation_global_open')`
    );

    const masterSetting = settings.find((s) => s.setting_key === 'pass_certificate_generation_global_open');
    const passSetting = settings.find((s) => s.setting_key === 'pass_generation_global_open');

    // 1. Master Switch check
    if (masterSetting && masterSetting.setting_value === '0') {
      return {
        allowed: false,
        reason: 'Pass and certificate generation is currently disabled by the event administrator.',
      };
    }

    // 2. Pass Sub-Switch check
    if (passSetting && passSetting.setting_value === '0') {
      return {
        allowed: false,
        reason: 'Pass generation is currently disabled by the event administrator.',
      };
    }

    // 3. Competition-level check if slug provided
    if (competitionSlug) {
      const compRows = await db.query<{ pass_enabled: number | null }>(
        'SELECT pass_enabled FROM competitions WHERE slug = ? LIMIT 1',
        [competitionSlug]
      );
      if (compRows.length > 0 && compRows[0].pass_enabled === 0) {
        return {
          allowed: false,
          reason: 'Pass generation is disabled for this competition by the event administrator.',
        };
      }
    }

    return { allowed: true };
  } catch (err) {
    console.warn('Error checking pass generation policy, defaulting to allowed:', err);
    return { allowed: true };
  }
}

/**
 * Checks if certificate generation and downloads are permitted.
 * Hierarchical Policy:
 * 1. Global Master Switch: pass_certificate_generation_global_open must be ON ('1').
 * 2. Certificate Sub-Switch: certificate_generation_global_open must be ON ('1').
 * 3. Competition Switch: If a competitionSlug is given, competitions.certificate_enabled must be true.
 */
export async function isCertificateGenerationAllowed(
  competitionSlug?: string
): Promise<GenerationPolicyResult> {
  try {
    const settings = await db.query<{ setting_key: string; setting_value: string }>(
      `SELECT setting_key, setting_value FROM site_settings 
       WHERE setting_key IN ('pass_certificate_generation_global_open', 'certificate_generation_global_open')`
    );

    const masterSetting = settings.find((s) => s.setting_key === 'pass_certificate_generation_global_open');
    const certSetting = settings.find((s) => s.setting_key === 'certificate_generation_global_open');

    // 1. Master Switch check
    if (masterSetting && masterSetting.setting_value === '0') {
      return {
        allowed: false,
        reason: 'Pass and certificate generation is currently disabled by the event administrator.',
      };
    }

    // 2. Certificate Sub-Switch check
    if (certSetting && certSetting.setting_value === '0') {
      return {
        allowed: false,
        reason: 'Certificate generation is currently disabled by the event administrator.',
      };
    }

    // 3. Competition-level check if slug provided
    if (competitionSlug) {
      const compRows = await db.query<{ certificate_enabled: number | null }>(
        'SELECT certificate_enabled FROM competitions WHERE slug = ? LIMIT 1',
        [competitionSlug]
      );
      if (compRows.length > 0 && compRows[0].certificate_enabled === 0) {
        return {
          allowed: false,
          reason: 'Certificate generation is disabled for this competition by the event administrator.',
        };
      }
    }

    return { allowed: true };
  } catch (err) {
    console.warn('Error checking certificate generation policy, defaulting to allowed:', err);
    return { allowed: true };
  }
}

/**
 * Gets the current active registration mode: 'TESTING' or 'LIVE'.
 * Server-authoritative: Defaults to 'TESTING' if unset.
 */
export async function getRegistrationEnvironmentMode(): Promise<'TESTING' | 'LIVE'> {
  try {
    const rows = await db.query<{ setting_value: string }>(
      "SELECT setting_value FROM site_settings WHERE setting_key = 'registration_environment_mode' LIMIT 1"
    );
    if (rows.length > 0 && rows[0].setting_value === 'LIVE') {
      return 'LIVE';
    }
    return 'TESTING';
  } catch {
    return 'TESTING';
  }
}
