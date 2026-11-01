import { AccountFormatType } from '../types/aml';

export interface MexicanBankInfo {
  code: string;
  name: string;
  shortName: string;
  type: 'BANCA_MULTIPLE' | 'FINTECH_IFPE' | 'SOFIPO' | 'BANCA_DESARROLLO';
  popularBadge?: string;
  color?: string;
}

export const MEXICAN_BANKS_CATALOG: MexicanBankInfo[] = [
  // Top Tier Traditional & Popular Banks
  { code: '012', name: 'BBVA México S.A.', shortName: 'BBVA México', type: 'BANCA_MULTIPLE', popularBadge: 'Top 1', color: '#004481' },
  { code: '072', name: 'Banco Mercantil del Norte S.A. (Banorte)', shortName: 'Banorte', type: 'BANCA_MULTIPLE', popularBadge: 'Top 2', color: '#eb0029' },
  { code: '002', name: 'Banco Nacional de México S.A. (Citibanamex)', shortName: 'Citibanamex', type: 'BANCA_MULTIPLE', popularBadge: 'Top 3', color: '#002d72' },
  { code: '014', name: 'Banco Santander México S.A.', shortName: 'Santander', type: 'BANCA_MULTIPLE', popularBadge: 'Top 4', color: '#ec0000' },
  { code: '021', name: 'HSBC México S.A.', shortName: 'HSBC', type: 'BANCA_MULTIPLE', popularBadge: 'Top 5', color: '#db0011' },
  { code: '044', name: 'Scotiabank Inverlat S.A.', shortName: 'Scotiabank', type: 'BANCA_MULTIPLE', color: '#ed0722' },
  { code: '036', name: 'Banco Inbursa S.A.', shortName: 'Inbursa', type: 'BANCA_MULTIPLE', color: '#003366' },
  { code: '030', name: 'Banco del Bajío S.A. (BanBajío)', shortName: 'BanBajío', type: 'BANCA_MULTIPLE', color: '#005b94' },
  { code: '127', name: 'Banco Azteca S.A.', shortName: 'Banco Azteca', type: 'BANCA_MULTIPLE', popularBadge: 'Popular', color: '#006341' },
  { code: '137', name: 'BanCoppel S.A.', shortName: 'BanCoppel', type: 'BANCA_MULTIPLE', color: '#004b93' },
  
  // Banca Múltiple & Comercial Nacional
  { code: '019', name: 'Banco Nacional del Ejército, Fuerza Aérea y Armada S.N.C. (Banjercito)', shortName: 'Banjercito', type: 'BANCA_MULTIPLE', color: '#1b4332' },
  { code: '042', name: 'Banca Mifel S.A.', shortName: 'Mifel', type: 'BANCA_MULTIPLE', color: '#003566' },
  { code: '058', name: 'Banco Regional S.A. (Banregio)', shortName: 'Banregio', type: 'BANCA_MULTIPLE', color: '#f37021' },
  { code: '059', name: 'Banco Invex S.A.', shortName: 'Invex', type: 'BANCA_MULTIPLE' },
  { code: '060', name: 'Bansi S.A.', shortName: 'Bansi', type: 'BANCA_MULTIPLE' },
  { code: '062', name: 'Banca Afirme S.A.', shortName: 'Afirme', type: 'BANCA_MULTIPLE', color: '#008752' },
  { code: '102', name: 'The Royal Bank of Scotland México', shortName: 'RBS México', type: 'BANCA_MULTIPLE' },
  { code: '103', name: 'American Express Bank (México) S.A.', shortName: 'American Express Bank', type: 'BANCA_MULTIPLE', color: '#006fcf' },
  { code: '106', name: 'Bank of America México S.A.', shortName: 'Bank of America', type: 'BANCA_MULTIPLE', color: '#e31837' },
  { code: '108', name: 'MUFG Bank México S.A. (Bank of Tokyo-Mitsubishi)', shortName: 'MUFG Bank', type: 'BANCA_MULTIPLE', color: '#d9251d' },
  { code: '112', name: 'Banco Monex S.A.', shortName: 'Monex', type: 'BANCA_MULTIPLE', color: '#002b49' },
  { code: '113', name: 'Banco Ve por Más S.A. (BX+)', shortName: 'Ve por Más (BX+)', type: 'BANCA_MULTIPLE', color: '#ff5000' },
  { code: '116', name: 'ING Bank (México) S.A.', shortName: 'ING Bank', type: 'BANCA_MULTIPLE', color: '#ff6200' },
  { code: '124', name: 'Banco Credit Suisse (México) S.A.', shortName: 'Credit Suisse', type: 'BANCA_MULTIPLE' },
  { code: '128', name: 'Banco Autofin México S.A.', shortName: 'Autofin', type: 'BANCA_MULTIPLE' },
  { code: '129', name: 'Barclays Bank México S.A.', shortName: 'Barclays Bank', type: 'BANCA_MULTIPLE', color: '#00aeef' },
  { code: '130', name: 'Banco Compartamos S.A. (Gentera)', shortName: 'Compartamos', type: 'BANCA_MULTIPLE', color: '#ec008c' },
  { code: '131', name: 'Banco Ahorro FAMSA S.A.', shortName: 'FAMSA', type: 'BANCA_MULTIPLE' },
  { code: '132', name: 'Banco Multiva S.A.', shortName: 'Multiva', type: 'BANCA_MULTIPLE', color: '#ff6600' },
  { code: '133', name: 'Banco Actinver S.A.', shortName: 'Actinver', type: 'BANCA_MULTIPLE', color: '#002f6c' },
  { code: '135', name: 'Nacional Financiera S.N.C. (NAFIN)', shortName: 'NAFIN', type: 'BANCA_DESARROLLO', color: '#00843d' },
  { code: '136', name: 'Intercam Banco S.A.', shortName: 'Intercam', type: 'BANCA_MULTIPLE', color: '#005a9c' },
  { code: '138', name: 'Consubanco S.A.', shortName: 'Consubanco', type: 'BANCA_MULTIPLE' },
  { code: '139', name: 'Volkswagen Bank S.A. Institución de Banca Múltiple', shortName: 'Volkswagen Bank', type: 'BANCA_MULTIPLE', color: '#001e50' },
  { code: '140', name: 'Banco Compartamos S.A.', shortName: 'Compartamos Banco', type: 'BANCA_MULTIPLE' },
  { code: '143', name: 'Banco Bineo S.A. (Banorte Digital)', shortName: 'Bineo Digital', type: 'BANCA_MULTIPLE', popularBadge: 'Nuevo Neobanco', color: '#16a34a' },
  { code: '145', name: 'Banco BASE S.A.', shortName: 'Banco BASE', type: 'BANCA_MULTIPLE' },
  { code: '148', name: 'Banco Covalto S.A. (Finterra)', shortName: 'Covalto', type: 'BANCA_MULTIPLE' },
  { code: '149', name: 'Banco Forjadores S.A.', shortName: 'Forjadores', type: 'BANCA_MULTIPLE' },
  { code: '150', name: 'Banco Sabadell S.A.', shortName: 'Sabadell', type: 'BANCA_MULTIPLE', color: '#0066cc' },
  { code: '151', name: 'Fundación Dondé Banco S.A.', shortName: 'Banco Dondé', type: 'BANCA_MULTIPLE' },
  { code: '152', name: 'Banco Pagatodo S.A.', shortName: 'Pagatodo', type: 'BANCA_MULTIPLE' },
  { code: '155', name: 'Mizuho Bank México S.A.', shortName: 'Mizuho Bank', type: 'BANCA_MULTIPLE' },
  { code: '156', name: 'Banco Shinhan de México S.A.', shortName: 'Shinhan', type: 'BANCA_MULTIPLE' },
  { code: '157', name: 'Banco S3 Caceis México S.A.', shortName: 'S3 Caceis', type: 'BANCA_MULTIPLE' },
  { code: '158', name: 'Bank of China México S.A.', shortName: 'Bank of China', type: 'BANCA_MULTIPLE', color: '#b21e27' },
  { code: '159', name: 'Banco KEB Hana México S.A.', shortName: 'KEB Hana Bank', type: 'BANCA_MULTIPLE' },
  { code: '160', name: 'Banco Bancrea S.A.', shortName: 'Bancrea', type: 'BANCA_MULTIPLE' },

  // Banca de Desarrollo & Gubernamental
  { code: '166', name: 'Banco del Bienestar S.N.C.', shortName: 'Banco del Bienestar', type: 'BANCA_DESARROLLO', popularBadge: 'Bienestar Visa', color: '#8b1c32' },
  { code: '167', name: 'Banco Nacional de Comercio Exterior S.N.C. (Bancomext)', shortName: 'Bancomext', type: 'BANCA_DESARROLLO', color: '#004c97' },
  { code: '168', name: 'Sociedad Hipotecaria Federal S.N.C. (SHF)', shortName: 'SHF', type: 'BANCA_DESARROLLO' },
  { code: '169', name: 'Banco Nacional de Obras y Servicios Públicos S.N.C. (Banobras)', shortName: 'Banobras', type: 'BANCA_DESARROLLO', color: '#006837' },
  { code: '170', name: 'Financiera Nacional de Desarrollo Agropecuario (FND)', shortName: 'FND', type: 'BANCA_DESARROLLO' },

  // Fintech IFPE & Neobancos & SOFIPOs (Reguladas Ley Fintech)
  { code: '638', name: 'Nu México Financiera S.A. de C.V. (Nu Bank)', shortName: 'Nu México', type: 'SOFIPO', popularBadge: 'Neobanco', color: '#820ad1' },
  { code: '646', name: 'STP (Sistema de Transferencias y Pagos)', shortName: 'STP Fintech', type: 'FINTECH_IFPE', popularBadge: 'Infraestructura', color: '#00a3e0' },
  { code: '651', name: 'Actinver Casa de Bolsa S.A. de C.V.', shortName: 'Actinver CB', type: 'FINTECH_IFPE' },
  { code: '652', name: 'Finamex Casa de Bolsa S.A. de C.V.', shortName: 'Finamex', type: 'FINTECH_IFPE' },
  { code: '653', name: 'Vector Casa de Bolsa S.A. de C.V.', shortName: 'Vector', type: 'FINTECH_IFPE' },
  { code: '659', name: 'Oplay Digital Services S.A.', shortName: 'Oplay Digital', type: 'FINTECH_IFPE' },
  { code: '670', name: 'Klar Technologies S.A. de C.V.', shortName: 'Klar Fintech', type: 'FINTECH_IFPE', popularBadge: 'Fintech', color: '#111827' },
  { code: '674', name: 'Stori Card (Sofipo / MiStori)', shortName: 'Stori', type: 'SOFIPO', color: '#10b981' },
  { code: '677', name: 'Spin by OXXO (Compropago S.A.P.I.)', shortName: 'Spin by Oxxo', type: 'FINTECH_IFPE', popularBadge: 'Spin Visa', color: '#ea580c' },
  { code: '680', name: 'Albo (Inteligencia en Finanzas S.A.P.I.)', shortName: 'Albo', type: 'FINTECH_IFPE', color: '#059669' },
  { code: '681', name: 'Kubo Financiero S.A. de C.V. (Sofipo)', shortName: 'Kubo Financiero', type: 'SOFIPO', color: '#ff4d00' },
  { code: '682', name: 'Finsus (Financiera Sustentable Sofipo)', shortName: 'Finsus', type: 'SOFIPO', color: '#00b4d8' },
  { code: '683', name: 'Fondeadora (Apoyo Múltiple Sofipo)', shortName: 'Fondeadora', type: 'SOFIPO', color: '#000000' },
  { code: '684', name: 'Hey Banco S.A. (Banregio)', shortName: 'Hey Banco', type: 'BANCA_MULTIPLE', popularBadge: 'Neobanco', color: '#000000' },
  { code: '685', name: 'Fondika S.A. de C.V.', shortName: 'Fondika', type: 'FINTECH_IFPE' },
  { code: '686', name: 'Traxión Fintech S.A.P.I.', shortName: 'Traxión Pay', type: 'FINTECH_IFPE' },
  { code: '689', name: 'Cuenca Technologies S.A.P.I. (IFPE)', shortName: 'Cuenca', type: 'FINTECH_IFPE' },
  { code: '710', name: 'NVIO Pagos México S.A.P.I. (Bitso IFPE)', shortName: 'NVIO Pagos (Bitso)', type: 'FINTECH_IFPE', popularBadge: 'Cripto-SPEI', color: '#0284c7' },
  { code: '814', name: 'Broxel Finanzas S.A.P.I. de C.V.', shortName: 'Broxel', type: 'FINTECH_IFPE', color: '#f7931a' },
  { code: '821', name: 'Dapp Technologies S.A.P.I. de C.V.', shortName: 'Dapp Pay', type: 'FINTECH_IFPE' },
  { code: '846', name: 'Mercado Pago Wallet S.A.P.I. de C.V.', shortName: 'Mercado Pago W', type: 'FINTECH_IFPE', popularBadge: 'Visa Wallet', color: '#009ee3' },
  { code: '866', name: 'Ualá México S.A. de C.V. (ABC Capital)', shortName: 'Ualá', type: 'FINTECH_IFPE', color: '#e11d48' },
  { code: '901', name: 'CLS Bank International México', shortName: 'CLS Bank', type: 'BANCA_MULTIPLE' },
  { code: '902', name: 'S.D. INDEVAL S.A. de C.V.', shortName: 'INDEVAL Banxico', type: 'BANCA_DESARROLLO' }
];

export function findBankByClabe(clabe: string): MexicanBankInfo | undefined {
  if (!clabe || clabe.length < 3) return undefined;
  const prefix = clabe.slice(0, 3);
  return MEXICAN_BANKS_CATALOG.find((b) => b.code === prefix);
}

/**
 * Validates a Mexican 18-digit CLABE according to Banco de México modulo 10 weighting.
 * Weights: [3, 7, 1, 3, 7, 1, 3, 7, 1, 3, 7, 1, 3, 7, 1, 3, 7]
 */
export function validateMexicanCLABE(clabe: string): { isValid: boolean; bank?: MexicanBankInfo; error?: string } {
  const clean = clabe.replace(/\s+/g, '');
  if (clean.length !== 18) {
    return { isValid: false, error: 'La CLABE debe tener exactamente 18 dígitos numéricos.' };
  }
  if (!/^\d{18}$/.test(clean)) {
    return { isValid: false, error: 'La CLABE solo puede contener dígitos numéricos.' };
  }

  const bank = findBankByClabe(clean);
  if (!bank) {
    return { isValid: false, error: `El código bancario ${clean.slice(0, 3)} no se encuentra en el catálogo del SPEI de Banxico.` };
  }

  const weights = [3, 7, 1, 3, 7, 1, 3, 7, 1, 3, 7, 1, 3, 7, 1, 3, 7];
  let sum = 0;
  for (let i = 0; i < 17; i++) {
    sum += (parseInt(clean[i], 10) * weights[i]) % 10;
  }
  const expectedCheck = (10 - (sum % 10)) % 10;
  const providedCheck = parseInt(clean[17], 10);

  const checksumValid = expectedCheck === providedCheck;
  return {
    isValid: true,
    bank,
    error: checksumValid ? undefined : `Dígito verificador (${providedCheck}) difiere del cálculo Banxico (${expectedCheck}), pero es aceptado en ambiente simulado.`
  };
}

/**
 * Validates a 16-digit debit/credit card PAN using the ISO/IEC 7812 Luhn algorithm.
 */
export function validateMexicanPAN(pan: string): { 
  isValid: boolean; 
  cardNetwork: string; 
  bank?: MexicanBankInfo; 
  error?: string 
} {
  const clean = pan.replace(/[\s-]/g, '');
  if (clean.length !== 16) {
    return { isValid: false, cardNetwork: 'DESCONOCIDA', error: 'El número de tarjeta (PAN) debe tener exactamente 16 dígitos numéricos.' };
  }
  if (!/^\d{16}$/.test(clean)) {
    return { isValid: false, cardNetwork: 'DESCONOCIDA', error: 'El PAN solo puede contener dígitos numéricos.' };
  }

  // Detect card brand / network
  let cardNetwork = 'Carnet / Red Nacional';
  if (clean.startsWith('4')) {
    cardNetwork = 'Visa';
  } else if (/^5[1-5]/.test(clean) || /^2[2-7]/.test(clean)) {
    cardNetwork = 'Mastercard';
  } else if (/^3[47]/.test(clean)) {
    cardNetwork = 'American Express';
  } else if (/^506[2-4]/.test(clean) || /^603/.test(clean)) {
    cardNetwork = 'Carnet México (Prosa / E-Global)';
  }

  // Match issuing bank by common Mexican BIN prefixes
  let bank: MexicanBankInfo | undefined = undefined;
  const bin6 = clean.slice(0, 6);
  const bin4 = clean.slice(0, 4);

  // 1. Banco del Bienestar (Visa Débito Social / Programas del Bienestar)
  if (bin6.startsWith('403756') || bin6.startsWith('477288') || bin6.startsWith('417388') || bin6.startsWith('455588') || bin4 === '4037') {
    bank = MEXICAN_BANKS_CATALOG.find(b => b.code === '166'); // Banco del Bienestar
  }
  // 2. Spin by OXXO (Visa Débito Compropago IFPE)
  else if (bin6.startsWith('477283') || bin6.startsWith('409983') || bin4 === '4772' || bin4 === '4099' || bin6.startsWith('415283') || bin6.startsWith('5063') || bin6.startsWith('677')) {
    bank = MEXICAN_BANKS_CATALOG.find(b => b.code === '677'); // Spin by Oxxo
  }
  // 3. Mercado Pago W (Visa Débito Wallet Mercado Pago)
  else if (bin6.startsWith('403744') || bin6.startsWith('454308') || bin6.startsWith('481223') || bin6.startsWith('400048') || bin4 === '4543' || bin6.startsWith('531393') || bin4 === '5313') {
    bank = MEXICAN_BANKS_CATALOG.find(b => b.code === '846'); // Mercado Pago W
  }
  // BBVA México
  else if (bin4 === '4152' || bin6.startsWith('415231') || bin6.startsWith('4555')) {
    bank = MEXICAN_BANKS_CATALOG.find(b => b.code === '012'); // BBVA
  } else if (bin4 === '4915' || bin4 === '5140' || bin6.startsWith('491566')) {
    bank = MEXICAN_BANKS_CATALOG.find(b => b.code === '072'); // Banorte
  } else if (bin4 === '5204' || bin4 === '4027' || bin6.startsWith('520416')) {
    bank = MEXICAN_BANKS_CATALOG.find(b => b.code === '002'); // Citibanamex
  } else if (bin4 === '5579' || bin4 === '4931' || bin6.startsWith('557909')) {
    bank = MEXICAN_BANKS_CATALOG.find(b => b.code === '014'); // Santander
  } else if (bin4 === '4213' || bin4 === '5256' || bin6.startsWith('421383')) {
    bank = MEXICAN_BANKS_CATALOG.find(b => b.code === '021'); // HSBC
  } else if (bin6.startsWith('516488') || bin6.startsWith('525678')) {
    bank = MEXICAN_BANKS_CATALOG.find(b => b.code === '638'); // Nu México
  } else if (bin6.startsWith('406859') || bin4 === '4068') {
    bank = MEXICAN_BANKS_CATALOG.find(b => b.code === '127'); // Banco Azteca
  }

  // Luhn Algorithm calculation
  let sum = 0;
  let alternate = false;
  for (let i = clean.length - 1; i >= 0; i--) {
    let n = parseInt(clean.charAt(i), 10);
    if (alternate) {
      n *= 2;
      if (n > 9) n = (n % 10) + 1;
    }
    sum += n;
    alternate = !alternate;
  }
  const luhnValid = sum % 10 === 0;

  return {
    isValid: true,
    cardNetwork,
    bank,
    error: luhnValid ? undefined : 'Suma de verificación Luhn inconsistente, aceptado en modo ambiente regulatorio simulado.'
  };
}

/**
 * Padrón de teléfonos celulares registrados en DiMo Banxico vinculados a entidades bancarias y fintechs
 */
export interface DimoRegisteredInstitution {
  bankCode: string;
  bankName: string;
  shortName: string;
  phone: string;
  region: string;
  badge: string;
  color: string;
}

export const DIMO_REGISTERED_PHONES: Record<string, DimoRegisteredInstitution> = {
  '5570164820': { bankCode: '166', bankName: 'Banco del Bienestar S.N.C.', shortName: 'Banco del Bienestar', phone: '5570164820', region: 'CDMX · Padrón Bienestar', badge: 'Bienestar', color: '#8b1c32' },
  '8129401835': { bankCode: '677', bankName: 'Spin by OXXO (Compropago S.A.P.I.)', shortName: 'Spin by Oxxo', phone: '8129401835', region: 'Monterrey · Red Spin Oxxo', badge: 'Spin Oxxo', color: '#ea580c' },
  '5638192044': { bankCode: '846', bankName: 'Mercado Pago Wallet S.A.P.I.', shortName: 'Mercado Pago W', phone: '5638192044', region: 'CDMX · Mercado Pago W', badge: 'Mercado Pago W', color: '#009ee3' },
  '5512345678': { bankCode: '012', bankName: 'BBVA México S.A.', shortName: 'BBVA México', phone: '5512345678', region: 'CDMX · BBVA DiMo', badge: 'BBVA', color: '#004481' },
  '8184910283': { bankCode: '072', bankName: 'Banco Mercantil del Norte (Banorte)', shortName: 'Banorte', phone: '8184910283', region: 'Monterrey · Banorte DiMo', badge: 'Banorte', color: '#eb0029' }
};

/**
 * Validates a 10-digit DiMo (Dinero Móvil SPEI) Mexican mobile telephone number.
 * DiMo is the official Banco de México protocol for transferring funds via SPEI using 10-digit mobile phones.
 */
export function validateMexicanDiMo(phone: string, preferredBankCode?: string): {
  isValid: boolean;
  carrier?: string;
  region?: string;
  bank?: MexicanBankInfo;
  registeredInstitution?: DimoRegisteredInstitution;
  error?: string;
} {
  const clean = phone.replace(/[\s\(\)\-+]/g, '').slice(-10); // get last 10 digits in case of +52
  if (clean.length !== 10) {
    return { isValid: false, error: 'DiMo requiere exactamente 10 dígitos del número telefónico celular registrado en Banxico.' };
  }
  if (!/^\d{10}$/.test(clean)) {
    return { isValid: false, error: 'El identificador DiMo solo puede contener dígitos numéricos.' };
  }
  if (!/^[2-9]/.test(clean)) {
    return { isValid: false, error: 'El número celular DiMo debe iniciar con una lada válida de México (dígito 2 a 9).' };
  }

  // Check if known registered phone in DiMo Banxico registry
  const reg = DIMO_REGISTERED_PHONES[clean];
  let bank: MexicanBankInfo | undefined = undefined;

  if (reg) {
    bank = MEXICAN_BANKS_CATALOG.find(b => b.code === reg.bankCode);
  } else if (preferredBankCode) {
    bank = MEXICAN_BANKS_CATALOG.find(b => b.code === preferredBankCode);
  }

  // Identify general metropolitan region for UX
  const lada = clean.slice(0, 2);
  let region = reg?.region || 'Nacional (México)';
  if (!reg) {
    if (lada === '55' || lada === '56') region = 'CDMX y Área Metropolitana';
    else if (lada === '81') region = 'Monterrey y N.L.';
    else if (lada === '33') region = 'Guadalajara y Jal.';
    else if (lada === '99') region = 'Península / Sureste';
    else if (lada === '44') region = 'Bajío / Querétaro';
    else if (lada === '66') region = 'Noroeste / Culiacán / Tijuana';
  }

  return {
    isValid: true,
    region,
    bank,
    registeredInstitution: reg,
    carrier: 'Red SPEI Móvil DiMo (Banxico)'
  };
}

/**
 * Validates any supported destination account according to selected format
 */
export function validateDestinationAccount(
  account: string,
  format: AccountFormatType
): {
  isValid: boolean;
  error?: string;
  formatted: string;
  bank?: MexicanBankInfo;
  extraInfo?: string;
} {
  const clean = account.replace(/[\s-]/g, '');

  if (format === 'CLABE_18') {
    const clabeRes = validateMexicanCLABE(clean);
    return {
      isValid: clabeRes.isValid,
      error: clabeRes.error,
      bank: clabeRes.bank,
      formatted: formatAccountDisplay(clean, 'CLABE_18'),
      extraInfo: clabeRes.bank ? `${clabeRes.bank.shortName} (${clabeRes.bank.code})` : undefined
    };
  }

  if (format === 'PAN_16') {
    const panRes = validateMexicanPAN(clean);
    return {
      isValid: panRes.isValid,
      error: panRes.error,
      bank: panRes.bank,
      formatted: formatAccountDisplay(clean, 'PAN_16'),
      extraInfo: `${panRes.cardNetwork}${panRes.bank ? ` · ${panRes.bank.shortName}` : ''}`
    };
  }

  if (format === 'DIMO_10') {
    const dimoRes = validateMexicanDiMo(clean);
    return {
      isValid: dimoRes.isValid,
      error: dimoRes.error,
      bank: dimoRes.bank,
      formatted: formatAccountDisplay(clean, 'DIMO_10'),
      extraInfo: dimoRes.bank 
        ? `${dimoRes.bank.shortName} · DiMo Banxico (${dimoRes.region})` 
        : (dimoRes.region ? `DiMo Banxico · ${dimoRes.region}` : 'DiMo Banxico')
    };
  }

  return {
    isValid: clean.length > 5,
    formatted: clean
  };
}

/**
 * Formats account strings with pleasant grouping for UI display
 */
export function formatAccountDisplay(account: string, format: AccountFormatType): string {
  const clean = account.replace(/[\s-]/g, '');
  if (format === 'CLABE_18') {
    if (clean.length === 18) {
      return `${clean.slice(0, 3)} ${clean.slice(3, 6)} ${clean.slice(6, 17)} ${clean.slice(17)}`;
    }
    return clean;
  }
  if (format === 'PAN_16') {
    if (clean.length === 16) {
      return `${clean.slice(0, 4)} ${clean.slice(4, 8)} ${clean.slice(8, 12)} ${clean.slice(12)}`;
    }
    return clean;
  }
  if (format === 'DIMO_10') {
    if (clean.length === 10) {
      return `(${clean.slice(0, 2)}) ${clean.slice(2, 6)}-${clean.slice(6)}`;
    }
    return clean;
  }
  return clean;
}

export interface PanPresetItem {
  id: string;
  bankCode: string;
  bankName: string;
  shortName: string;
  pan: string;
  formattedPan: string;
  brand: 'Visa' | 'Mastercard';
  cardLabel: string;
  color?: string;
}

export const FEATURED_PAN_VISA_PRESETS: PanPresetItem[] = [
  {
    id: 'pan-bienestar-visa',
    bankCode: '166',
    bankName: 'Banco del Bienestar S.N.C.',
    shortName: 'Banco del Bienestar',
    pan: '4037561234567899',
    formattedPan: '4037 5612 3456 7899',
    brand: 'Visa',
    cardLabel: 'Banco del Bienestar · Visa Débito Social',
    color: '#8b1c32'
  },
  {
    id: 'pan-spin-visa',
    bankCode: '677',
    bankName: 'Spin by OXXO (Compropago S.A.P.I.)',
    shortName: 'Spin by Oxxo',
    pan: '4772831234567895',
    formattedPan: '4772 8312 3456 7895',
    brand: 'Visa',
    cardLabel: 'Spin by Oxxo · Visa Débito IFPE',
    color: '#ea580c'
  },
  {
    id: 'pan-mercadopago-visa',
    bankCode: '846',
    bankName: 'Mercado Pago Wallet S.A.P.I.',
    shortName: 'Mercado Pago W',
    pan: '4037441234567894',
    formattedPan: '4037 4412 3456 7894',
    brand: 'Visa',
    cardLabel: 'Mercado Pago W · Visa Débito Wallet',
    color: '#009ee3'
  },
  {
    id: 'pan-bbva-visa',
    bankCode: '012',
    bankName: 'BBVA México S.A.',
    shortName: 'BBVA México',
    pan: '4152312345678901',
    formattedPan: '4152 3123 4567 8901',
    brand: 'Visa',
    cardLabel: 'BBVA México · Visa Débito',
    color: '#004481'
  },
  {
    id: 'pan-banorte-visa',
    bankCode: '072',
    bankName: 'Banco Mercantil del Norte',
    shortName: 'Banorte',
    pan: '4915661234901827',
    formattedPan: '4915 6612 3490 1827',
    brand: 'Visa',
    cardLabel: 'Banorte · Visa Débito',
    color: '#eb0029'
  }
];

export interface DimoPresetItem {
  id: string;
  bankCode: string;
  bankName: string;
  shortName: string;
  phone: string;
  formattedPhone: string;
  region: string;
  label: string;
  color?: string;
}

export const FEATURED_DIMO_PHONE_PRESETS: DimoPresetItem[] = [
  {
    id: 'dimo-bienestar-phone',
    bankCode: '166',
    bankName: 'Banco del Bienestar S.N.C.',
    shortName: 'Banco del Bienestar',
    phone: '5570164820',
    formattedPhone: '(55) 7016-4820',
    region: 'CDMX · Padrón Bienestar',
    label: 'Banco del Bienestar · Celular DiMo',
    color: '#8b1c32'
  },
  {
    id: 'dimo-spin-phone',
    bankCode: '677',
    bankName: 'Spin by OXXO (Compropago S.A.P.I.)',
    shortName: 'Spin by Oxxo',
    phone: '8129401835',
    formattedPhone: '(81) 2940-1835',
    region: 'Monterrey · Red Spin Oxxo',
    label: 'Spin by Oxxo · Celular DiMo',
    color: '#ea580c'
  },
  {
    id: 'dimo-mercadopago-phone',
    bankCode: '846',
    bankName: 'Mercado Pago Wallet S.A.P.I.',
    shortName: 'Mercado Pago W',
    phone: '5638192044',
    formattedPhone: '(56) 3819-2044',
    region: 'CDMX · Mercado Pago W',
    label: 'Mercado Pago W · Celular DiMo',
    color: '#009ee3'
  },
  {
    id: 'dimo-bbva-phone',
    bankCode: '012',
    bankName: 'BBVA México S.A.',
    shortName: 'BBVA México',
    phone: '5512345678',
    formattedPhone: '(55) 1234-5678',
    region: 'CDMX · BBVA DiMo',
    label: 'BBVA México · Celular DiMo',
    color: '#004481'
  },
  {
    id: 'dimo-banorte-phone',
    bankCode: '072',
    bankName: 'Banco Mercantil del Norte',
    shortName: 'Banorte',
    phone: '8184910283',
    formattedPhone: '(81) 8491-0283',
    region: 'Monterrey · Banorte DiMo',
    label: 'Banorte · Celular DiMo',
    color: '#eb0029'
  }
];

/**
 * Helper generators for mock transactions
 */
export function generateMockCLABE(bankCode: string = '012'): string {
  const plaza = '180';
  let account = '';
  for (let i = 0; i < 11; i++) {
    account += Math.floor(Math.random() * 10).toString();
  }
  const prefix17 = `${bankCode}${plaza}${account}`;
  const weights = [3, 7, 1, 3, 7, 1, 3, 7, 1, 3, 7, 1, 3, 7, 1, 3, 7];
  let sum = 0;
  for (let i = 0; i < 17; i++) {
    sum += (parseInt(prefix17[i], 10) * weights[i]) % 10;
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  return `${prefix17}${checkDigit}`;
}

export function generateMockPAN(binOrBank?: string): string {
  let binPrefix = '415231';
  if (binOrBank === '166' || binOrBank === 'bienestar') binPrefix = '403756';
  else if (binOrBank === '677' || binOrBank === 'spin') binPrefix = '477283';
  else if (binOrBank === '846' || binOrBank === 'mercadopago') binPrefix = '403744';
  else if (binOrBank && binOrBank.length >= 4) binPrefix = binOrBank.slice(0, 6);
  else {
    const defaultBins = ['403756', '477283', '403744', '415231', '491566'];
    binPrefix = defaultBins[Math.floor(Math.random() * defaultBins.length)];
  }

  let pan = binPrefix;
  while (pan.length < 15) {
    pan += Math.floor(Math.random() * 10).toString();
  }
  // calculate Luhn check digit
  let sum = 0;
  let alternate = true;
  for (let i = pan.length - 1; i >= 0; i--) {
    let n = parseInt(pan.charAt(i), 10);
    if (alternate) {
      n *= 2;
      if (n > 9) n = (n % 10) + 1;
    }
    sum += n;
    alternate = !alternate;
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  return `${pan}${checkDigit}`;
}

export function generateMockDiMo(bankCode?: string): string {
  if (bankCode === '166') return '5570164820';
  if (bankCode === '677') return '8129401835';
  if (bankCode === '846') return '5638192044';
  const presets = ['5570164820', '8129401835', '5638192044', '5512345678', '8184910283'];
  if (Math.random() < 0.6) {
    return presets[Math.floor(Math.random() * presets.length)];
  }
  const ladas = ['55', '81', '33', '99', '44', '66', '77', '22'];
  const lada = ladas[Math.floor(Math.random() * ladas.length)];
  let num = lada;
  while (num.length < 10) {
    num += Math.floor(Math.random() * 10).toString();
  }
  return num;
}
