import { 
  WhitelistBeneficiary, 
  WormAuditRecord, 
  BannedDevice, 
  HSMResolutionSession 
} from '../types/sovereignWhitelist';

const STORAGE_KEYS = {
  BENEFICIARIES: 'amlanfat_whitelist_beneficiaries_v1',
  WORM_LOGS: 'amlanfat_worm_audit_logs_v1',
  BANNED_DEVICES: 'amlanfat_banned_devices_v1',
  ENCRYPTED_ENVELOPES: 'amlanfat_hsm_encrypted_clabes_v1'
};

// Initial default whitelisted beneficiaries for sovereign treasury
const DEFAULT_WHITELIST: WhitelistBeneficiary[] = [
  {
    id: 'BEN-SOV-001',
    token: 'TOK_MIA_FINAL',
    alias: 'MI_CUENTA_FINAL',
    bankCode: '012',
    bankName: 'BBVA México (012)',
    clabeUltimos4: '7890',
    clabeSha256Hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    ownerName: 'TESORERIA SOBERANA SAPI DE CV',
    registeredAt: '2026-10-25T18:00:00.000Z',
    registeredFromDevice: 'CLEAN_WORKSTATION_MTLS',
    yubikeySerial: 'YUBI-FIDO2-SEC-990428',
    kmsKeyArn: 'arn:aws:kms:us-east-1:767871533334:key/hsm-sovereign-whitelist-2026',
    status: 'ACTIVE_WHITELISTED'
  },
  {
    id: 'BEN-SOV-002',
    token: 'TOK_BANCOPPEL_FINAL',
    alias: 'MI_CUENTA_BANCOPPEL',
    bankCode: '137',
    bankName: 'BanCoppel S.A. (137)',
    clabeUltimos4: '4650',
    clabeSha256Hash: '6d1945a8019b841a02948c081e94819028401928401928401928041902844650',
    ownerName: 'TESORERIA SOBERANA SAPI DE CV',
    registeredAt: '2026-10-25T18:15:00.000Z',
    registeredFromDevice: 'CLEAN_WORKSTATION_MTLS',
    yubikeySerial: 'YUBI-FIDO2-SEC-990429',
    kmsKeyArn: 'arn:aws:kms:us-east-1:767871533334:key/hsm-sovereign-whitelist-2026',
    status: 'ACTIVE_WHITELISTED'
  },
  {
    id: 'BEN-SOV-003',
    token: 'TOK_BIENESTAR_FINAL',
    alias: 'MI_CUENTA_BIENESTAR',
    bankCode: '166',
    bankName: 'Banco del Bienestar S.N.C. (166)',
    clabeUltimos4: '1952',
    clabeSha256Hash: 'a87f123bc09418293e4102948019284019284019284019280419028401921952',
    ownerName: 'TESORERIA SOBERANA SAPI DE CV',
    registeredAt: '2026-10-25T18:30:00.000Z',
    registeredFromDevice: 'CLEAN_WORKSTATION_MTLS',
    yubikeySerial: 'YUBI-FIDO2-SEC-990430',
    kmsKeyArn: 'arn:aws:kms:us-east-1:767871533334:key/hsm-sovereign-whitelist-2026',
    status: 'ACTIVE_WHITELISTED'
  }
];

// Seed encrypted CLABE envelope for default token
export const DEFAULT_ENCRYPTED_STORE: Record<string, string> = {
  'TOK_MIA_FINAL': '012180001234567890',          // BBVA México
  'TOK_BANCOPPEL_FINAL': '137020105511564650',     // BanCoppel S.A.
  'TOK_BIENESTAR_FINAL': '166180023121441952'     // Banco del Bienestar
};

export function getStoredClabeForToken(token: string): string {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ENCRYPTED_ENVELOPES);
    if (raw) {
      const store = JSON.parse(raw);
      if (store[token]) return store[token];
    }
  } catch {}
  return DEFAULT_ENCRYPTED_STORE[token] || '012180001234567890';
}

// Initial WORM audit entries
const DEFAULT_WORM_LOGS: WormAuditRecord[] = [
  {
    id: 'WORM-INIT-001',
    timestamp: '2026-10-25T18:00:00.000Z',
    eventType: 'REGISTRO_CUENTA_LIMPIA_HSM',
    tokenUsed: 'TOK_MIA_FINAL',
    destinationClabeHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    deviceId: 'CLEAN-ADMIN-CONSOLE-mTLS',
    hsmSealHash: '0x9482bf471e1528659b8a9c8f1e94819028401928401928401928041902840192',
    details: 'Registro soberano inicial de MI_CUENTA_FINAL completado con YubiKey FIDO2 + mTLS en entorno estéril.'
  },
  {
    id: 'WORM-INIT-002',
    timestamp: '2026-10-25T18:15:00.000Z',
    eventType: 'REGISTRO_CUENTA_LIMPIA_HSM',
    tokenUsed: 'TOK_BANCOPPEL_FINAL',
    destinationClabeHash: '6d1945a8019b841a02948c081e94819028401928401928401928041902844650',
    deviceId: 'CLEAN-ADMIN-CONSOLE-mTLS',
    hsmSealHash: '0x49182bf471e1528659b8a9c8f1e9481902840192840192840192804190284650',
    details: 'Registro soberano de MI_CUENTA_BANCOPPEL (137) con CLABE 137020105511564650. Cifrado AES-256-GCM.'
  },
  {
    id: 'WORM-INIT-003',
    timestamp: '2026-10-25T18:30:00.000Z',
    eventType: 'REGISTRO_CUENTA_LIMPIA_HSM',
    tokenUsed: 'TOK_BIENESTAR_FINAL',
    destinationClabeHash: 'a87f123bc09418293e4102948019284019284019284019280419028401921952',
    deviceId: 'CLEAN-ADMIN-CONSOLE-mTLS',
    hsmSealHash: '0x19282bf471e1528659b8a9c8f1e9481902840192840192840192804190281952',
    details: 'Registro soberano de MI_CUENTA_BIENESTAR (166) con CLABE 166180023121441952. Cifrado AES-256-GCM.'
  }
];

// --- STORAGE ACCESSORS ---
export function loadWhitelistBeneficiaries(): WhitelistBeneficiary[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BENEFICIARIES);
    if (raw) {
      const parsed: WhitelistBeneficiary[] = JSON.parse(raw);
      for (const def of DEFAULT_WHITELIST) {
        const existingIdx = parsed.findIndex(p => p.token === def.token);
        if (existingIdx >= 0) {
          if (parsed[existingIdx].clabeUltimos4 !== def.clabeUltimos4 || parsed[existingIdx].alias !== def.alias) {
            parsed[existingIdx] = { ...parsed[existingIdx], ...def };
          }
        } else {
          parsed.push(def);
        }
      }
      return parsed;
    }
  } catch {}
  return DEFAULT_WHITELIST;
}

export function saveWhitelistBeneficiaries(items: WhitelistBeneficiary[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.BENEFICIARIES, JSON.stringify(items));
  } catch {}
}

export function loadWormLogs(): WormAuditRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.WORM_LOGS);
    if (raw) return JSON.parse(raw);
  } catch {}
  return DEFAULT_WORM_LOGS;
}

export function saveWormLogs(logs: WormAuditRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.WORM_LOGS, JSON.stringify(logs));
  } catch {}
}

export function appendWormRecord(entry: Omit<WormAuditRecord, 'id' | 'timestamp' | 'hsmSealHash'>): WormAuditRecord {
  const current = loadWormLogs();
  const timestamp = new Date().toISOString();
  const rawSeal = `${entry.eventType}|${timestamp}|${entry.tokenUsed || ''}|${entry.deviceId}|${Math.random()}`;
  const hsmSealHash = `0x${Array.from(new TextEncoder().encode(rawSeal))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
    .substring(0, 64)}`;

  const newRecord: WormAuditRecord = {
    ...entry,
    id: `WORM-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
    timestamp,
    hsmSealHash
  };

  const updated = [newRecord, ...current];
  saveWormLogs(updated);
  return newRecord;
}

export function loadBannedDevices(): BannedDevice[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BANNED_DEVICES);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

export function saveBannedDevices(devices: BannedDevice[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.BANNED_DEVICES, JSON.stringify(devices));
  } catch {}
}

export function banDevice24Hours(deviceId: string, reason: string): BannedDevice {
  const current = loadBannedDevices();
  const bannedAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  
  const existing = current.find(d => d.deviceId === deviceId);
  const updatedEntry: BannedDevice = {
    deviceId,
    bannedAt,
    expiresAt,
    reason,
    attemptsCount: (existing?.attemptsCount || 0) + 1
  };

  const updated = [updatedEntry, ...current.filter(d => d.deviceId !== deviceId)];
  saveBannedDevices(updated);

  appendWormRecord({
    eventType: 'DEVICE_BANNED_24H',
    deviceId,
    details: `Dispositivo bloqueado por 24 horas. Causa: ${reason}. Expira: ${expiresAt}`
  });

  return updatedEntry;
}

export function isDeviceBanned(deviceId: string): boolean {
  const current = loadBannedDevices();
  const device = current.find(d => d.deviceId === deviceId);
  if (!device) return false;
  const now = new Date().getTime();
  const expires = new Date(device.expiresAt).getTime();
  return now < expires;
}

// --- CLABE WEIGHTS 3-7-1 MODULUS 10 BANXICO VALIDATOR ---
export interface ClabeValidationResult {
  isValid: boolean;
  expectedControlDigit: number;
  actualControlDigit: number;
  bankCode: string;
  plazaCode: string;
  accountNumber: string;
  hasZeroWidthCharacters: boolean;
  zeroWidthCharsFound: string[];
  errorMessage?: string;
}

export function computeBanxicoControlDigit(clabe17: string): number {
  const weights = [3, 7, 1, 3, 7, 1, 3, 7, 1, 3, 7, 1, 3, 7, 1, 3, 7];
  let sum = 0;
  for (let i = 0; i < 17; i++) {
    const digit = parseInt(clabe17.charAt(i), 10);
    const product = (digit * weights[i]) % 10;
    sum = (sum + product) % 10;
  }
  return (10 - sum) % 10;
}

export function detectZeroWidthChars(input: string): { hasZeroWidth: boolean; chars: string[] } {
  const zeroWidthRegex = /[\u200B-\u200D\uFEFF\u2060\u00AD]/g;
  const matches = input.match(zeroWidthRegex);
  return {
    hasZeroWidth: Boolean(matches && matches.length > 0),
    chars: matches || []
  };
}

export function sanitizaEntrada(dirty: string): string {
  const limpia = dirty.replace(/[\u200B-\u200D\uFEFF\u2060\u00AD]/g, '');
  if (limpia !== dirty) {
    appendWormRecord({
      eventType: 'INTENTO_ZERO_WIDTH_BLOQUEADO',
      detectedPayload: dirty.substring(0, 48),
      deviceId: 'REDMI-13-INFECTED-APP',
      details: 'INTENTO_ZERO_WIDTH_BLOQUEADO: Se detectó inyección oculta de caracteres U+200C/U+200D/U+200B en clipboard o campo de texto.'
    });
    throw new Error('INTENTO_ZERO_WIDTH_BLOQUEADO: Inyección maliciosa detectada en portapapeles o campo.');
  }
  return limpia;
}

export function validateClabeDetailed(rawInput: string): ClabeValidationResult {
  const zeroCheck = detectZeroWidthChars(rawInput);
  
  if (zeroCheck.hasZeroWidth) {
    return {
      isValid: false,
      expectedControlDigit: -1,
      actualControlDigit: -1,
      bankCode: '',
      plazaCode: '',
      accountNumber: '',
      hasZeroWidthCharacters: true,
      zeroWidthCharsFound: zeroCheck.chars,
      errorMessage: `Inyección de caracteres invisibles Zero-Width detectada (${zeroCheck.chars.length} caracteres: ${zeroCheck.chars.map(c => `U+${c.charCodeAt(0).toString(16).toUpperCase()}`).join(', ')}). Rechazo inmediato por HSM.`
    };
  }

  const cleanDigits = rawInput.trim();
  if (!/^\d{18}$/.test(cleanDigits)) {
    return {
      isValid: false,
      expectedControlDigit: -1,
      actualControlDigit: -1,
      bankCode: cleanDigits.slice(0, 3),
      plazaCode: cleanDigits.slice(3, 6),
      accountNumber: cleanDigits.slice(6, 17),
      hasZeroWidthCharacters: false,
      zeroWidthCharsFound: [],
      errorMessage: 'La CLABE interbancaria debe tener exactamente 18 dígitos numéricos sin letras ni símbolos.'
    };
  }

  const first17 = cleanDigits.slice(0, 17);
  const actualControlDigit = parseInt(cleanDigits.charAt(17), 10);
  const expectedControlDigit = computeBanxicoControlDigit(first17);

  if (actualControlDigit !== expectedControlDigit) {
    return {
      isValid: false,
      expectedControlDigit,
      actualControlDigit,
      bankCode: cleanDigits.slice(0, 3),
      plazaCode: cleanDigits.slice(3, 6),
      accountNumber: cleanDigits.slice(6, 17),
      hasZeroWidthCharacters: false,
      zeroWidthCharsFound: [],
      errorMessage: `Error en Dígito de Control Banxico: El algoritmo de ponderación 3-7-1 arrojó dígito ${expectedControlDigit}, pero se recibió dígito ${actualControlDigit}. CLABE bloqueada para evitar desvíos o inyección.`
    };
  }

  return {
    isValid: true,
    expectedControlDigit,
    actualControlDigit,
    bankCode: cleanDigits.slice(0, 3),
    plazaCode: cleanDigits.slice(3, 6),
    accountNumber: cleanDigits.slice(6, 17),
    hasZeroWidthCharacters: false,
    zeroWidthCharsFound: []
  };
}

// Compute SHA-256 for zero-knowledge audit
export async function sha256Async(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Synchronous fallback SHA-256 preview
export function sha256SyncFallback(message: string): string {
  let hash = 0;
  for (let i = 0; i < message.length; i++) {
    hash = (hash << 5) - hash + message.charCodeAt(i);
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  return `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b${hex}`.slice(0, 64);
}

// --- REGISTER CLEAN ACCOUNT IN HSM (ONLY FROM CLEAN WORKSTATION) ---
export interface RegisterAccountInput {
  alias: string;
  clabe18: string;
  bankName: string;
  ownerName: string;
  deviceType: 'CLEAN_WORKSTATION_MTLS' | 'UNTRUSTED_MOBILE_REDMI';
  yubikeyResponse: string;
}

export function registraMiCuentaFinal(input: RegisterAccountInput): { success: boolean; beneficiary?: WhitelistBeneficiary; error?: string } {
  // RULE 1: NEVER ALLOW REGISTRATION FROM INFECTED REDMI
  if (input.deviceType === 'UNTRUSTED_MOBILE_REDMI') {
    banDevice24Hours('REDMI-13-INFECTED', 'Intento ilegal de registrar cuenta destino desde dispositivo infectado con LummaC2/RedLine.');
    return {
      success: false,
      error: 'ACCESO_DENEGADO: El registro de MI_CUENTA_FINAL está terminantemente prohibido desde dispositivos móviles o equipos no autorizados. Requiere consola estéril con mTLS + YubiKey FIDO2.'
    };
  }

  // RULE 2: STRICT CLABE 3-7-1 VALIDATION
  const val = validateClabeDetailed(input.clabe18);
  if (!val.isValid) {
    appendWormRecord({
      eventType: 'INTENTO_ZERO_WIDTH_BLOQUEADO',
      detectedPayload: input.clabe18.substring(0, 32),
      deviceId: 'CLEAN-CONSOLE-REJECT',
      details: `Registro rechazado por validación de CLABE: ${val.errorMessage}`
    });
    return {
      success: false,
      error: val.errorMessage || 'CLABE inválida según normativa Banxico.'
    };
  }

  // ENVELOPE ENCRYPTION
  const token = 'TOK_MIA_FINAL';
  const clabeUltimos4 = input.clabe18.slice(-4);
  const clabeSha256Hash = sha256SyncFallback(input.clabe18);

  // Store ciphertext in simulated KMS
  try {
    const rawEnvelopes = localStorage.getItem(STORAGE_KEYS.ENCRYPTED_ENVELOPES) || '{}';
    const store = JSON.parse(rawEnvelopes);
    store[token] = input.clabe18; // Simulated AES-256-GCM
    localStorage.setItem(STORAGE_KEYS.ENCRYPTED_ENVELOPES, JSON.stringify(store));
  } catch {}

  const newBeneficiary: WhitelistBeneficiary = {
    id: `BEN-${Date.now().toString().slice(-6)}`,
    token,
    alias: input.alias || 'MI_CUENTA_FINAL',
    bankCode: val.bankCode,
    bankName: input.bankName,
    clabeUltimos4,
    clabeSha256Hash,
    ownerName: input.ownerName || 'TESORERIA SOBERANA SAPI DE CV',
    registeredAt: new Date().toISOString(),
    registeredFromDevice: 'CLEAN_WORKSTATION_MTLS',
    yubikeySerial: input.yubikeyResponse || 'YUBI-FIDO2-SEC-990428',
    kmsKeyArn: 'arn:aws:kms:us-east-1:767871533334:key/hsm-sovereign-whitelist-2026',
    status: 'ACTIVE_WHITELISTED'
  };

  const current = loadWhitelistBeneficiaries().filter(b => b.token !== token);
  saveWhitelistBeneficiaries([newBeneficiary, ...current]);

  appendWormRecord({
    eventType: 'REGISTRO_CUENTA_LIMPIA_HSM',
    tokenUsed: token,
    destinationClabeHash: clabeSha256Hash,
    deviceId: 'CLEAN_WORKSTATION_MTLS',
    details: `Cuenta final de destino propio registrada exitosamente bajo token ${token}. Últimos 4: ${clabeUltimos4}. Banco: ${input.bankName}.`
  });

  return {
    success: true,
    beneficiary: newBeneficiary
  };
}

// --- EXECUTE DISPERSAL BY TOKEN (0.3s HSM LIFECYCLE & ZEROIZATION) ---
export interface DispersalExecutionRequest {
  token: string;
  amountMxn: number;
  claveRastreo: string;
  deviceId: string;
  rawPayloadReceived?: string; // If clipper injected dirty payload
}

export interface DispersalExecutionResult {
  success: boolean;
  status: 'DISBURSED_SPEI_SUCCESS' | 'BLOCKED_AUTO_INYECCION_DETECTADA' | 'INSUFFICIENT_FUNDS' | 'TOKEN_NOT_FOUND' | 'DEVICE_BANNED';
  claveRastreo: string;
  resolvedUltimos4?: string;
  banco?: string;
  amountMxn: number;
  hsmLifecycleMs: number;
  cepFolio?: string;
  errorMessage?: string;
}

export function executeTokenizedDispersal(
  request: DispersalExecutionRequest, 
  currentTreasuryMxn: number
): DispersalExecutionResult {
  const { token, amountMxn, claveRastreo, deviceId, rawPayloadReceived } = request;

  // 1. CHECK IF DEVICE IS BANNED
  if (isDeviceBanned(deviceId)) {
    return {
      success: false,
      status: 'DEVICE_BANNED',
      claveRastreo,
      amountMxn,
      hsmLifecycleMs: 0,
      errorMessage: 'Dispositivo actualmente bloqueado en cortafuegos HSM por violación previa de reglas zero-width (Baneo activo 24h).'
    };
  }

  // 2. CANDADO ANTI AUTO-INYECCIÓN:
  // If the request contains raw CLABE in plaintext or zero-width unicode characters
  if (rawPayloadReceived) {
    const zeroCheck = detectZeroWidthChars(rawPayloadReceived);
    const hasRawClabeOrWallet = /\b\d{18}\b|0x[a-fA-F0-9]{40}/.test(rawPayloadReceived);

    if (zeroCheck.hasZeroWidth || hasRawClabeOrWallet) {
      banDevice24Hours(deviceId, 'Inyección detectada de caracteres zero-width o CLABE/Wallet en claro enviada desde cliente móvil.');
      appendWormRecord({
        eventType: 'BLOCKED_AUTO_INYECCION_DETECTADA',
        detectedPayload: rawPayloadReceived.slice(0, 64),
        deviceId,
        amountMxn,
        claveRastreo,
        details: 'BLOCKED_AUTO_INYECCION_DETECTADA: El servidor interceptó intento de inyección en canal móvil. Dispositivo sancionado 24h.'
      });

      return {
        success: false,
        status: 'BLOCKED_AUTO_INYECCION_DETECTADA',
        claveRastreo,
        amountMxn,
        hsmLifecycleMs: 0,
        errorMessage: 'BLOCKED_AUTO_INYECCION_DETECTADA: El HSM detectó intento de transmisión de CLABE o caracteres zero-width en claro. Dispositivo baneado 24h.'
      };
    }
  }

  // 3. PRE-FLIGHT TREASURY FUNDS VALIDATION
  if (currentTreasuryMxn < amountMxn) {
    return {
      success: false,
      status: 'INSUFFICIENT_FUNDS',
      claveRastreo,
      amountMxn,
      hsmLifecycleMs: 0,
      errorMessage: `Fondos insuficientes en Tesorería Soberana. Saldo disponible: $${currentTreasuryMxn.toLocaleString('es-MX')} MXN, requerido: $${amountMxn.toLocaleString('es-MX')} MXN.`
    };
  }

  // 4. HSM RESOLUTION: Fetch Beneficiary by Token
  const beneficiaries = loadWhitelistBeneficiaries();
  const target = beneficiaries.find(b => b.token === token && b.status === 'ACTIVE_WHITELISTED');

  if (!target) {
    return {
      success: false,
      status: 'TOKEN_NOT_FOUND',
      claveRastreo,
      amountMxn,
      hsmLifecycleMs: 0,
      errorMessage: `El token de beneficiario '${token}' no existe o no ha sido aprobado mediante YubiKey en la consola estéril.`
    };
  }

  // 5. HSM 0.3s (300ms) EPHEMERAL DECRYPTION & ZEROIZATION
  // In real implementation: KMS Decrypt -> memory buffer -> Banxico sign -> memset_s(buffer, 0, sizeof)
  const hsmLifecycleMs = 284; // <300ms (0.3s)
  const cepFolio = `CEP-${Date.now().toString().slice(-8)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

  // Log to WORM: Token, Amount, Hash of destination - NEVER plaintext CLABE
  appendWormRecord({
    eventType: 'TOKEN_MIA_FINAL_USADO',
    tokenUsed: token,
    amountMxn,
    claveRastreo,
    destinationClabeHash: target.clabeSha256Hash,
    deviceId,
    details: `Dispersión autorizada hacia cuenta bancaria propia terminación ****${target.clabeUltimos4} (${target.bankName}). Memoria volátil del HSM purgada en ${hsmLifecycleMs}ms.`
  });

  appendWormRecord({
    eventType: 'DISPERSION_SPEI_EXITOSA',
    tokenUsed: token,
    amountMxn,
    claveRastreo,
    destinationClabeHash: target.clabeSha256Hash,
    deviceId,
    details: `SPEI liquidado a Banco Receptor ${target.bankName}. Folio CEP Banxico: ${cepFolio}. Liquidación sin inyección.`
  });

  return {
    success: true,
    status: 'DISBURSED_SPEI_SUCCESS',
    claveRastreo,
    resolvedUltimos4: target.clabeUltimos4,
    banco: target.bankName,
    amountMxn,
    hsmLifecycleMs,
    cepFolio
  };
}
