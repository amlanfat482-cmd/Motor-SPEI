import { CryptoNetwork, Transaction, TransactionChannel, AccountFormatType } from '../types/aml';
import { calculateTransactionFee, determineRiskLevel, evaluateRiskEquation, generateCryptoSha256Receipt, generateSarFolio } from './riskEngine';
import { checkCounterpartyBlacklist, loadBlacklistCatalog } from './blacklistDatabase';
import { generateMockCLABE, generateMockPAN, generateMockDiMo } from './mexicanBanks';

const MEXICAN_BANKS = [
  { code: '012', name: 'BBVA México' },
  { code: '072', name: 'Banorte' },
  { code: '002', name: 'Citibanamex' },
  { code: '014', name: 'Santander' },
  { code: '044', name: 'Scotiabank' },
  { code: '166', name: 'Banco del Bienestar' },
  { code: '677', name: 'Spin by Oxxo' },
  { code: '137', name: 'BanCoppel' },
  { code: '846', name: 'Mercado Pago W' },
  { code: '646', name: 'STP (Sistema de Transferencias y Pagos)' },
  { code: '638', name: 'Nu México Financiera' },
  { code: '127', name: 'Banco Azteca' }
];

const CRYPTO_NETWORKS: CryptoNetwork[] = [
  'Bitcoin',
  'Ethereum (ERC-20)',
  'Tron (TRC-20)',
  'Solana (SPL)',
  'Polygon (PoS)',
  'Arbitrum One',
  'Binance Smart Chain (BEP-20)',
  'Ripple (XRP Ledger)'
];

const SAMPLE_NAMES = [
  'Carlos Eduardo Villanueva Peña',
  'Valeria Sofía Montes de Oca',
  'Inversiones & Minería Digital S.A. de C.V.',
  'Héctor Ramiro Guzmán Elizondo',
  'Logística y Remesas Transfronterizas S.A.',
  'María Fernanda Lázaro Cárdenas',
  'Dmitri Petrov (Offshore Holdings)',
  'Arturo Beltrán Obregón',
  'Fintech Global Settlement Ltd.',
  'Santiago Morales Echeverría',
  'Inmobiliaria y Fideicomiso Peninsular',
  'Kim Min-Jun (Nexus Liquid Services)'
];

const SAMPLE_RFCS = [
  'VIPC840912MA3',
  'MOOV920314KN8',
  'IMD190520KL1',
  'GUEH7911059Z2',
  'LRT180410FA5',
  'LACF9602284N0',
  'XAXX010101000',
  'BEOA8107198P1',
  'FGS210815AB2',
  'MOES881204HT7',
  'IFP160322QX9',
  'XEXX010101000'
];

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateRandomHex(length: number): string {
  const chars = '0123456789abcdef';
  let str = '';
  for (let i = 0; i < length; i++) {
    str += chars[Math.floor(Math.random() * chars.length)];
  }
  return str;
}

function generateCLABE(bankCode: string): string {
  const branch = Math.floor(100 + Math.random() * 900).toString();
  const account = Math.floor(10000000000 + Math.random() * 90000000000).toString().slice(0, 11);
  const checksum = Math.floor(Math.random() * 10);
  return `${bankCode}${branch}${account}${checksum}`;
}

export function generateSingleTransaction(
  batchId: string, 
  forceReprobable: boolean = false,
  feeOverrides?: { isTemporaryHold?: boolean; isSeized?: boolean; holdReason?: string }
): Transaction {
  const isCrypto = Math.random() > 0.42;
  const channel: TransactionChannel = isCrypto ? 'CRYPTO' : (Math.random() > 0.85 ? 'SWIFT' : 'SPEI');
  const cryptoNetwork = isCrypto ? randomElement(CRYPTO_NETWORKS) : undefined;
  const bank = !isCrypto ? randomElement(MEXICAN_BANKS) : undefined;
  
  let origName = randomElement(SAMPLE_NAMES);
  let origRfc = randomElement(SAMPLE_RFCS);
  let accountFormat: AccountFormatType = Math.random() < 0.6 ? 'CLABE_18' : (Math.random() < 0.65 ? 'PAN_16' : 'DIMO_10');

  let accountOrAddress = isCrypto
    ? (cryptoNetwork?.includes('Tron') ? `T${generateRandomHex(33)}` : `0x${generateRandomHex(40)}`)
    : (accountFormat === 'CLABE_18' 
        ? generateMockCLABE(bank?.code || '012')
        : (accountFormat === 'PAN_16' 
            ? generateMockPAN(bank?.code) 
            : generateMockDiMo(bank?.code)));

  // Chance to hit a real blacklist entry
  const blacklistDb = loadBlacklistCatalog();
  const shouldHitBlacklist = (forceReprobable && Math.random() < 0.45) || Math.random() < 0.12;
  if (shouldHitBlacklist && blacklistDb.length > 0) {
    const candidate = randomElement(blacklistDb);
    origName = candidate.entityName;
    if (candidate.identifierType === 'RFC_TAX_ID') {
      origRfc = candidate.identifierOrAddress;
    } else if (candidate.identifierType === 'CRYPTO_ADDRESS') {
      accountOrAddress = candidate.identifierOrAddress;
    } else if (candidate.identifierType === 'BANK_CLABE') {
      accountOrAddress = candidate.identifierOrAddress;
      accountFormat = 'CLABE_18';
    } else if (candidate.identifierType === 'CARD_PAN_16') {
      accountOrAddress = candidate.identifierOrAddress;
      accountFormat = 'PAN_16';
    } else if (candidate.identifierType === 'DIMO_PHONE_10') {
      accountOrAddress = candidate.identifierOrAddress;
      accountFormat = 'DIMO_10';
    }
  }

  // Active Counterparty Blacklist verification check
  const blacklistHit = checkCounterpartyBlacklist(accountOrAddress, origRfc, origName);
  
  // Decide suspicious characteristics
  const isReprobable = forceReprobable || !!blacklistHit || Math.random() < 0.22;
  const hasMixerHop = isCrypto && (isReprobable || Math.random() < 0.2);
  const isHighRiskCluster = isReprobable || Math.random() < 0.15;
  const isPEP = Math.random() < 0.12;
  const isRapidVelocity = isReprobable || Math.random() < 0.18;
  const isRoundAmountJustBelowThreshold = isReprobable || Math.random() < 0.2;
  
  const originatorJurisdiction = isReprobable && Math.random() < 0.5 
    ? randomElement(['KP', 'IR', 'RU', 'KY', 'PA'])
    : (channel === 'SPEI' ? 'MX' : randomElement(['MX', 'US', 'ES', 'BR', 'CO', 'CA']));

  const kycTier = isReprobable && Math.random() < 0.6
    ? 'NO_VERIFICADO'
    : (isReprobable ? 'TIER_1_BASICO' : randomElement(['TIER_2_ESTANDAR', 'TIER_3_ALTO']));

  // Amounts
  let amount = 0;
  let currency: Transaction['currency'] = 'MXN';
  let amountMXN = 0;

  if (isCrypto) {
    if (cryptoNetwork?.includes('Bitcoin')) {
      currency = 'BTC';
      amount = +(Math.random() * (isReprobable ? 2.5 : 0.4) + 0.01).toFixed(4);
      amountMXN = Math.round(amount * 1850000);
    } else if (cryptoNetwork?.includes('Ethereum')) {
      currency = 'ETH';
      amount = +(Math.random() * (isReprobable ? 18 : 2.5) + 0.1).toFixed(3);
      amountMXN = Math.round(amount * 58000);
    } else if (cryptoNetwork?.includes('Solana')) {
      currency = 'SOL';
      amount = +(Math.random() * (isReprobable ? 350 : 25) + 1).toFixed(2);
      amountMXN = Math.round(amount * 3200);
    } else {
      currency = Math.random() > 0.5 ? 'USDT' : 'USDC';
      amount = Math.round(isRoundAmountJustBelowThreshold ? 7450 : (Math.random() * 45000 + 500));
      amountMXN = Math.round(amount * 19.85);
    }
  } else {
    currency = channel === 'SWIFT' ? 'USD' : 'MXN';
    if (currency === 'USD') {
      amount = Math.round(isRoundAmountJustBelowThreshold ? 9800 : (Math.random() * 60000 + 2000));
      amountMXN = Math.round(amount * 19.85);
    } else {
      amount = isRoundAmountJustBelowThreshold ? 139500 : Math.round(Math.random() * 850000 + 4500);
      amountMXN = amount;
    }
  }

  // Evaluate risk equation with Blacklist Match
  const riskBreakdown = evaluateRiskEquation({
    channel,
    cryptoNetwork,
    amountMXN,
    originatorJurisdiction,
    isPEP,
    kycTier,
    hasMixerHop,
    isRapidVelocity,
    isRoundAmountJustBelowThreshold,
    isHighRiskCluster,
    blacklistMatch: blacklistHit
  });

  const riskLevel = determineRiskLevel(riskBreakdown.totalScore);
  const isAutoSar = riskLevel === 'CRITICAL_REPROBABLE' || !!blacklistHit;

  // Auto-mandate tariff tier if matched on blacklist
  const effectiveFeeOverrides = { ...feeOverrides };
  if (blacklistHit) {
    if (blacklistHit.mandatedAction === 'IMMEDIATE_SEIZURE_20_PCT') {
      effectiveFeeOverrides.isSeized = true;
    } else if (blacklistHit.mandatedAction === 'TEMPORARY_HOLD_8_PCT') {
      effectiveFeeOverrides.isTemporaryHold = true;
      effectiveFeeOverrides.holdReason = `Retención preventiva regulatoria por coincidencia en ${blacklistHit.authorityLabel}`;
    }
  }

  // Calculate Transaction Fee: 1.8% standard, 2.5% risk, 8% hold, 20% seizure
  const feeBreakdown = calculateTransactionFee(amountMXN, riskLevel, effectiveFeeOverrides);

  const txId = isCrypto 
    ? `TX-CRYPTO-${Math.floor(100000 + Math.random() * 900000)}`
    : `TX-${channel}-${Math.floor(100000 + Math.random() * 900000)}`;

  const trackingKey = isCrypto
    ? `0x${generateRandomHex(64)}`
    : `${bank?.code || '012'}${new Date().toISOString().slice(2, 10).replace(/-/g, '')}${Math.floor(1000000000 + Math.random() * 9000000000)}`;

  const now = new Date();
  const timestamp = new Date(now.getTime() - Math.floor(Math.random() * 3600000)).toISOString();

  // Execution microsecond benchmark (typically 80 - 250 µs)
  const executionMicroseconds = Math.floor(65 + Math.random() * 120);

  // Allocate SPEI / Banxico routing node
  const speiRoutingNode = channel === 'SPEI' 
    ? (Math.random() > 0.2 ? 'NODE-BANXICO-01' : 'NODE-STP-02') 
    : undefined;

  return {
    id: txId,
    timestamp,
    channel,
    cryptoNetwork,
    bankCode: bank?.code,
    bankName: bank?.name,
    originator: {
      name: origName,
      taxId: origRfc,
      accountOrAddress,
      kycTier: kycTier as any,
      jurisdiction: originatorJurisdiction,
      isPEP
    },
    beneficiary: {
      name: 'AMLANFAT CUSTODY VAULT MX',
      taxId: 'AOF2409267X9',
      accountOrAddress: '646180123456789012',
      institution: 'STP / AMLanfat Cold Vault',
      jurisdiction: 'MX'
    },
    amount,
    currency,
    amountMXN,
    concept: isCrypto ? `Liquidación de Activo Virtual ${currency}` : (isRoundAmountJustBelowThreshold ? 'Honorarios servicios varios' : 'Pago de proveedores e importación'),
    trackingKey,
    riskBreakdown,
    riskLevel,
    feeBreakdown,
    sarStatus: isAutoSar ? 'AUTO_QUEUED' : 'NONE',
    sarFolio: isAutoSar ? generateSarFolio() : undefined,
    sarDispatchTimestamp: isAutoSar ? new Date().toISOString() : undefined,
    sarReceiptHash: isAutoSar ? generateCryptoSha256Receipt(txId, timestamp, riskBreakdown.totalScore) : undefined,
    storageTier: 'ACTIVE_HOT',
    simulatedAgeDays: isAutoSar ? Math.floor(Math.random() * 15) : 0,
    blockBatchId: batchId,
    executionMicroseconds,
    isBlacklisted: !!blacklistHit,
    blacklistMatch: blacklistHit || undefined,
    speiRoutingNode,
    beneficiaryAccountFormat: channel === 'SPEI' ? accountFormat : undefined
  };
}

export function generateInitialTransactionBatch(count: number = 24): Transaction[] {
  const batchId = `BLOCK-${Date.now().toString(36).toUpperCase()}`;
  const list: Transaction[] = [];
  
  // Guarantee a few reprobable, holds, and seizures to demonstrate the 4 tariff tiers
  for (let i = 0; i < count; i++) {
    const forceReprobable = i === 1 || i === 5 || i === 11 || i === 18;
    
    // Demonstrate 8% Temporary Hold on i === 5
    const isHold = i === 5;
    // Demonstrate 20% Seizure on i === 11 (Tornado cash / OFAC confirmed)
    const isSeizure = i === 11;

    const tx = generateSingleTransaction(batchId, forceReprobable, {
      isTemporaryHold: isHold,
      isSeized: isSeizure,
      holdReason: isHold ? 'Retención temporal de la liquidación (8%) por patrones atípicos de estructuración de fondos en zona fronteriza' : undefined
    });

    if (i === 11) {
      const ofacEntry = loadBlacklistCatalog()[0];
      if (ofacEntry) {
        tx.isBlacklisted = true;
        tx.originator.accountOrAddress = ofacEntry.identifierOrAddress;
        tx.originator.name = ofacEntry.entityName;
        tx.blacklistMatch = {
          matchedAt: tx.timestamp,
          matchedEntity: ofacEntry.entityName,
          matchedIdentifier: ofacEntry.identifierOrAddress,
          authority: ofacEntry.authority,
          authorityLabel: ofacEntry.authorityLabel,
          sanctionOrderFolio: ofacEntry.sanctionOrderFolio,
          mandatedAction: ofacEntry.mandatedAction,
          notes: ofacEntry.notes
        };
      }
    }

    // Give one of the dispatched SARs an initial age of 32 days so the background job has a candidate immediately ready for 30-day archival
    if (i === 1) {
      tx.simulatedAgeDays = 34;
      tx.sarStatus = 'DISPATCHED_UIF';
      tx.sarDispatchTimestamp = new Date(Date.now() - 34 * 86400000).toISOString();
    }
    list.push(tx);
  }
  
  return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}
