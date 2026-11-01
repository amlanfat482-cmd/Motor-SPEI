import { 
  VaultBalances, 
  SpeiTransferRecord, 
  AssetConversionRecord, 
  Transaction, 
  AuditFileRecord, 
  EngineStats 
} from '../types/aml';
import { generateInitialTransactionBatch } from './generator';

// Storage keys with versioning to guarantee clean schema migrations
const STORAGE_KEYS = {
  VAULT_BALANCES: 'amlanfat_vault_balances_v2',
  CONVERSION_HISTORY: 'amlanfat_conversion_history_v2',
  SPEI_TRANSFERS: 'amlanfat_spei_transfers_v2',
  TRANSACTIONS: 'amlanfat_transactions_v2',
  AUDIT_FILES: 'amlanfat_audit_files_v2',
  ENGINE_STATS: 'amlanfat_engine_stats_v2',
  API_KEY: 'amlanfat_vault_api_key_v2'
};

export const DEFAULT_VAULT_BALANCES: VaultBalances = {
  MXN: 2840000,
  USDT: 142500,
  USDC: 85200,
  BTC: 3.485,
  ETH: 42.15,
  SOL: 350,
  TRX: 125000
};

export const DEFAULT_CONVERSION_HISTORY: AssetConversionRecord[] = [
  {
    id: 'CNV-2026-001',
    timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
    fromAsset: 'USDT',
    fromAmount: 10000,
    exchangeRateMXN: 19.85,
    grossAmountMXN: 198500,
    spreadCostMXN: 0,
    netCreditedMXN: 198500,
    targetVault: 'BÓVEDA_SOBERANA_MXN',
    txHash: '0x9482fa8102948201a0b3847291840291fe849102'
  },
  {
    id: 'CNV-2026-002',
    timestamp: new Date(Date.now() - 3600000 * 18).toISOString(),
    fromAsset: 'BTC',
    fromAmount: 0.25,
    exchangeRateMXN: 1850000,
    grossAmountMXN: 462500,
    spreadCostMXN: 0,
    netCreditedMXN: 462500,
    targetVault: 'BÓVEDA_SOBERANA_MXN',
    txHash: '0x3847291840291fe849102847a982bfe018274928'
  }
];

export const DEFAULT_SPEI_TRANSFERS: SpeiTransferRecord[] = [
  {
    id: 'SPEI-LIQ-2026-0941',
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    beneficiaryName: 'CORPORATIVO DE COBRO Y FISCALIZACIÓN S.A. DE C.V.',
    beneficiaryRFC: 'CCF1908239A1',
    targetCLABE: '012180001234567890',
    targetBank: 'BBVA México (012)',
    grossAmountCrypto: 5000,
    cryptoSymbol: 'USDT',
    liquidatedGrossMXN: 99250,
    baseGravableMXN: 99250,
    retencionISRProvisionalMXN: 19850,
    retencionIVAMXN: 15880,
    netPaidSPEIMXN: 63520,
    cepFolio: 'CEP-BANXICO-20260925-0129482',
    status: 'LIQUIDATED_SETTLED',
    auditCertificateHash: '0x84920fe849102847a982bfe0182749281a0b3847291840291'
  },
  {
    id: 'SPEI-LIQ-2026-0942',
    timestamp: new Date(Date.now() - 43200000).toISOString(),
    beneficiaryName: 'MINERÍA Y TECNOLOGÍA DIGITAL DEL NORTE S.A.',
    beneficiaryRFC: 'MTD180420HL3',
    targetCLABE: '072180009876543210',
    targetBank: 'Banorte (072)',
    grossAmountCrypto: 0.12,
    cryptoSymbol: 'BTC',
    liquidatedGrossMXN: 222000,
    baseGravableMXN: 222000,
    retencionISRProvisionalMXN: 44400,
    retencionIVAMXN: 35520,
    netPaidSPEIMXN: 142080,
    cepFolio: 'CEP-BANXICO-20260926-0728491',
    status: 'LIQUIDATED_SETTLED',
    auditCertificateHash: '0x391840291fe849102847a982bfe0182749281a0b38472918'
  }
];

export const DEFAULT_AUDIT_FILES: AuditFileRecord[] = [
  {
    id: 'FILE-01-XLSX',
    fileName: 'AMLanfat_Expediente_Fiscalizacion_CNBV_UIF.xlsx',
    fileType: 'EXCEL',
    timestamp: new Date().toISOString(),
    fileSizeBytes: 248900,
    sha256Hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    authorityDestination: 'CNBV_AUDIT',
    status: 'SEALED_VALID'
  },
  {
    id: 'FILE-02-PDF',
    fileName: 'AMLanfat_Acta_Auditoria_Oficial_PLD_FT.pdf',
    fileType: 'PDF',
    timestamp: new Date().toISOString(),
    fileSizeBytes: 684200,
    sha256Hash: 'a7c132890bfa32948e71b29a8f2734190cba721980324891b290348719283741',
    authorityDestination: 'UIF_MEXICO',
    status: 'SEALED_VALID'
  },
  {
    id: 'FILE-03-JSON',
    fileName: 'UIF_CENFI_Transmisiones_SAR_Lote_2026.json',
    fileType: 'JSON_SAR',
    timestamp: new Date().toISOString(),
    fileSizeBytes: 142300,
    sha256Hash: '0f8374921bca9082348719283741098273491823749182734918273491827349',
    authorityDestination: 'CENFI_REGULATOR',
    status: 'DISPATCHED'
  },
  {
    id: 'FILE-04-SAT',
    fileName: 'SAT_Liquidaciones_SPEI_Retencion_Impuestos.xlsx',
    fileType: 'EXCEL',
    timestamp: new Date().toISOString(),
    fileSizeBytes: 95400,
    sha256Hash: '7c4a8d09ca3762af61e59520943dc26494f8941babcdd66228308d927a7cc7f5',
    authorityDestination: 'CNBV_AUDIT',
    status: 'SEALED_VALID'
  },
  {
    id: 'FILE-05-INDAUTOR',
    fileName: 'INDAUTOR_Certificado_Programa_Computacion_03-2026.pdf',
    fileType: 'PDF',
    timestamp: '2026-03-15T10:00:00Z',
    fileSizeBytes: 1240000,
    sha256Hash: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
    authorityDestination: 'INTERNAL_VAULT',
    status: 'SEALED_VALID'
  }
];

// Helper for safe JSON parsing
function safeGetItem<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed !== null && parsed !== undefined ? parsed : fallback;
  } catch (err) {
    console.warn(`[AMLanfat Storage] Error reading ${key} from localStorage, using fallback:`, err);
    return fallback;
  }
}

function safeSetItem<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.warn(`[AMLanfat Storage] Error saving ${key} to localStorage:`, err);
  }
}

// 1. Vault Balances Persistence (MXN, USDT, USDC, BTC, ETH, SOL, TRX)
export function loadVaultBalances(): VaultBalances {
  const loaded = safeGetItem<VaultBalances>(STORAGE_KEYS.VAULT_BALANCES, DEFAULT_VAULT_BALANCES);
  // Ensure all keys are defined in case an older version was saved
  return {
    MXN: typeof loaded.MXN === 'number' ? loaded.MXN : DEFAULT_VAULT_BALANCES.MXN,
    USDT: typeof loaded.USDT === 'number' ? loaded.USDT : DEFAULT_VAULT_BALANCES.USDT,
    USDC: typeof loaded.USDC === 'number' ? loaded.USDC : DEFAULT_VAULT_BALANCES.USDC,
    BTC: typeof loaded.BTC === 'number' ? loaded.BTC : DEFAULT_VAULT_BALANCES.BTC,
    ETH: typeof loaded.ETH === 'number' ? loaded.ETH : DEFAULT_VAULT_BALANCES.ETH,
    SOL: typeof loaded.SOL === 'number' ? loaded.SOL : DEFAULT_VAULT_BALANCES.SOL,
    TRX: typeof loaded.TRX === 'number' ? loaded.TRX : DEFAULT_VAULT_BALANCES.TRX
  };
}

export function saveVaultBalances(balances: VaultBalances): void {
  safeSetItem(STORAGE_KEYS.VAULT_BALANCES, balances);
}

// 2. Conversion History Persistence
export function loadConversionHistory(): AssetConversionRecord[] {
  const history = safeGetItem<AssetConversionRecord[]>(STORAGE_KEYS.CONVERSION_HISTORY, DEFAULT_CONVERSION_HISTORY);
  return Array.isArray(history) && history.length > 0 ? history : DEFAULT_CONVERSION_HISTORY;
}

export function saveConversionHistory(history: AssetConversionRecord[]): void {
  safeSetItem(STORAGE_KEYS.CONVERSION_HISTORY, history);
}

// 3. SPEI Transfers Persistence
export function loadSpeiTransfers(): SpeiTransferRecord[] {
  const transfers = safeGetItem<SpeiTransferRecord[]>(STORAGE_KEYS.SPEI_TRANSFERS, DEFAULT_SPEI_TRANSFERS);
  return Array.isArray(transfers) && transfers.length > 0 ? transfers : DEFAULT_SPEI_TRANSFERS;
}

export function saveSpeiTransfers(transfers: SpeiTransferRecord[]): void {
  safeSetItem(STORAGE_KEYS.SPEI_TRANSFERS, transfers);
}

// 4. Transactions Persistence
export function loadTransactions(): Transaction[] {
  const txs = safeGetItem<Transaction[]>(STORAGE_KEYS.TRANSACTIONS, []);
  if (Array.isArray(txs) && txs.length > 0) {
    return txs;
  }
  // Generate initial batch if empty and persist it
  const initial = generateInitialTransactionBatch(24);
  safeSetItem(STORAGE_KEYS.TRANSACTIONS, initial);
  return initial;
}

export function saveTransactions(transactions: Transaction[]): void {
  // Cap at 200 items in localStorage to avoid storage limits while keeping hot data
  safeSetItem(STORAGE_KEYS.TRANSACTIONS, transactions.slice(0, 200));
}

// 5. Audit Files Persistence
export function loadAuditFiles(): AuditFileRecord[] {
  const files = safeGetItem<AuditFileRecord[]>(STORAGE_KEYS.AUDIT_FILES, DEFAULT_AUDIT_FILES);
  const list = Array.isArray(files) && files.length > 0 ? files : DEFAULT_AUDIT_FILES;
  
  // Deduplicate files by id to prevent duplicate React keys
  const seen = new Set<string>();
  const deduplicated: AuditFileRecord[] = [];
  for (const f of list) {
    if (f && f.id && !seen.has(f.id)) {
      seen.add(f.id);
      deduplicated.push(f);
    }
  }
  return deduplicated.length > 0 ? deduplicated : DEFAULT_AUDIT_FILES;
}

export function saveAuditFiles(files: AuditFileRecord[]): void {
  const seen = new Set<string>();
  const deduplicated = (files || []).filter(f => {
    if (!f || !f.id || seen.has(f.id)) return false;
    seen.add(f.id);
    return true;
  });
  safeSetItem(STORAGE_KEYS.AUDIT_FILES, deduplicated);
}

// 6. API Key Persistence
export function loadApiKey(): string {
  const defaultKey = 'sk_live_amlanfat_98f4a0b27e891c3d9841fa76';
  try {
    return localStorage.getItem(STORAGE_KEYS.API_KEY) || defaultKey;
  } catch {
    return defaultKey;
  }
}

export function saveApiKey(key: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS.API_KEY, key);
  } catch {}
}

// 7. Reset all storage (useful for manual clean slate testing)
export function resetAllStorageToDefault(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.VAULT_BALANCES);
    localStorage.removeItem(STORAGE_KEYS.CONVERSION_HISTORY);
    localStorage.removeItem(STORAGE_KEYS.SPEI_TRANSFERS);
    localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
    localStorage.removeItem(STORAGE_KEYS.AUDIT_FILES);
    localStorage.removeItem(STORAGE_KEYS.ENGINE_STATS);
    localStorage.removeItem(STORAGE_KEYS.API_KEY);
  } catch {}
}
