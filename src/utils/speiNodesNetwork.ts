import { SpeiNetworkNode, DispenserQueueItem, ReserveFundStats } from '../types/aml';

const STORAGE_KEY_NODES = 'amlanfat_spei_nodes_v1';
const STORAGE_KEY_DISPENSER_QUEUE = 'amlanfat_dispenser_queue_v1';
const STORAGE_KEY_RESERVE_FUNDS = 'amlanfat_reserve_funds_v1';

export const DEFAULT_SPEI_NODES: SpeiNetworkNode[] = [
  {
    id: 'NODE-BANXICO-01',
    name: 'Nodo Banxico Primario LBTR',
    operator: 'Banco de México (Banxico) / Enlace Directo',
    role: 'BANXICO_PRIMARY',
    status: 'ONLINE_PRIMARY',
    latencyMs: 1.2,
    uptimePercentage: 99.998,
    port: 4432,
    protocol: 'mTLS / ISO 20022 Banxico Direct',
    certificateExpiry: '2028-12-31',
    totalDispatchedTxs: 18452,
    volumeDispatchedMXN: 945200000,
    isPrimaryActive: true
  },
  {
    id: 'NODE-STP-02',
    name: 'Nodo STP Redundante (Hot-Standby)',
    operator: 'Sistema de Transferencias y Pagos S.A. de C.V. IFPE',
    role: 'STP_REDUNDANT',
    status: 'ONLINE_HOT_STANDBY',
    latencyMs: 2.8,
    uptimePercentage: 99.985,
    port: 8443,
    protocol: 'REST / IPsec VPN STP Core API',
    certificateExpiry: '2027-09-15',
    totalDispatchedTxs: 4120,
    volumeDispatchedMXN: 210850000,
    isPrimaryActive: false
  },
  {
    id: 'NODE-CECOBAN-03',
    name: 'Nodo Cecoban Conciliación y Compensación',
    operator: 'Centro de Cómputo Bancario S.A. de C.V.',
    role: 'CECOBAN_CLEARING',
    status: 'ONLINE_HOT_STANDBY',
    latencyMs: 3.9,
    uptimePercentage: 99.95,
    port: 9002,
    protocol: 'SFTP Batch / Clearing Cámara Nocturna',
    certificateExpiry: '2027-06-30',
    totalDispatchedTxs: 1290,
    volumeDispatchedMXN: 88400000,
    isPrimaryActive: false
  },
  {
    id: 'NODE-HSM-VAULT-04',
    name: 'Módulo HSM Criptográfico Bóveda Soberana',
    operator: 'AMLanfat FinTech Internal HSM Cluster (FIPS 140-2 Level 3)',
    role: 'AMLANFAT_HSM_VAULT',
    status: 'ONLINE_PRIMARY',
    latencyMs: 0.4,
    uptimePercentage: 100.0,
    port: 5000,
    protocol: 'PKCS#11 Hardware Security Module',
    certificateExpiry: '2030-01-01',
    totalDispatchedTxs: 23862,
    volumeDispatchedMXN: 1244450000,
    isPrimaryActive: true
  }
];

export const DEFAULT_RESERVE_STATS: ReserveFundStats = {
  totalReserveFundMXN: 28500000, // 28.5 MDP en resguardo
  minimumRegulatoryRatio: 100, // Art. 22 Ley Fintech exige mínimo 100% de fondos en resguardo
  currentCoverageRatio: 114.8, // 114.8% cobertura actual
  liquidDemandLiabilitiesMXN: 24825000, // Pasivos a la vista
  safeguardedAccounts: [
    {
      institution: 'Banco de México (Banxico)',
      accountNumber: 'BANXICO-RESGUARDO-ART22-09482',
      balanceMXN: 18500000,
      custodyType: 'Cuenta de Depósito a la Vista Exclusiva de Salvaguarda (Banxico Directo)',
      verifiedByBanxico: true
    },
    {
      institution: 'Nacional Financiera S.N.C. (NAFIN)',
      accountNumber: 'NAFIN-FIDEICOMISO-GARANTIA-4891',
      balanceMXN: 6000000,
      custodyType: 'Fideicomiso Irrevocable de Garantía y Cumplimiento Regulatorio',
      verifiedByBanxico: true
    },
    {
      institution: 'BBVA México (Banca Corporativa Institucional)',
      accountNumber: '012180001948271049',
      balanceMXN: 4000000,
      custodyType: 'Cuenta Bancaria Concentradora Segregada con Bloqueo de Embargo',
      verifiedByBanxico: true
    }
  ]
};

export const INITIAL_DISPENSER_QUEUE: DispenserQueueItem[] = [
  {
    id: 'DSP-2026-901',
    timestamp: new Date(Date.now() - 4 * 60000).toISOString(),
    accountFormat: 'CLABE_18',
    targetCLABE: '012180004512345678',
    targetBank: 'BBVA México (012)',
    beneficiaryName: 'MINERALES Y LOGÍSTICA DEL BAJÍO S.A.',
    amountMXN: 185000,
    allocatedNodeId: 'NODE-BANXICO-01',
    trackingKey: '012202609260018491028',
    cepFolio: 'CEP-BANXICO-2026-B8194',
    status: 'DISPENSED_SETTLED',
    reserveFundDeducted: true
  },
  {
    id: 'DSP-2026-902',
    timestamp: new Date(Date.now() - 2 * 60000).toISOString(),
    accountFormat: 'PAN_16',
    targetCLABE: '4915661234901827',
    targetBank: 'Banorte · Visa Débito (PAN 16d)',
    beneficiaryName: 'DISTRIBUIDORA AGROPECUARIA MONTERREY',
    amountMXN: 340000,
    allocatedNodeId: 'NODE-BANXICO-01',
    trackingKey: '072202609260091827401',
    cepFolio: 'CEP-BANXICO-2026-C4410',
    status: 'DISPENSED_SETTLED',
    reserveFundDeducted: true
  },
  {
    id: 'DSP-2026-903',
    timestamp: new Date(Date.now() - 45000).toISOString(),
    accountFormat: 'DIMO_10',
    targetCLABE: '5584910283',
    targetBank: 'STP · DiMo Banxico Móvil (10d)',
    beneficiaryName: 'OPERADORA DE PAGOS DIGITALES REGULADA',
    amountMXN: 95000,
    allocatedNodeId: 'NODE-BANXICO-01',
    trackingKey: '646202609260049281749',
    cepFolio: 'CEP-BANXICO-PENDING',
    status: 'QUEUED',
    reserveFundDeducted: false
  },
  {
    id: 'DSP-2026-904',
    timestamp: new Date(Date.now() - 15000).toISOString(),
    accountFormat: 'PAN_16',
    targetCLABE: '5164889018274619',
    targetBank: 'Nu México · Mastercard Débito (PAN 16d)',
    beneficiaryName: 'COMERCIALIZADORA SMARTPAY MÉXICO',
    amountMXN: 48500,
    allocatedNodeId: 'NODE-STP-02',
    trackingKey: '638202609260098231456',
    cepFolio: 'CEP-BANXICO-PENDING',
    status: 'QUEUED',
    reserveFundDeducted: false
  },
  {
    id: 'DSP-2026-905',
    timestamp: new Date(Date.now() - 12000).toISOString(),
    accountFormat: 'PAN_16',
    targetCLABE: '4037561234567899',
    targetBank: 'Banco del Bienestar · Visa Débito (PAN 16d)',
    beneficiaryName: 'COOPERATIVA AGROALIMENTARIA BIENESTAR',
    amountMXN: 125000,
    allocatedNodeId: 'NODE-BANXICO-01',
    trackingKey: '166202609260049182740',
    cepFolio: 'CEP-BANXICO-PENDING',
    status: 'QUEUED',
    reserveFundDeducted: false
  },
  {
    id: 'DSP-2026-906',
    timestamp: new Date(Date.now() - 9000).toISOString(),
    accountFormat: 'PAN_16',
    targetCLABE: '4772831234567895',
    targetBank: 'Spin by Oxxo · Visa Débito IFPE (PAN 16d)',
    beneficiaryName: 'CADENA COMERCIAL RETAIL DEL NORTE',
    amountMXN: 54000,
    allocatedNodeId: 'NODE-STP-02',
    trackingKey: '677202609260081927364',
    cepFolio: 'CEP-BANXICO-PENDING',
    status: 'QUEUED',
    reserveFundDeducted: false
  },
  {
    id: 'DSP-2026-907',
    timestamp: new Date(Date.now() - 6000).toISOString(),
    accountFormat: 'DIMO_10',
    targetCLABE: '5638192044',
    targetBank: 'Mercado Pago W · DiMo Banxico Móvil (10d)',
    beneficiaryName: 'PAGOS DIGITALES WALLET MÉXICO S.A.',
    amountMXN: 78000,
    allocatedNodeId: 'NODE-BANXICO-01',
    trackingKey: '846202609260071829304',
    cepFolio: 'CEP-BANXICO-PENDING',
    status: 'QUEUED',
    reserveFundDeducted: false
  },
  {
    id: 'DSP-2026-908',
    timestamp: new Date(Date.now() - 3000).toISOString(),
    accountFormat: 'DIMO_10',
    targetCLABE: '3318924710',
    targetBank: 'BanCoppel · DiMo Banxico Móvil (10d)',
    beneficiaryName: 'TIENDAS Y DISTRIBUIDORA COPPEL S.A.',
    amountMXN: 62000,
    allocatedNodeId: 'NODE-BANXICO-01',
    trackingKey: '137202609260039182745',
    cepFolio: 'CEP-BANXICO-PENDING',
    status: 'QUEUED',
    reserveFundDeducted: false
  }
];

export function loadSpeiNodes(): SpeiNetworkNode[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_NODES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error loading spei nodes:', e);
  }
  return DEFAULT_SPEI_NODES;
}

export function saveSpeiNodes(nodes: SpeiNetworkNode[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_NODES, JSON.stringify(nodes));
  } catch (e) {
    console.error('Error saving spei nodes:', e);
  }
}

export function loadDispenserQueue(): DispenserQueueItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DISPENSER_QUEUE);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error loading dispenser queue:', e);
  }
  return INITIAL_DISPENSER_QUEUE;
}

export function saveDispenserQueue(queue: DispenserQueueItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_DISPENSER_QUEUE, JSON.stringify(queue));
  } catch (e) {
    console.error('Error saving dispenser queue:', e);
  }
}

export function loadReserveFunds(): ReserveFundStats {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_RESERVE_FUNDS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.totalReserveFundMXN) return parsed;
    }
  } catch (e) {
    console.error('Error loading reserve funds:', e);
  }
  return DEFAULT_RESERVE_STATS;
}

export function saveReserveFunds(stats: ReserveFundStats): void {
  try {
    localStorage.setItem(STORAGE_KEY_RESERVE_FUNDS, JSON.stringify(stats));
  } catch (e) {
    console.error('Error saving reserve funds:', e);
  }
}
