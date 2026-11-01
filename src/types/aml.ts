export type TransactionChannel = 'SPEI' | 'SWIFT' | 'CRYPTO';

export type CryptoNetwork = 
  | 'Bitcoin'
  | 'Ethereum (ERC-20)'
  | 'Tron (TRC-20)'
  | 'Solana (SPL)'
  | 'Polygon (PoS)'
  | 'Arbitrum One'
  | 'Binance Smart Chain (BEP-20)'
  | 'Ripple (XRP Ledger)';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL_REPROBABLE';

export interface RiskEquationBreakdown {
  structuringScore: number;       // Max 200 (Smurfing / Pitufeo)
  mixerDarknetScore: number;      // Max 250 (Tornado Cash, Sinbad, illicit hops)
  sanctionsScore: number;         // Max 250 (OFAC SDN, GAFI Grey/Black, PEPs)
  velocityScore: number;          // Max 150 (Transactional speed spike)
  kycDiscrepancyScore: number;    // Max 150 (Declared profile mismatch)
  totalScore: number;             // Sum [0 - 1000]
  flags: string[];
}

export type SarStatus = 'NONE' | 'AUTO_QUEUED' | 'DISPATCHED_UIF' | 'ACKNOWLEDGED';

export type StorageTier = 'ACTIVE_HOT' | 'LONG_TERM_STORAGE';

export type AccountFormatType = 'CLABE_18' | 'PAN_16' | 'DIMO_10';

export interface SarArchiveMetadata {
  archivedAt: string;
  archiveBatchId: string;
  originalSizeBytes: number;
  compressedSizeBytes: number;
  compressionRatio: string;
  compressionAlgorithm: string;
  storageVaultPath: string;
  simulatedAgeDays: number;
}

export type FeeCategory = 
  | 'STANDARD_PROCESSED'          // 1.8%
  | 'MEDIUM_HIGH_RISK'            // 2.5%
  | 'TEMPORARY_HOLD_HIGH_RISK'    // 8.0%
  | 'SEIZURE_CONFISCATION';       // 20.0%

export interface TransactionFeeBreakdown {
  feePercentage: number;          // 1.8, 2.5, 8.0, 20.0
  feeCategory: FeeCategory;
  feeCategoryLabel: string;
  feeAmountMXN: number;
  netDisbursedMXN: number;
  isTemporaryHold: boolean;
  isSeized: boolean;
  holdReason?: string;
  seizureNoticeFolio?: string;
}

export interface Transaction {
  id: string;
  timestamp: string;
  channel: TransactionChannel;
  cryptoNetwork?: CryptoNetwork;
  bankCode?: string;
  bankName?: string;
  
  originator: {
    name: string;
    taxId: string; // RFC o Tax ID
    accountOrAddress: string;
    kycTier: 'TIER_1_BASICO' | 'TIER_2_ESTANDAR' | 'TIER_3_ALTO' | 'NO_VERIFICADO';
    jurisdiction: string;
    isPEP: boolean;
  };
  
  beneficiary: {
    name: string;
    taxId: string;
    accountOrAddress: string;
    institution: string;
    jurisdiction: string;
  };

  amount: number;
  currency: 'MXN' | 'USD' | 'USDT' | 'USDC' | 'BTC' | 'ETH' | 'SOL' | 'TRX';
  amountMXN: number;
  concept: string;
  trackingKey: string; // Clave de rastreo SPEI o TxHash on-chain
  
  riskBreakdown: RiskEquationBreakdown;
  riskLevel: RiskLevel;
  feeBreakdown: TransactionFeeBreakdown;
  
  sarStatus: SarStatus;
  sarFolio?: string;
  sarDispatchTimestamp?: string;
  sarReceiptHash?: string;

  storageTier?: StorageTier;
  archiveMetadata?: SarArchiveMetadata;
  simulatedAgeDays?: number;

  blockBatchId: string;
  executionMicroseconds: number;

  // Mock Regulatory Blacklist screening result
  isBlacklisted?: boolean;
  blacklistMatch?: BlacklistMatchRecord;

  // Immutable Ledger reference
  ledgerBlockIndex?: number;
  ledgerBlockHash?: string;

  // SPEI Dispenser routing node
  speiRoutingNode?: string;
  beneficiaryAccountFormat?: AccountFormatType;
}

export type BlacklistAuthority = 
  | 'OFAC_SDN' 
  | 'UIF_BLOQUEADOS_ART_115' 
  | 'SAT_69B_EFOS' 
  | 'GAFI_SANCTIONED' 
  | 'INTERPOL_RED_NOTICE'
  | 'CHAINALYSIS_ILLICIT';

export type BlacklistRiskAction = 
  | 'IMMEDIATE_SEIZURE_20_PCT' 
  | 'TEMPORARY_HOLD_8_PCT' 
  | 'BLOCK_AND_SAR_AUTO';

export interface BlacklistEntry {
  id: string;
  entityName: string;
  identifierOrAddress: string; // Wallet address, CLABE, Card PAN, DiMo phone or RFC
  identifierType: 'CRYPTO_ADDRESS' | 'RFC_TAX_ID' | 'BANK_CLABE' | 'CARD_PAN_16' | 'DIMO_PHONE_10' | 'INDIVIDUAL_NAME';
  authority: BlacklistAuthority;
  authorityLabel: string;
  category: string;
  sanctionOrderFolio: string;
  mandatedAction: BlacklistRiskAction;
  dateAdded: string;
  country: string;
  notes: string;
}

export interface BlacklistMatchRecord {
  matchedAt: string;
  matchedEntity: string;
  matchedIdentifier: string;
  authority: BlacklistAuthority;
  authorityLabel: string;
  sanctionOrderFolio: string;
  mandatedAction: BlacklistRiskAction;
  notes: string;
}

// Immutable Ledger types
export interface ImmutableBlock {
  index: number;
  timestamp: string;
  previousHash: string;
  merkleRoot: string;
  hash: string;
  transactionCount: number;
  transactionIds: string[];
  totalVolumeMXN: number;
  totalFeesMXN: number;
  blacklistHitsCount: number;
  complianceOfficerSignature: string;
  cnbvDigitalSeal: string;
  status: 'SEALED_IMMUTABLE' | 'VERIFIED_VALID' | 'TAMPER_DETECTED';
}

// SPEI Network Nodes and Dispenser
export type SpeiNodeStatus = 'ONLINE_PRIMARY' | 'ONLINE_HOT_STANDBY' | 'SYNCHRONIZING' | 'OFFLINE_MAINTENANCE';

export interface SpeiNetworkNode {
  id: string;
  name: string;
  operator: string;
  role: 'BANXICO_PRIMARY' | 'STP_REDUNDANT' | 'CECOBAN_CLEARING' | 'AMLANFAT_HSM_VAULT';
  status: SpeiNodeStatus;
  latencyMs: number;
  uptimePercentage: number;
  port: number;
  protocol: string;
  certificateExpiry: string;
  totalDispatchedTxs: number;
  volumeDispatchedMXN: number;
  isPrimaryActive: boolean;
}

export interface DispenserQueueItem {
  id: string;
  timestamp: string;
  accountFormat?: AccountFormatType;
  targetCLABE: string;
  targetBank: string;
  beneficiaryName: string;
  amountMXN: number;
  allocatedNodeId: string;
  trackingKey: string;
  cepFolio: string;
  status: 'QUEUED' | 'SIGNING_BANXICO' | 'DISPENSED_SETTLED' | 'HELD_RESERVE';
  reserveFundDeducted: boolean;
}

export interface ReserveFundStats {
  totalReserveFundMXN: number; // Fondos de Resguardo en Custodia Banxico
  minimumRegulatoryRatio: number; // 100% required by Art. 22 Ley Fintech
  currentCoverageRatio: number; // e.g. 112.5%
  liquidDemandLiabilitiesMXN: number; // Pasivos a la vista
  safeguardedAccounts: {
    institution: string;
    accountNumber: string;
    balanceMXN: number;
    custodyType: string;
    verifiedByBanxico: boolean;
  }[];
}

export interface BiometricLivenessDetails {
  blinkDetected: boolean;
  eyeAspectRatio: number; // e.g. 0.28
  headYawDegrees: number; // Head rotation angle e.g. 14.5
  headPitchDegrees: number;
  microExpressionScore: number; // 0-100
  antiSpoofingScore: number; // 0-100 (ISO/IEC 30107-3 PAD)
  screenReflectionDetected: boolean;
  livenessMethod: 'ACTIVE_CHALLENGE_RESPONSE' | 'PASSIVE_3D_LUMINANCE' | 'HYBRID_DUAL_PASS';
  livenessConfidence: number; // e.g. 99.8%
}

export interface BiometricCryptographicAttestation {
  algorithm: 'ECDSA_SECP256K1_SHA256' | 'HMAC_SHA256';
  nonce: string;
  timestamp: string;
  signerRFC: string;
  boundClaveRastreo: string;
  facialVectorHash: string;
  signatureHex: string;
  pkiCertificateSerial: string;
  banxicoComplianceStandard: 'DISPOSICIONES_CNBV_ART_316_BIS';
}

export interface BiometricVerificationRecord {
  verifiedAt: string;
  biometricType: 'FACIAL_RECOGNITION_LIVENESS';
  confidenceScore: number; // e.g. 99.4%
  signerName: string;
  signerRFC: string;
  biometricTokenHash: string;
  ineCnbvMatchStatus: 'VERIFIED_HOMOLOGATED';
  livenessPassed: boolean;
  livenessDetails?: BiometricLivenessDetails;
  attestation?: BiometricCryptographicAttestation;
}

export interface AssetConversionRecord {
  id: string;
  timestamp: string;
  fromAsset: 'USDT' | 'USDC' | 'BTC' | 'ETH' | 'SOL' | 'TRX' | 'USD' | 'EUR';
  fromAmount: number;
  exchangeRateMXN: number;
  grossAmountMXN: number;
  spreadCostMXN: number;
  netCreditedMXN: number;
  targetVault: 'BÓVEDA_SOBERANA_MXN';
  txHash: string;
}

export type EngineMode = 'STANDARD' | 'ACCELERATOR' | 'TURBO';

export interface VaultBalances {
  MXN: number;
  USDT: number;
  USDC: number;
  BTC: number;
  ETH: number;
  SOL: number;
  TRX: number;
}

export interface EngineStats {
  mode: EngineMode;
  parallelThreads: number;
  processedCount: number;
  reprobableCount: number;
  autoDispatchedCount: number;
  bufferMemoryKB: number;
  bufferCapacityKB: number;
  cleanedBlocksCount: number;
  avgLatencyUs: number;
  isRunning: boolean;
  autoDispatchEnabled: boolean;
  longTermArchivedCount: number;
  totalCompressedSavedKB: number;
  lastArchiveJobRun?: string;
  simulatedDaysElapsed: number;
  isArchiveJobRunning: boolean;
  nextArchiveCycleSeconds: number;
  realtimeThroughputTps: number;
  isStreamingActive: boolean;
  streamingSpeedMs: number;
  lastIncomingTxId?: string;
  lastIncomingChannel?: string;
  lastIncomingScore?: number;
  totalFeesCollectedMXN: number;
  standardFeesCount: number;
  riskFeesCount: number;
  temporaryHoldCount: number;
  seizureCount: number;
  totalSeizedAmountMXN: number;
  totalHeldAmountMXN: number;
}

export interface SpeiTransferRecord {
  id: string;
  timestamp: string;
  beneficiaryName: string;
  beneficiaryRFC: string;
  accountFormat?: AccountFormatType;
  targetCLABE: string;
  targetBank: string;
  grossAmountCrypto: number;
  cryptoSymbol: string;
  liquidatedGrossMXN: number;
  
  // SAT Tax breakdown
  baseGravableMXN: number;
  retencionISRProvisionalMXN: number; // 20%
  retencionIVAMXN: number; // 16%
  netPaidSPEIMXN: number;
  
  cepFolio: string; // Comprobante Electrónico de Pago Banxico
  status: 'LIQUIDATED_SETTLED' | 'IN_TRANSIT_STP';
  auditCertificateHash: string;
  biometricAuth?: BiometricVerificationRecord;
}

export interface AuditFileRecord {
  id: string;
  fileName: string;
  fileType: 'PDF' | 'EXCEL' | 'JSON_SAR' | 'VAULT_BACKUP' | 'COMPRESSED_TAR_ZST';
  timestamp: string;
  fileSizeBytes: number;
  sha256Hash: string;
  authorityDestination: 'UIF_MEXICO' | 'CENFI_REGULATOR' | 'GAFI_FATF' | 'CNBV_AUDIT' | 'INTERNAL_VAULT' | 'LONG_TERM_COLD_STORAGE';
  status: 'SEALED_VALID' | 'DISPATCHED' | 'ARCHIVED_COMPRESSED';
  compressionRatio?: string;
  itemsCount?: number;
}
