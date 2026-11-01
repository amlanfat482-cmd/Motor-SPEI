import { BlacklistEntry, BlacklistMatchRecord } from '../types/aml';

const STORAGE_KEY_BLACKLIST = 'amlanfat_custom_blacklist_v1';

export const DEFAULT_BLACKLIST_DATABASE: BlacklistEntry[] = [
  {
    id: 'BLK-OFAC-001',
    entityName: 'Tornado Cash Smart Contracts / Router Core',
    identifierOrAddress: '0xd90e2f925da726b50c4ed8d0fb90ad053324f31b',
    identifierType: 'CRYPTO_ADDRESS',
    authority: 'OFAC_SDN',
    authorityLabel: 'OFAC SDN List (Specially Designated Nationals)',
    category: 'Sanciones Financieras Internacionales / Lavado Cibernético',
    sanctionOrderFolio: 'OFAC-EO-13694-CYBER-2022',
    mandatedAction: 'IMMEDIATE_SEIZURE_20_PCT',
    dateAdded: '2022-08-08',
    country: 'Global / Descentralizado',
    notes: 'Protocolo mezclador sancionado por facilitar lavado de fondos a Lazarus Group (Corea del Norte).'
  },
  {
    id: 'BLK-OFAC-002',
    entityName: 'Lazarus Group Primary Stolen Funds Deposit',
    identifierOrAddress: '0x098b716b8aaf21512996dc57eb0615e2383e2f96',
    identifierType: 'CRYPTO_ADDRESS',
    authority: 'OFAC_SDN',
    authorityLabel: 'OFAC SDN List',
    category: 'Amenaza a la Seguridad Nacional / Ciberterrorismo',
    sanctionOrderFolio: 'OFAC-SDN-DPRK-CYBER-9412',
    mandatedAction: 'IMMEDIATE_SEIZURE_20_PCT',
    dateAdded: '2023-04-14',
    country: 'KP (Corea del Norte)',
    notes: 'Dirección vinculada a ataques APT y desvío de activos virtuales para programas armamentistas.'
  },
  {
    id: 'BLK-UIF-001',
    entityName: 'Operadora Financiera y Cambios Peninsular S.A. de C.V.',
    identifierOrAddress: 'OFC1904128X9',
    identifierType: 'RFC_TAX_ID',
    authority: 'UIF_BLOQUEADOS_ART_115',
    authorityLabel: 'Lista de Personas Bloqueadas (LPB) - UIF México',
    category: 'Art. 115 LIC / Operaciones con Recursos de Procedencia Ilícita',
    sanctionOrderFolio: 'DOF-UIF-ACUERDO-49/2025-LPB',
    mandatedAction: 'IMMEDIATE_SEIZURE_20_PCT',
    dateAdded: '2025-05-18',
    country: 'MX (México)',
    notes: 'Bloqueo precautorio ordenado por la SHCP/UIF por esquemas masivos de dispersión no justificada.'
  },
  {
    id: 'BLK-SAT-001',
    entityName: 'Comercializadora y Servicios Fantasma del Norte S.A. DE C.V.',
    identifierOrAddress: 'CSF1809054T3',
    identifierType: 'RFC_TAX_ID',
    authority: 'SAT_69B_EFOS',
    authorityLabel: 'SAT Art. 69-B (EFOS Definitivo - Operaciones Inexistentes)',
    category: 'Defraudación Fiscal y Facturación Falsa (EFOS)',
    sanctionOrderFolio: 'DOF-SAT-69B-DEF-2024-819',
    mandatedAction: 'TEMPORARY_HOLD_8_PCT',
    dateAdded: '2024-11-20',
    country: 'MX (México)',
    notes: 'Contribuyente listado de manera definitiva sin desvirtuar la emisión de comprobantes fiscales de operaciones simuladas.'
  },
  {
    id: 'BLK-OFAC-003',
    entityName: 'Sinbad.io Bitcoin Mixer Aggregator Hot Wallet',
    identifierOrAddress: 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4',
    identifierType: 'CRYPTO_ADDRESS',
    authority: 'OFAC_SDN',
    authorityLabel: 'OFAC SDN List',
    category: 'Mezclador de Activos Virtuales Sancionado',
    sanctionOrderFolio: 'OFAC-FINCEN-SINBAD-ORDER-2023',
    mandatedAction: 'IMMEDIATE_SEIZURE_20_PCT',
    dateAdded: '2023-11-29',
    country: 'RU / Desconocido',
    notes: 'Servicio sucesor de Blender.io empleado en operaciones de ransomware transnacional.'
  },
  {
    id: 'BLK-CHAIN-001',
    entityName: 'Hydra Darknet Market Russian Settlement Wallet',
    identifierOrAddress: '0x71c7656ec7ab88b098defb751b7401b5f6d8976f',
    identifierType: 'CRYPTO_ADDRESS',
    authority: 'CHAINALYSIS_ILLICIT',
    authorityLabel: 'Chainalysis Reactor Illicit Cluster Alert',
    category: 'Mercado Clandestino / Tráfico Ilícito',
    sanctionOrderFolio: 'CHAIN-ALERT-CLUSTER-88219-DARKNET',
    mandatedAction: 'TEMPORARY_HOLD_8_PCT',
    dateAdded: '2024-02-10',
    country: 'RU',
    notes: 'Dirección receptora de comisiones de intermediación en mercados oscuros cerrados por autoridades internacionales.'
  },
  {
    id: 'BLK-UIF-002',
    entityName: 'Cuenta Puente de Blanqueo de Capitales STP',
    identifierOrAddress: '646180123499999999',
    identifierType: 'BANK_CLABE',
    authority: 'UIF_BLOQUEADOS_ART_115',
    authorityLabel: 'UIF México - Cuenta Congelada Art. 115 LIC',
    category: 'Lavado de Dinero / Pitufeo Masivo',
    sanctionOrderFolio: 'UIF-OFICIO-CONGELAMIENTO-2026-B81',
    mandatedAction: 'IMMEDIATE_SEIZURE_20_PCT',
    dateAdded: '2026-01-15',
    country: 'MX (México)',
    notes: 'CLABE interbancaria receptora con orden judicial de inmovilización preventiva por mandato ministerial.'
  },
  {
    id: 'BLK-GAFI-001',
    entityName: 'Al-Baraka Offshore Hawala Network Ltd',
    identifierOrAddress: 'TLa2f6VPqDgRe67v52Geju99824ha71092',
    identifierType: 'CRYPTO_ADDRESS',
    authority: 'GAFI_SANCTIONED',
    authorityLabel: 'GAFI / FATF High-Risk Jurisdictions Taskforce',
    category: 'Financiamiento al Terrorismo / Red Paralela Hawala',
    sanctionOrderFolio: 'FATF-PLD-CFT-RISK-2025-11',
    mandatedAction: 'IMMEDIATE_SEIZURE_20_PCT',
    dateAdded: '2025-09-03',
    country: 'IR / SY',
    notes: 'Billetera TRC-20 con volumen anómalo canalizada a redes no declaradas en jurisdicciones de alto riesgo.'
  },
  {
    id: 'BLK-SAT-002',
    entityName: 'Servicios Logísticos y Consultoría Facturadora Peninsular',
    identifierOrAddress: 'SLP1706159K2',
    identifierType: 'RFC_TAX_ID',
    authority: 'SAT_69B_EFOS',
    authorityLabel: 'SAT Art. 69-B (EFOS)',
    category: 'Empresas que Facturan Operaciones Simuladas',
    sanctionOrderFolio: 'DOF-SAT-LISTA-EFOS-DEF-2025-412',
    mandatedAction: 'TEMPORARY_HOLD_8_PCT',
    dateAdded: '2025-04-12',
    country: 'MX (México)',
    notes: 'RFC inhabilitado para facturación de deducibles fiscales.'
  },
  {
    id: 'BLK-INTERPOL-001',
    entityName: 'Viktor Romanov (Fraude Financiero Transnacional)',
    identifierOrAddress: '0x3f5ce5fbfe3e9af3971dd833d26ba9b5c936f0be',
    identifierType: 'CRYPTO_ADDRESS',
    authority: 'INTERPOL_RED_NOTICE',
    authorityLabel: 'Interpol Red Notice / FGR Solicitud de Extradición',
    category: 'Crimen Financiero Organizado',
    sanctionOrderFolio: 'INTERPOL-RED-2025-MX-8419',
    mandatedAction: 'IMMEDIATE_SEIZURE_20_PCT',
    dateAdded: '2025-07-22',
    country: 'RU / CY',
    notes: 'Notificación roja activa por estafa piramidal transfronteriza y blanqueo de activos virtuales.'
  },
  {
    id: 'BLK-PAN-001',
    entityName: 'Red de Clonación y Fraude Bancario ATM Prosa',
    identifierOrAddress: '4152319088214562',
    identifierType: 'CARD_PAN_16',
    authority: 'UIF_BLOQUEADOS_ART_115',
    authorityLabel: 'UIF México / CNBV - Tarjeta Bloqueada por Decomiso',
    category: 'Fraude Sistémico / Tarjeta PAN Sustraída',
    sanctionOrderFolio: 'CNBV-DGDV-BLOQUEO-PAN-2026-90',
    mandatedAction: 'IMMEDIATE_SEIZURE_20_PCT',
    dateAdded: '2026-02-18',
    country: 'MX (México)',
    notes: 'Tarjeta de débito PAN (16 dígitos) ligada a retiros coordinados de efectivo ilícito en cajeros automáticos.'
  },
  {
    id: 'BLK-PAN-002',
    entityName: 'Operación Suplantación y Dispersión Ilícita Spin / Bienestar',
    identifierOrAddress: '4037569988112234',
    identifierType: 'CARD_PAN_16',
    authority: 'UIF_BLOQUEADOS_ART_115',
    authorityLabel: 'UIF México - Alerta de Dispersión No Regulada',
    category: 'Suplantación de Identidad / Desvío Social',
    sanctionOrderFolio: 'UIF-OFICIO-BLOQUEO-2026-B108',
    mandatedAction: 'IMMEDIATE_SEIZURE_20_PCT',
    dateAdded: '2026-03-05',
    country: 'MX (México)',
    notes: 'Tarjeta PAN 16 dígitos Visa con reporte de recepción de fondos fraudulentos.'
  },
  {
    id: 'BLK-DIMO-001',
    entityName: 'Línea de Cobro Telefónico DiMo (Extorsión y Secuestro Virtual)',
    identifierOrAddress: '5584910283',
    identifierType: 'DIMO_PHONE_10',
    authority: 'UIF_BLOQUEADOS_ART_115',
    authorityLabel: 'UIF / FGR Alerta Inmediata DiMo Banxico',
    category: 'Extorsión Telefónica / Cobro DiMo Ilegal',
    sanctionOrderFolio: 'FGR-CENFI-DIMO-ALERTA-2026-04',
    mandatedAction: 'IMMEDIATE_SEIZURE_20_PCT',
    dateAdded: '2026-03-01',
    country: 'MX (México)',
    notes: 'Identificador DiMo de 10 dígitos vinculado a depósitos forzados en red SPEI móvil.'
  },
  {
    id: 'BLK-DIMO-002',
    entityName: 'Línea Telefónica DiMo Suplantada (Fraude Mercado Pago W / BanCoppel)',
    identifierOrAddress: '5638199999',
    identifierType: 'DIMO_PHONE_10',
    authority: 'UIF_BLOQUEADOS_ART_115',
    authorityLabel: 'CNBV / UIF - Alerta Antifraude Celular DiMo',
    category: 'Phishing y Vaciado de Cuentas Móviles',
    sanctionOrderFolio: 'CNBV-DGDV-DIMO-2026-091',
    mandatedAction: 'IMMEDIATE_SEIZURE_20_PCT',
    dateAdded: '2026-03-12',
    country: 'MX (México)',
    notes: 'Número telefónico de 10 dígitos con bloqueo judicial inmediato para recepción de transferencias DiMo.'
  }
];

export function loadBlacklistCatalog(): BlacklistEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_BLACKLIST);
    if (!raw) return DEFAULT_BLACKLIST_DATABASE;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Merge unique entries
      const idSet = new Set(parsed.map((e: BlacklistEntry) => e.id));
      const merged = [...parsed];
      DEFAULT_BLACKLIST_DATABASE.forEach(def => {
        if (!idSet.has(def.id)) {
          merged.push(def);
        }
      });
      return merged;
    }
  } catch (e) {
    console.error('Error loading custom blacklist:', e);
  }
  return DEFAULT_BLACKLIST_DATABASE;
}

export function saveBlacklistCatalog(list: BlacklistEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_BLACKLIST, JSON.stringify(list));
  } catch (e) {
    console.error('Error saving custom blacklist:', e);
  }
}

export function addCustomBlacklistEntry(
  entryData: Omit<BlacklistEntry, 'id' | 'dateAdded'>
): BlacklistEntry {
  const current = loadBlacklistCatalog();
  const newEntry: BlacklistEntry = {
    ...entryData,
    id: `BLK-CUSTOM-${Date.now().toString(36).toUpperCase()}`,
    dateAdded: new Date().toISOString().slice(0, 10)
  };
  const updated = [newEntry, ...current];
  saveBlacklistCatalog(updated);
  return newEntry;
}

/**
 * Checks a counterparty address, CLABE, or RFC against the Blacklist Database.
 * Performs normalized and partial matches to catch obfuscation attempts.
 */
export function checkCounterpartyBlacklist(
  identifierOrAddress: string,
  rfc?: string,
  entityName?: string
): BlacklistMatchRecord | null {
  if (!identifierOrAddress && !rfc && !entityName) return null;

  const catalog = loadBlacklistCatalog();
  const normalizedId = identifierOrAddress?.trim().toLowerCase() || '';
  const cleanDigitsId = identifierOrAddress?.replace(/[\s\(\)\-+]/g, '') || '';
  const normalizedRfc = rfc?.trim().toUpperCase() || '';
  const normalizedName = entityName?.trim().toLowerCase() || '';

  for (const item of catalog) {
    const itemTarget = item.identifierOrAddress.trim().toLowerCase();
    const itemCleanDigits = item.identifierOrAddress.replace(/[\s\(\)\-+]/g, '');
    const itemRfc = item.identifierOrAddress.trim().toUpperCase();

    // 1. Direct match on address or identifier (including formatted CLABE, PAN 16, DiMo 10)
    const isDirectMatch = normalizedId && (normalizedId === itemTarget || (itemTarget.length > 10 && normalizedId.includes(itemTarget)));
    const isNumericMatch = cleanDigitsId && cleanDigitsId.length >= 10 && cleanDigitsId === itemCleanDigits;

    if (isDirectMatch || isNumericMatch) {
      return {
        matchedAt: new Date().toISOString(),
        matchedEntity: item.entityName,
        matchedIdentifier: item.identifierOrAddress,
        authority: item.authority,
        authorityLabel: item.authorityLabel,
        sanctionOrderFolio: item.sanctionOrderFolio,
        mandatedAction: item.mandatedAction,
        notes: item.notes
      };
    }

    // 2. Direct match on RFC / Tax ID
    if (normalizedRfc && (normalizedRfc === itemRfc || itemRfc === normalizedRfc)) {
      return {
        matchedAt: new Date().toISOString(),
        matchedEntity: item.entityName,
        matchedIdentifier: item.identifierOrAddress,
        authority: item.authority,
        authorityLabel: item.authorityLabel,
        sanctionOrderFolio: item.sanctionOrderFolio,
        mandatedAction: item.mandatedAction,
        notes: item.notes
      };
    }

    // 3. Name similarity / matching
    if (normalizedName && normalizedName.length > 5) {
      const itemNameLower = item.entityName.toLowerCase();
      if (itemNameLower.includes(normalizedName) || normalizedName.includes(itemNameLower.slice(0, 15))) {
        return {
          matchedAt: new Date().toISOString(),
          matchedEntity: item.entityName,
          matchedIdentifier: item.identifierOrAddress,
          authority: item.authority,
          authorityLabel: item.authorityLabel,
          sanctionOrderFolio: item.sanctionOrderFolio,
          mandatedAction: item.mandatedAction,
          notes: item.notes
        };
      }
    }
  }

  return null;
}
