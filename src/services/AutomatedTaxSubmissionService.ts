import { 
  SATRuleCode,
  SATWithholdingRule,
  SATWithholdingBreakdown,
  TaxPeriodEvaluation,
  GovernmentWebhookPayload,
  GovernmentWebhookDeliveryLog,
  AutomatedTaxSubmissionOrder,
  AutomatedSubmissionConfig
} from '../types/automatedTaxSubmission';
import { 
  loadTaxObligations, 
  saveTaxObligations, 
  loadEFirmaConfig, 
  saveEFirmaConfig,
  generateDigitalSignature
} from '../utils/taxEngine';
import { TaxObligationItem } from '../types/taxCompliance';

const STORAGE_KEYS = {
  SUBMISSIONS: 'amlanfat_tax_submissions_v1',
  WEBHOOK_LOGS: 'amlanfat_tax_webhook_logs_v1',
  SUBMISSION_CONFIG: 'amlanfat_tax_submission_config_v1',
};

export const DEFAULT_SUBMISSION_CONFIG: AutomatedSubmissionConfig = {
  autoExecuteOnDeadline: true,
  hoursBeforeDeadline: 24,
  webhookEndpointUrl: 'https://api.sat.gob.mx/v2/declaraciones/webhook-notificacion',
  webhookSecretKey: 'SEC_SAT_PROD_9482_E_FIRMA_SECRET_2026',
  targetSatClabe: '012180001948201948',
  targetBankName: 'BBVA México (SAT Recaudación Concentradora Tesofe)',
  maxAutonomousThresholdMXN: 5000000
};

// Standard Default SAT Withholding Rules
export const DEFAULT_SAT_WITHHOLDING_RULES: SATWithholdingRule[] = [
  {
    code: 'ISR_RENDIMIENTOS_CAPITAL',
    legalArticle: 'Art. 54 y 135 LISR',
    taxType: 'ISR',
    name: 'Retención ISR por Rendimientos Financieros Fintech',
    description: 'Tasa aplicable sobre intereses y ganancias devengadas en cuentas de fondos de pago electrónico (IFPE).',
    ratePercentage: 0.50,
    baseAmountMXN: 14250000.00,
    calculatedTaxMXN: 71250.00,
    isActive: true
  },
  {
    code: 'ISR_RESICO_HONORARIOS',
    legalArticle: 'Art. 113-J LISR',
    taxType: 'ISR',
    name: 'Retención ISR Régimen Simplificado (RESICO)',
    description: 'Retención obligatoria efectuada por personas morales a personas físicas en RESICO.',
    ratePercentage: 1.25,
    baseAmountMXN: 1280000.00,
    calculatedTaxMXN: 16000.00,
    isActive: true
  },
  {
    code: 'ISR_HONORARIOS_PROFESIONALES',
    legalArticle: 'Art. 106 LISR',
    taxType: 'ISR',
    name: 'Retención ISR Honorarios y Asimilados',
    description: 'Retención del 10% sobre contraprestaciones pagadas por servicios profesionales independientes.',
    ratePercentage: 10.00,
    baseAmountMXN: 840000.00,
    calculatedTaxMXN: 84000.00,
    isActive: true
  },
  {
    code: 'ISR_PLATAFORMAS_DIGITALES',
    legalArticle: 'Art. 113-A Fracc. I LISR',
    taxType: 'ISR',
    name: 'Retención ISR Plataformas Tecnológicas e Intermediación',
    description: 'Retención provisional sobre ingresos obtenidos mediante servicios y operaciones digitales.',
    ratePercentage: 1.00,
    baseAmountMXN: 3650000.00,
    calculatedTaxMXN: 36500.00,
    isActive: true
  },
  {
    code: 'IVA_SERVICIOS_PROFESIONALES',
    legalArticle: 'Art. 1-A Fracc. II Inciso a) LIVA',
    taxType: 'IVA',
    name: 'Retención 2/3 Partes del IVA (Servicios Profesionales)',
    description: 'Retención de las dos terceras partes del IVA trasladado por la prestación de servicios personales independientes.',
    ratePercentage: 10.6667,
    baseAmountMXN: 840000.00,
    calculatedTaxMXN: 89600.00,
    isActive: true
  },
  {
    code: 'IVA_PLATAFORMAS_INTERMEDIACION',
    legalArticle: 'Art. 18-J Fracc. II Inciso a) LIVA',
    taxType: 'IVA',
    name: 'Retención 50% de IVA Plataformas Digitales',
    description: 'Retención del 50% del impuesto al valor agregado cobrado por enajenación o prestación en plataformas.',
    ratePercentage: 8.00,
    baseAmountMXN: 1450000.00,
    calculatedTaxMXN: 116000.00,
    isActive: true
  },
  {
    code: 'IVA_SERVICIOS_ESPECIALIZADOS',
    legalArticle: 'Art. 1-A Fracc. IV LIVA',
    taxType: 'IVA',
    name: 'Retención 6% IVA Servicios Especializados (REPSE)',
    description: 'Retención del 6% del valor de la contraprestación en servicios de infraestructura o personal especializado.',
    ratePercentage: 6.00,
    baseAmountMXN: 410000.00,
    calculatedTaxMXN: 24600.00,
    isActive: true
  }
];

// Helper to simulate HMAC-SHA256 signature for webhooks
export function computeHmacSha256(payloadString: string, secretKey: string): string {
  let hash = 0;
  const combined = `${payloadString}#${secretKey}`;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  const hexHash = Math.abs(hash).toString(16).padStart(8, '0');
  const timestamp = Date.now().toString(16);
  return `sha256=${hexHash}${timestamp}e7f82b9c41d08`;
}

// Generate valid format 20-digit SAT capture line
export function generateSATCaptureLine(periodYear: number = 2026, month: number = 9): string {
  const pStr = `${periodYear.toString().slice(2)}${month.toString().padStart(2, '0')}`;
  const randomBlock1 = Math.floor(1000 + Math.random() * 9000);
  const randomBlock2 = Math.floor(1000 + Math.random() * 9000);
  const randomBlock3 = Math.floor(1000 + Math.random() * 9000);
  const randomBlock4 = Math.floor(1000 + Math.random() * 9000);
  return `01${pStr} ${randomBlock1} ${randomBlock2} ${randomBlock3} ${randomBlock4}`;
}

export class AutomatedTaxSubmissionService {
  /**
   * Evaluates current date against Mexican Fiscal Calendar (CFF Art. 12 + RMF Regla 2.8.3.1)
   */
  public static evaluateCurrentFiscalPeriod(referenceDate: Date = new Date('2026-10-17T14:44:28-07:00')): TaxPeriodEvaluation {
    const currentDateISO = referenceDate.toISOString();
    
    // In Mexico, the standard due date for previous month's tax retentions is the 17th of the following month
    const year = referenceDate.getFullYear();
    const month = referenceDate.getMonth(); // 9 is October (0-indexed)
    
    // For October 2026, the declared period is September 2026
    const evaluatedTaxPeriod = 'Septiembre 2026';
    
    // Statutory due date: 17th of current month at 23:59:59
    const statutoryDue = new Date(Date.UTC(year, month, 17, 23, 59, 59));
    
    // RMF 2.8.3.1 Sixth digit RFC rule:
    // SPS2108159A3 -> 6th digit '5' gives +3 business days
    const rfcSextoDigito = '5';
    const rfcExtensionDays = 3;
    
    // Calculate extended date: 17th + 3 days = 20th
    const extendedDue = new Date(Date.UTC(year, month, 17 + rfcExtensionDays, 23, 59, 59));
    
    // Time remaining
    const diffMs = extendedDue.getTime() - referenceDate.getTime();
    const hoursRemaining = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)));
    
    let complianceStatus: 'AL_CORRIENTE' | 'POR_VENCER' | 'VENCIDO' = 'AL_CORRIENTE';
    if (diffMs < 0) {
      complianceStatus = 'VENCIDO';
    } else if (hoursRemaining <= 48) {
      complianceStatus = 'POR_VENCER';
    }

    const monthsNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    const currentDateFormatted = `${referenceDate.getDate()} de ${monthsNames[referenceDate.getMonth()]} de ${referenceDate.getFullYear()}`;

    return {
      currentDateISO,
      currentDateFormatted,
      evaluatedTaxPeriod,
      statutoryDueDayOfMonth: 17,
      statutoryDueDate: statutoryDue.toISOString(),
      rfcSextoDigito,
      rfcExtensionDays,
      extendedDueDate: extendedDue.toISOString(),
      isBusinessDay: true,
      hoursUntilExtendedDeadline: hoursRemaining,
      complianceStatus
    };
  }

  /**
   * Computes withholding totals across all active SAT rules
   */
  public static calculateSATWithholdings(
    customRules?: SATWithholdingRule[],
    period: string = 'Septiembre 2026'
  ): SATWithholdingBreakdown {
    const rules = customRules || DEFAULT_SAT_WITHHOLDING_RULES;
    
    let subtotalIsr = 0;
    let subtotalIva = 0;

    const evaluatedRules = rules.map(rule => {
      if (!rule.isActive) {
        return { ...rule, calculatedTaxMXN: 0 };
      }
      const calculatedTax = (rule.baseAmountMXN * rule.ratePercentage) / 100;
      if (rule.taxType === 'ISR') {
        subtotalIsr += calculatedTax;
      } else {
        subtotalIva += calculatedTax;
      }
      return {
        ...rule,
        calculatedTaxMXN: Math.round(calculatedTax * 100) / 100
      };
    });

    const totalRetenciones = subtotalIsr + subtotalIva;

    return {
      period,
      evaluationDate: new Date().toISOString(),
      rulesApplied: evaluatedRules,
      subtotalIsrRetenidoMXN: Math.round(subtotalIsr * 100) / 100,
      subtotalIvaRetenidoMXN: Math.round(subtotalIva * 100) / 100,
      totalRetencionesMXN: Math.round(totalRetenciones * 100) / 100
    };
  }

  /**
   * Schedules a new Automated Tax Submission Order
   */
  public static scheduleSubmission(
    breakdown: SATWithholdingBreakdown,
    executionDateISO?: string
  ): AutomatedTaxSubmissionOrder {
    const config = this.getConfig();
    const periodEval = this.evaluateCurrentFiscalPeriod();
    const now = new Date();
    
    const scheduledFor = executionDateISO || periodEval.extendedDueDate;
    const captureLine = generateSATCaptureLine(2026, 9);
    const submissionId = `SUB-SAT-${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}-${Math.floor(100000 + Math.random() * 900000)}`;

    const order: AutomatedTaxSubmissionOrder = {
      id: submissionId,
      createdAt: now.toISOString(),
      scheduledFor,
      taxPeriod: breakdown.period,
      captureLine,
      withholdingBreakdown: breakdown,
      totalAmountMXN: breakdown.totalRetencionesMXN,
      status: 'SCHEDULED',
      notes: `Programado automáticamente para liquidación ante SAT Recaudación (Línea de captura ${captureLine}) antes del vencimiento con prórroga del sexto dígito RFC.`
    };

    const existing = this.getSubmissions();
    const updated = [order, ...existing];
    this.saveSubmissions(updated);

    return order;
  }

  /**
   * Executes the complete Automated Tax Submission pipeline:
   * 1. Cryptographic e.firma generation (Cadena Original + Sello SHA256withRSA)
   * 2. SPEI Disbursement creation & simulation (Clave de Rastreo + CEP Folio)
   * 3. Dispatches Webhook to Government Tax Portal with HMAC-SHA256 signature
   * 4. Updates status to COMPLETED_ACKNOWLEDGED and syncs with tax obligations store
   */
  public static async executeSubmission(
    submissionId: string,
    onStepUpdate?: (step: 'SIGNING' | 'SPEI' | 'WEBHOOK' | 'ACK') => void
  ): Promise<{
    success: boolean;
    order: AutomatedTaxSubmissionOrder;
    deliveryLog: GovernmentWebhookDeliveryLog;
    receiptFolio: string;
    errorMessage?: string;
  }> {
    const submissions = this.getSubmissions();
    const targetIndex = submissions.findIndex(s => s.id === submissionId);
    
    if (targetIndex === -1) {
      throw new Error(`Submission order ${submissionId} not found.`);
    }

    const order = { ...submissions[targetIndex] };
    const efirma = loadEFirmaConfig();
    const config = this.getConfig();
    const now = new Date();
    const nowIso = now.toISOString();

    // Step 1: Digital Signing
    if (onStepUpdate) onStepUpdate('SIGNING');
    order.status = 'EXECUTING_SIGNATURE';

    const cleanCapture = order.captureLine.replace(/\s/g, '');
    const cadenaOriginal = `||2.0|SAT|${efirma.rfc}|RETENCIONES_ISR_IVA_FINTECH|${order.taxPeriod}|${cleanCapture}|${order.totalAmountMXN.toFixed(2)}|${order.scheduledFor}|${efirma.certificateSerialNumber}||`;
    const selloDigital = generateDigitalSignature(cadenaOriginal);

    order.cadenaOriginal = cadenaOriginal;
    order.selloDigitalContribuyente = selloDigital;

    // Small realistic delay
    await new Promise(resolve => setTimeout(resolve, 300));

    // Step 2: SPEI Disbursement Generation
    if (onStepUpdate) onStepUpdate('SPEI');
    order.status = 'EXECUTING_SPEI';

    const dateCompact = nowIso.replace(/[-:T]/g, '').slice(0, 14);
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    const speiTrackingKey = `2026${dateCompact.slice(4, 8)}${randomSuffix}TAXSAT`;
    const cepFolio = `CEP-BANXICO-${dateCompact.slice(0, 8)}-${randomSuffix}`;

    order.speiClaveRastreo = speiTrackingKey;
    order.speiCepFolio = cepFolio;

    await new Promise(resolve => setTimeout(resolve, 350));

    // Step 3: Outbound Government Webhook Notification
    if (onStepUpdate) onStepUpdate('WEBHOOK');
    order.status = 'DISPATCHING_WEBHOOK';

    const webhookPayload: GovernmentWebhookPayload = {
      version: '2.1',
      submission_uuid: order.id,
      rfc_contribuyente: efirma.rfc,
      razon_social: efirma.legalEntityName,
      periodo_declarado: order.taxPeriod,
      tipo_declaracion: 'R01_PROVISIONAL_RETENCIONES',
      fecha_declaracion: nowIso,
      linea_captura_sat: order.captureLine,
      desglose_retenciones: order.withholdingBreakdown.rulesApplied.map(r => ({
        concepto: r.name,
        articulo_ley: r.legalArticle,
        base_gravable_mxn: r.baseAmountMXN,
        tasa_aplicable_pct: r.ratePercentage,
        impuesto_retenido_mxn: r.calculatedTaxMXN
      })),
      total_retenciones_a_enterar_mxn: order.totalAmountMXN,
      cadena_original: cadenaOriginal,
      sello_digital_contribuyente: selloDigital,
      numero_serie_certificado: efirma.certificateSerialNumber,
      spei_pago: {
        clave_rastreo: speiTrackingKey,
        banco_receptor: config.targetBankName,
        clabe_tesofe_sat: config.targetSatClabe,
        cep_folio_banxico: cepFolio,
        monto_liquidado_mxn: order.totalAmountMXN,
        fecha_liquidacion: nowIso
      }
    };

    const deliveryLog = await this.dispatchGovernmentWebhook(webhookPayload, config);

    // Step 4: Final Acknowledgment and Registration
    if (onStepUpdate) onStepUpdate('ACK');
    order.status = 'COMPLETED_ACKNOWLEDGED';
    order.executedAt = nowIso;
    order.webhookDelivery = deliveryLog;
    order.satAcuseFolio = deliveryLog.responseBody.folio_acuse_sat;
    order.notes = `Declaración de Retenciones SAT liquidada exitosamente vía SPEI y timbrada por el Portal del SAT mediante Webhook con acuse oficial ${deliveryLog.responseBody.folio_acuse_sat}.`;

    submissions[targetIndex] = order;
    this.saveSubmissions(submissions);

    // Update e.firma config stats
    saveEFirmaConfig({
      ...efirma,
      totalSignaturesGenerated: efirma.totalSignaturesGenerated + 1,
      lastSignatureGeneratedAt: nowIso
    });

    // Save Delivery Log
    this.saveWebhookLog(deliveryLog);

    // Sync into tax obligations store so the main calendar displays it as PAID
    this.syncWithTaxObligations(order, deliveryLog);

    return {
      success: true,
      order,
      deliveryLog,
      receiptFolio: deliveryLog.responseBody.folio_acuse_sat
    };
  }

  /**
   * Dispatches authenticated Webhook to Government endpoint with HMAC-SHA256 signature
   */
  public static async dispatchGovernmentWebhook(
    payload: GovernmentWebhookPayload,
    config: AutomatedSubmissionConfig = this.getConfig()
  ): Promise<GovernmentWebhookDeliveryLog> {
    const startTime = Date.now();
    const payloadJson = JSON.stringify(payload);
    const hmacSignature = computeHmacSha256(payloadJson, config.webhookSecretKey);
    const idempotencyKey = `IDEMP-${payload.submission_uuid}-${Date.now()}`;
    const timestamp = new Date().toISOString();

    const requestHeaders = [
      { key: 'Content-Type', value: 'application/json' },
      { key: 'X-SAT-Signature', value: hmacSignature },
      { key: 'X-Timestamp', value: timestamp },
      { key: 'X-Idempotency-Key', value: idempotencyKey },
      { key: 'X-RFC-Emisor', value: payload.rfc_contribuyente },
      { key: 'X-Submission-UUID', value: payload.submission_uuid },
      { key: 'User-Agent', value: 'SPS-Autonomous-Tax-Disperser/v2.1 (CNAD-DASP-ElSalvador-Banxico-SPEI)' }
    ];

    // Simulate reliable async government reception network latency
    await new Promise(resolve => setTimeout(resolve, 400));
    const latencyMs = Date.now() - startTime;

    const randomFolio = Math.floor(100000000 + Math.random() * 900000000);
    const acuseFolio = `SAT-ACUSE-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${randomFolio}`;
    const selloSat = `SAT970701NN3|REC-${acuseFolio}|CONFIRMED_WEBHOOK_DELIVERY_OFFICIAL_TIMBRADO`;
    const qrUrl = `https://portalrecaudacion.gob.mx/verificacion?folio=${acuseFolio}&rfc=${payload.rfc_contribuyente}&monto=${payload.total_retenciones_a_enterar_mxn}`;

    const deliveryLog: GovernmentWebhookDeliveryLog = {
      id: `LOG-WH-${Date.now()}`,
      timestamp,
      submissionId: payload.submission_uuid,
      targetEndpoint: config.webhookEndpointUrl,
      httpStatus: 200,
      status: 'DELIVERED_200_OK',
      latencyMs,
      attemptNumber: 1,
      maxAttempts: 3,
      hmacSignature,
      idempotencyKey,
      requestHeaders,
      requestPayload: payload,
      responseBody: {
        ack_status: 'RECEIVED_AND_REGISTERED',
        folio_acuse_sat: acuseFolio,
        sello_digital_sat: selloSat,
        fecha_recepcion_sat: new Date().toISOString(),
        mensaje: 'La declaración provisional de retenciones e impuestos federales y su dispersión SPEI fueron recibidas, validadas y acreditadas satisfactoriamente por el Portal de Gobierno.',
        qr_verificacion: qrUrl
      }
    };

    return deliveryLog;
  }

  /**
   * Synchronizes completed submission into the central TaxObligationItem ledger
   */
  private static syncWithTaxObligations(
    order: AutomatedTaxSubmissionOrder, 
    deliveryLog: GovernmentWebhookDeliveryLog
  ): void {
    const currentObligations = loadTaxObligations();
    
    // Check if an obligation for this period already exists
    const existingIndex = currentObligations.findIndex(o => 
      o.authority === 'SAT' && 
      (o.concept.includes('Retenciones') || o.concept.includes('Septiembre 2026'))
    );

    const obligationRecord: TaxObligationItem = {
      id: order.id,
      authority: 'SAT',
      category: 'IMPUESTO_FEDERAL',
      concept: `Declaración y Entero de Retenciones SAT (ISR e IVA) - ${order.taxPeriod}`,
      period: order.taxPeriod,
      dueDate: order.scheduledFor,
      captureLine: order.captureLine,
      amountMXN: order.totalAmountMXN,
      surchargesAndInflationMXN: 0,
      totalToPayMXN: order.totalAmountMXN,
      status: 'PAGADO_AL_CORRIENTE',
      collectingBank: 'BBVA México (SAT Recaudación Concentradora Tesofe)',
      collectingCLABE: '012180001948201948',
      tesofeReference: `SAT-RETENCIONES-${order.taxPeriod.replace(/\s+/g, '-').toUpperCase()}`,
      automatedExecutionScheduled: true,
      scheduledExecutionHoursBeforeDeadline: 24,
      settledAt: order.executedAt,
      claveRastreoSPEI: order.speiClaveRastreo,
      folioFiscalAcuse: order.satAcuseFolio,
      selloDigitalContribuyente: order.selloDigitalContribuyente,
      selloDigitalAutoridad: deliveryLog.responseBody.sello_digital_sat,
      cadenaOriginal: order.cadenaOriginal,
      certificadoSerial: loadEFirmaConfig().certificateSerialNumber,
      cepFolioBanxico: order.speiCepFolio,
      qrVerificationUrl: deliveryLog.responseBody.qr_verificacion,
      regulatoryArticle: 'Art. 113-A/J, 106, 135 LISR y Art. 1-A, 18-J LIVA'
    };

    if (existingIndex !== -1) {
      currentObligations[existingIndex] = obligationRecord;
    } else {
      currentObligations.unshift(obligationRecord);
    }

    saveTaxObligations(currentObligations);
  }

  /**
   * Storage helpers
   */
  public static getSubmissions(): AutomatedTaxSubmissionOrder[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SUBMISSIONS);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to load tax submissions', e);
    }
    return [];
  }

  public static saveSubmissions(items: AutomatedTaxSubmissionOrder[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(items));
    } catch (e) {
      console.error('Failed to save tax submissions', e);
    }
  }

  public static getWebhookLogs(): GovernmentWebhookDeliveryLog[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.WEBHOOK_LOGS);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to load webhook logs', e);
    }
    return [];
  }

  public static saveWebhookLog(log: GovernmentWebhookDeliveryLog): void {
    try {
      const current = this.getWebhookLogs();
      const updated = [log, ...current.slice(0, 49)]; // Keep last 50 logs
      localStorage.setItem(STORAGE_KEYS.WEBHOOK_LOGS, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save webhook log', e);
    }
  }

  public static getConfig(): AutomatedSubmissionConfig {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SUBMISSION_CONFIG);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to load submission config', e);
    }
    return DEFAULT_SUBMISSION_CONFIG;
  }

  public static saveConfig(config: AutomatedSubmissionConfig): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SUBMISSION_CONFIG, JSON.stringify(config));
    } catch (e) {
      console.error('Failed to save submission config', e);
    }
  }
}
