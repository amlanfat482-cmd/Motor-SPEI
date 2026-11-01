export type SATRuleCode = 
  | 'ISR_RENDIMIENTOS_CAPITAL'      // Art. 54 y 135 LISR (0.50% anualizado sobre rendimientos/intereses)
  | 'ISR_RESICO_HONORARIOS'         // Art. 113-J LISR (1.25% retención PM a PF RESICO)
  | 'ISR_HONORARIOS_PROFESIONALES'  // Art. 106 LISR (10.0% retención fija)
  | 'ISR_PLATAFORMAS_DIGITALES'     // Art. 113-A LISR (1.0% a 2.5% intermediación/servicios)
  | 'IVA_SERVICIOS_PROFESIONALES'   // Art. 1-A Fracc. II Inc. a) LIVA (10.6667% - 2/3 partes IVA)
  | 'IVA_PLATAFORMAS_INTERMEDIACION'// Art. 18-J LIVA (8.0% - 50% IVA retenido)
  | 'IVA_SERVICIOS_ESPECIALIZADOS'; // Art. 1-A Fracc. IV LIVA (6.0% retención REPSE)

export interface SATWithholdingRule {
  code: SATRuleCode;
  legalArticle: string;
  taxType: 'ISR' | 'IVA';
  name: string;
  description: string;
  ratePercentage: number;
  baseAmountMXN: number;
  calculatedTaxMXN: number;
  isActive: boolean;
}

export interface SATWithholdingBreakdown {
  period: string; // ej. "2026-09" o "Septiembre 2026"
  evaluationDate: string; // ISO string
  rulesApplied: SATWithholdingRule[];
  subtotalIsrRetenidoMXN: number;
  subtotalIvaRetenidoMXN: number;
  totalRetencionesMXN: number;
}

export interface TaxPeriodEvaluation {
  currentDateISO: string;
  currentDateFormatted: string; // ej. "17 de Octubre de 2026"
  evaluatedTaxPeriod: string; // "Septiembre 2026" (se declara en octubre)
  statutoryDueDayOfMonth: number; // 17 de cada mes (CFF Art. 12)
  statutoryDueDate: string; // "2026-10-17T23:59:59Z"
  rfcSextoDigito: string; // '5'
  rfcExtensionDays: number; // +3 días hábiles adicionales según RMF Regla 2.8.3.1
  extendedDueDate: string; // "2026-10-20T23:59:59Z" (o siguiente día hábil bancario)
  isBusinessDay: boolean;
  hoursUntilExtendedDeadline: number;
  complianceStatus: 'AL_CORRIENTE' | 'POR_VENCER' | 'VENCIDO';
}

export interface GovernmentWebhookHeader {
  key: string;
  value: string;
}

export interface GovernmentWebhookPayload {
  version: '2.1';
  submission_uuid: string;
  rfc_contribuyente: string;
  razon_social: string;
  periodo_declarado: string;
  tipo_declaracion: 'R01_PROVISIONAL_RETENCIONES' | 'R02_DEFINITIVO_IVA' | 'R03_PAGO_DERECHOS';
  fecha_declaracion: string;
  linea_captura_sat: string;
  desglose_retenciones: {
    concepto: string;
    articulo_ley: string;
    base_gravable_mxn: number;
    tasa_aplicable_pct: number;
    impuesto_retenido_mxn: number;
  }[];
  total_retenciones_a_enterar_mxn: number;
  cadena_original: string;
  sello_digital_contribuyente: string;
  numero_serie_certificado: string;
  spei_pago: {
    clave_rastreo: string;
    banco_receptor: string;
    clabe_tesofe_sat: string;
    cep_folio_banxico: string;
    monto_liquidado_mxn: number;
    fecha_liquidacion: string;
  };
}

export interface GovernmentWebhookDeliveryLog {
  id: string;
  timestamp: string;
  submissionId: string;
  targetEndpoint: string;
  httpStatus: number;
  status: 'DELIVERED_200_OK' | 'ACCEPTED_202' | 'RETRYING' | 'FAILED';
  latencyMs: number;
  attemptNumber: number;
  maxAttempts: number;
  hmacSignature: string;
  idempotencyKey: string;
  requestHeaders: GovernmentWebhookHeader[];
  requestPayload: GovernmentWebhookPayload;
  responseBody: {
    ack_status: 'RECEIVED_AND_REGISTERED' | 'REJECTED';
    folio_acuse_sat: string;
    sello_digital_sat: string;
    fecha_recepcion_sat: string;
    mensaje: string;
    qr_verificacion: string;
  };
}

export interface AutomatedTaxSubmissionOrder {
  id: string;
  createdAt: string;
  scheduledFor: string;
  executedAt?: string;
  taxPeriod: string;
  captureLine: string;
  withholdingBreakdown: SATWithholdingBreakdown;
  totalAmountMXN: number;
  status: 
    | 'SCHEDULED' 
    | 'EXECUTING_SIGNATURE' 
    | 'EXECUTING_SPEI' 
    | 'DISPATCHING_WEBHOOK' 
    | 'COMPLETED_ACKNOWLEDGED' 
    | 'FAILED';
  cadenaOriginal?: string;
  selloDigitalContribuyente?: string;
  speiClaveRastreo?: string;
  speiCepFolio?: string;
  webhookDelivery?: GovernmentWebhookDeliveryLog;
  satAcuseFolio?: string;
  notes: string;
}

export interface AutomatedSubmissionConfig {
  autoExecuteOnDeadline: boolean;
  hoursBeforeDeadline: number; // ej. 24
  webhookEndpointUrl: string;
  webhookSecretKey: string;
  targetSatClabe: string;
  targetBankName: string;
  maxAutonomousThresholdMXN: number;
}
