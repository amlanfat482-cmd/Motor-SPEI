export type DeviceTrustLevel = 'CLEAN_WORKSTATION_MTLS' | 'UNTRUSTED_MOBILE_REDMI' | 'BANNED';

export interface WhitelistBeneficiary {
  id: string;
  token: string;                 // e.g. "TOK_MIA_FINAL"
  alias: string;                 // e.g. "MI_CUENTA_FINAL"
  bankCode: string;              // e.g. "012"
  bankName: string;              // e.g. "BBVA México"
  clabeUltimos4: string;         // e.g. "7890"
  clabeSha256Hash: string;       // SHA-256 of real CLABE for zero-knowledge audit
  ownerName: string;             // e.g. "TESORERIA SOBERANA SAPI DE CV"
  registeredAt: string;
  registeredFromDevice: string;  // "CLEAN_WORKSTATION_MTLS"
  yubikeySerial: string;
  kmsKeyArn: string;
  status: 'ACTIVE_WHITELISTED' | 'REVOKED';
}

export interface HSMResolutionSession {
  sessionId: string;
  token: string;
  startedAt: number;
  durationMs: number;            // Max 300ms (0.3s)
  ramScrubbed: boolean;
  status: 'INITIALIZING' | 'IN_HSM_RAM' | 'SCRUBBED_ZEROIZED';
  maskedPreview: string;
}

export interface WormAuditRecord {
  id: string;
  timestamp: string;
  eventType: 
    | 'TOKEN_MIA_FINAL_USADO'
    | 'INTENTO_ZERO_WIDTH_BLOQUEADO'
    | 'BLOCKED_AUTO_INYECCION_DETECTADA'
    | 'DISPERSION_SPEI_EXITOSA'
    | 'REGISTRO_CUENTA_LIMPIA_HSM'
    | 'DEVICE_BANNED_24H';
  tokenUsed?: string;
  amountMxn?: number;
  claveRastreo?: string;
  destinationClabeHash?: string;
  detectedPayload?: string;
  deviceId: string;
  hsmSealHash: string;
  details: string;
}

export interface BannedDevice {
  deviceId: string;
  bannedAt: string;
  expiresAt: string;
  reason: string;
  attemptsCount: number;
}
