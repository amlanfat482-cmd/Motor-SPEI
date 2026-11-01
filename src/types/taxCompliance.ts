export type GovernmentAuthority = 'SAT' | 'CNBV' | 'TESOFE_BANXICO' | 'IMSS_SIPARE';

export type TaxObligationCategory = 
  | 'IMPUESTO_FEDERAL'       // ISR, IVA, Retenciones
  | 'DERECHO_SUPERVISION'    // Cuotas de Inspección CNBV (Art. 29-E LFD)
  | 'PERMISO_REGULATORIO'    // Dictamen PLD/FT, Licencia IFPE
  | 'CUOTA_SEGURIDAD_SOCIAL' // IMSS / INFONAVIT SIPARE
  | 'TARIFA_SPEI';          // Uso de infraestructura SPEI Banxico / TESOFE

export type ObligationPaymentStatus = 
  | 'PAGADO_AL_CORRIENTE'       // Liquidado y timbrado con Acuse SAT/TESOFE
  | 'PROGRAMADO_AUTO_FIRMA'     // Agendado para dispersión y firma a tiempo (T-24h/T-48h)
  | 'DISPERSANDO_SPEI'          // En proceso de liquidación por STP/Banxico
  | 'POR_VENCER'                // Falta menos de 48h para fecha límite
  | 'VENCIDO_RECARGOS';         // Requiere actualización y recargos CFF Art. 21

export interface TaxObligationItem {
  id: string;
  authority: GovernmentAuthority;
  category: TaxObligationCategory;
  concept: string;
  period: string; // ej. "Septiembre 2026", "Bimestre 05/2026", "Anual 2026"
  dueDate: string; // ISO 8601 string
  captureLine: string; // Línea de Captura oficial (20 dig SAT, 19 dig IMSS, 14 dig e5cinco)
  amountMXN: number;
  surchargesAndInflationMXN: number; // Actualizaciones y recargos
  totalToPayMXN: number;
  status: ObligationPaymentStatus;
  
  // Recaudación y datos bancarios oficiales
  collectingBank: string; // ej. "BBVA México (SAT Recaudación Concentradora)"
  collectingCLABE: string;
  tesofeReference?: string;
  
  // Firma electrónica avanzada y sello digital
  automatedExecutionScheduled: boolean;
  scheduledExecutionHoursBeforeDeadline: number; // ej. 24 horas antes
  scheduledExecutionTimestamp?: string;
  
  // Metadatos criptográficos cuando es liquidado
  settledAt?: string;
  claveRastreoSPEI?: string;
  folioFiscalAcuse?: string;
  selloDigitalContribuyente?: string; // SHA256withRSA
  selloDigitalAutoridad?: string; // Sello de recepción SAT / TESOFE
  cadenaOriginal?: string;
  certificadoSerial?: string;
  cepFolioBanxico?: string;
  qrVerificationUrl?: string;
  
  // Notas regulatorias
  regulatoryArticle: string; // ej. "Art. 14 LISR / Art. 5-D LIVA" o "Art. 29-E LFD"
}

export interface EFirmaConfig {
  rfc: string;
  legalEntityName: string;
  certificateSerialNumber: string;
  certificateValidUntil: string;
  status: 'VIGENTE' | 'POR_RENOVAR' | 'REVOCADA';
  keystoreLocation: 'CLOUD_HSM_FIPS_140_2_LEVEL_3' | 'LOCAL_SECURE_ENCLAVE';
  algorithm: 'SHA256withRSA_2048';
  autoSignEnabled: boolean;
  autoSignMaxThresholdMXN: number; // Límite de monto para firma autónoma sin 2FA
  lastSignatureGeneratedAt?: string;
  totalSignaturesGenerated: number;
}

export interface TaxComplianceSummary {
  compliancePercentage: number; // 100%
  totalPaidThisYearMXN: number;
  nextUpcomingObligation?: TaxObligationItem;
  pendingDueIn48HoursCount: number;
  totalScheduledAutoPayMXN: number;
  efirmaActive: boolean;
  lastSyncWithSATPortal: string;
}
