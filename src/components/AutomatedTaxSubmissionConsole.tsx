import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Calendar, 
  Clock, 
  ShieldCheck, 
  Key, 
  Send, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Code, 
  FileText, 
  ExternalLink, 
  Copy, 
  Check, 
  Play, 
  Settings, 
  Sliders, 
  DollarSign, 
  Zap, 
  ArrowRight,
  Activity,
  Layers,
  Terminal,
  Eye,
  Lock
} from 'lucide-react';
import { 
  AutomatedTaxSubmissionService, 
  DEFAULT_SAT_WITHHOLDING_RULES 
} from '../services/AutomatedTaxSubmissionService';
import { 
  SATWithholdingRule, 
  SATWithholdingBreakdown, 
  TaxPeriodEvaluation, 
  AutomatedTaxSubmissionOrder, 
  GovernmentWebhookDeliveryLog,
  AutomatedSubmissionConfig 
} from '../types/automatedTaxSubmission';
import { VaultBalances } from '../types/aml';
import { loadEFirmaConfig } from '../utils/taxEngine';

interface AutomatedTaxSubmissionConsoleProps {
  vaultBalances: VaultBalances;
  onUpdateVaultBalances: React.Dispatch<React.SetStateAction<VaultBalances>>;
  onSubmissionComplete?: (order: AutomatedTaxSubmissionOrder) => void;
}

export const AutomatedTaxSubmissionConsole: React.FC<AutomatedTaxSubmissionConsoleProps> = ({
  vaultBalances,
  onUpdateVaultBalances,
  onSubmissionComplete
}) => {
  // Calendar & Evaluation State
  const [currentDate] = useState<Date>(() => new Date('2026-10-17T14:44:28-07:00'));
  const [periodEval, setPeriodEval] = useState<TaxPeriodEvaluation>(() => 
    AutomatedTaxSubmissionService.evaluateCurrentFiscalPeriod(new Date('2026-10-17T14:44:28-07:00'))
  );

  // SAT Withholding Rules State
  const [rules, setRules] = useState<SATWithholdingRule[]>(() => [...DEFAULT_SAT_WITHHOLDING_RULES]);
  const [breakdown, setBreakdown] = useState<SATWithholdingBreakdown>(() => 
    AutomatedTaxSubmissionService.calculateSATWithholdings(DEFAULT_SAT_WITHHOLDING_RULES, 'Septiembre 2026')
  );

  // Submissions and Logs State
  const [submissions, setSubmissions] = useState<AutomatedTaxSubmissionOrder[]>(() => 
    AutomatedTaxSubmissionService.getSubmissions()
  );
  const [webhookLogs, setWebhookLogs] = useState<GovernmentWebhookDeliveryLog[]>(() => 
    AutomatedTaxSubmissionService.getWebhookLogs()
  );
  const [config, setConfig] = useState<AutomatedSubmissionConfig>(() => 
    AutomatedTaxSubmissionService.getConfig()
  );

  // Execution flow state
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionStep, setExecutionStep] = useState<'IDLE' | 'SIGNING' | 'SPEI' | 'WEBHOOK' | 'ACK'>('IDLE');
  const [selectedLog, setSelectedLog] = useState<GovernmentWebhookDeliveryLog | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<AutomatedTaxSubmissionOrder | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // EFirma state
  const efirma = loadEFirmaConfig();

  // Recalculate breakdown whenever rules change
  useEffect(() => {
    const updated = AutomatedTaxSubmissionService.calculateSATWithholdings(rules, periodEval.evaluatedTaxPeriod);
    setBreakdown(updated);
  }, [rules, periodEval.evaluatedTaxPeriod]);

  // Copy helper
  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Toggle rule active status
  const toggleRuleActive = (code: string) => {
    setRules(prev => prev.map(r => r.code === code ? { ...r, isActive: !r.isActive } : r));
  };

  // Update rule base amount
  const handleUpdateRuleBase = (code: string, newBase: number) => {
    setRules(prev => prev.map(r => r.code === code ? { ...r, baseAmountMXN: Math.max(0, newBase) } : r));
  };

  // Schedule auto submission
  const handleScheduleSubmission = () => {
    const newOrder = AutomatedTaxSubmissionService.scheduleSubmission(breakdown, periodEval.extendedDueDate);
    setSubmissions(AutomatedTaxSubmissionService.getSubmissions());
    setSelectedSubmission(newOrder);
    setSuccessBanner(`Orden ${newOrder.id} programada exitosamente para ejecución a las ${new Date(newOrder.scheduledFor).toLocaleDateString()} con Línea de Captura ${newOrder.captureLine}.`);
  };

  // Trigger Immediate Execution Pipeline
  const handleExecuteAutomatedSubmission = async () => {
    if (vaultBalances.MXN < breakdown.totalRetencionesMXN) {
      alert(`Fondos insuficientes en Bóveda MXN ($${vaultBalances.MXN.toLocaleString('es-MX')} MXN). Se requieren $${breakdown.totalRetencionesMXN.toLocaleString('es-MX')} MXN.`);
      return;
    }

    setIsExecuting(true);
    setExecutionStep('SIGNING');

    try {
      // 1. Create or get scheduled order
      const orderToExecute = AutomatedTaxSubmissionService.scheduleSubmission(breakdown, periodEval.extendedDueDate);
      
      // 2. Execute pipeline with step transitions
      const result = await AutomatedTaxSubmissionService.executeSubmission(orderToExecute.id, (step) => {
        setExecutionStep(step);
      });

      // 3. Deduct from Vault MXN
      onUpdateVaultBalances(prev => ({
        ...prev,
        MXN: Math.max(0, prev.MXN - breakdown.totalRetencionesMXN)
      }));

      // 4. Update UI states
      setSubmissions(AutomatedTaxSubmissionService.getSubmissions());
      setWebhookLogs(AutomatedTaxSubmissionService.getWebhookLogs());
      setSelectedSubmission(result.order);
      setSelectedLog(result.deliveryLog);
      
      setSuccessBanner(
        `¡Dispersión y Envío Automatizado Exitoso! Folio Acuse SAT: ${result.receiptFolio} | SPEI: ${result.order.speiClaveRastreo} | Webhook entregado con código HTTP 200.`
      );

      if (onSubmissionComplete) {
        onSubmissionComplete(result.order);
      }
    } catch (err: any) {
      console.error('Submission execution failed:', err);
      alert(`Error en ejecución automatizada: ${err.message || 'Error desconocido'}`);
    } finally {
      setIsExecuting(false);
      setExecutionStep('IDLE');
    }
  };

  return (
    <div className="space-y-6">
      {/* Success Notification Banner */}
      {successBanner && (
        <div className="p-4 bg-emerald-950/90 border border-emerald-500/50 rounded-xl text-emerald-200 text-sm flex items-center justify-between shadow-lg shadow-emerald-950/40">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <div>
              <p className="font-semibold text-emerald-300">Operación Completada</p>
              <p className="text-xs text-emerald-200/90">{successBanner}</p>
            </div>
          </div>
          <button 
            onClick={() => setSuccessBanner(null)}
            className="px-2.5 py-1 text-xs bg-emerald-900/60 hover:bg-emerald-900 text-emerald-300 rounded border border-emerald-700/50 transition-colors"
          >
            Entendido
          </button>
        </div>
      )}

      {/* Header Banner: AutomatedTaxSubmission Engine Status */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-950 text-cyan-300 border border-cyan-800/40 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400" />
                SERVICIO AUTÓNOMO 'AutomatedTaxSubmission'
              </span>
              <span className="px-2 py-0.5 rounded text-xs font-mono bg-slate-800 text-slate-300 border border-slate-700">
                Motor e.firma + Webhook SAT v2.1
              </span>
              <span className="px-2 py-0.5 rounded text-xs font-mono bg-emerald-950/80 text-emerald-400 border border-emerald-800/40 flex items-center gap-1">
                <Check className="w-3 h-3" />
                CFF Art. 12 & RMF 2.8.3.1 Activo
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-cyan-400" />
              Programación y Dispersión Automatizada de Retenciones SAT con Notificación Webhook
            </h2>
            <p className="text-xs text-slate-400 max-w-3xl">
              Calcula dinámicamente el entero de retenciones fiscales mexicanas (ISR e IVA) según el volumen de operaciones a la fecha actual, programa la liquidación SPEI a tiempo de firma con la FIEL y despacha el Webhook oficial con firma HMAC-SHA256 al portal del Gobierno Federal.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleScheduleSubmission}
              disabled={isExecuting}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <Calendar className="w-3.5 h-3.5 text-cyan-400" />
              Programar a Fecha Límite
            </button>
            <button
              onClick={handleExecuteAutomatedSubmission}
              disabled={isExecuting}
              className="px-4 py-2 bg-gradient-to-r from-cyan-600 via-teal-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-lg shadow-cyan-950/50 transition-all active:scale-95 disabled:opacity-50"
            >
              {isExecuting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                  <span>Procesando {executionStep}...</span>
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                  <span>Ejecutar Envío y Dispersión Automatizada</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Live Execution Pipeline Indicator */}
        {isExecuting && (
          <div className="mt-4 pt-4 border-t border-slate-800/80 bg-slate-950/60 -mx-5 -mb-5 p-4">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="font-semibold text-cyan-300">Pipeline de Ejecución en Tiempo Real</span>
              <span className="font-mono text-slate-300">Paso: {executionStep}</span>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className={`p-2 rounded border ${executionStep === 'SIGNING' ? 'bg-cyan-950/80 border-cyan-500 text-cyan-200 animate-pulse' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>
                1. Firma e.firma X.509
              </div>
              <div className={`p-2 rounded border ${executionStep === 'SPEI' ? 'bg-cyan-950/80 border-cyan-500 text-cyan-200 animate-pulse' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>
                2. Dispersión SPEI Banxico
              </div>
              <div className={`p-2 rounded border ${executionStep === 'WEBHOOK' ? 'bg-cyan-950/80 border-cyan-500 text-cyan-200 animate-pulse' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>
                3. Webhook HMAC-SHA256
              </div>
              <div className={`p-2 rounded border ${executionStep === 'ACK' ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>
                4. Acuse Oficial SAT
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Grid: 1. Current Date & Fiscal Calendar Evaluator | 2. Withholding Summary Totals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Dynamic Fiscal Date Engine */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4.5 space-y-3.5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-slate-200">Evaluación de Fecha Actual</h3>
            </div>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-cyan-950/80 text-cyan-300 border border-cyan-800/40">
              Tiempo Local
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center bg-slate-950/50 p-2.5 rounded border border-slate-800/80">
              <span className="text-slate-400">Fecha de Evaluación:</span>
              <span className="font-semibold text-slate-200 font-mono">{periodEval.currentDateFormatted}</span>
            </div>
            <div className="flex justify-between items-center bg-slate-950/50 p-2.5 rounded border border-slate-800/80">
              <span className="text-slate-400">Periodo Fiscal a Declarar:</span>
              <span className="font-bold text-cyan-400">{periodEval.evaluatedTaxPeriod}</span>
            </div>
            <div className="flex justify-between items-center bg-slate-950/50 p-2.5 rounded border border-slate-800/80">
              <span className="text-slate-400">Vencimiento Legal Ordinario:</span>
              <span className="font-mono text-slate-300">17 de Octubre de 2026</span>
            </div>
            <div className="flex justify-between items-center bg-slate-950/50 p-2.5 rounded border border-slate-800/80">
              <span className="text-slate-400">Prórroga 6to Dígito RFC ({periodEval.rfcSextoDigito}):</span>
              <span className="font-mono text-emerald-400 font-semibold">+{periodEval.rfcExtensionDays} días hábiles (RMF 2.8.3.1)</span>
            </div>
            <div className="flex justify-between items-center bg-cyan-950/40 p-2.5 rounded border border-cyan-900/50">
              <span className="text-cyan-300 font-medium">Fecha Límite Prorrogada:</span>
              <span className="font-bold text-cyan-200 font-mono">20 de Octubre de 2026</span>
            </div>
          </div>

          <div className="p-3 bg-slate-950/70 rounded-lg border border-slate-800 flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-[11px] text-slate-400">Estado de Cumplimiento SAT:</p>
              <p className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Al Corriente (0 Recargos)
              </p>
            </div>
            <div className="text-right">
              <p className="text-[11px] text-slate-400">Tiempo restante:</p>
              <p className="text-xs font-mono font-bold text-cyan-300">{periodEval.hoursUntilExtendedDeadline} hrs</p>
            </div>
          </div>
        </div>

        {/* Center/Right: Calculation Totals Card */}
        <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-xl p-4.5 space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-slate-200">Resumen Financiero de Retenciones a Enterar al SAT</h3>
              </div>
              <span className="text-xs font-mono text-slate-400">
                Periodo: {breakdown.period}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80 space-y-1">
                <span className="text-[11px] font-medium text-slate-400">Subtotal ISR Retenido:</span>
                <p className="text-lg font-mono font-bold text-sky-400">
                  ${breakdown.subtotalIsrRetenidoMXN.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
                </p>
                <p className="text-[10px] text-slate-500">Arts. 54, 106, 113-A, 113-J, 135 LISR</p>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80 space-y-1">
                <span className="text-[11px] font-medium text-slate-400">Subtotal IVA Retenido:</span>
                <p className="text-lg font-mono font-bold text-teal-400">
                  ${breakdown.subtotalIvaRetenidoMXN.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
                </p>
                <p className="text-[10px] text-slate-500">Arts. 1-A y 18-J Ley del IVA</p>
              </div>

              <div className="p-3 bg-gradient-to-br from-emerald-950/60 to-slate-950 rounded-lg border border-emerald-500/30 space-y-1">
                <span className="text-[11px] font-medium text-emerald-300">Total a Enterar al SAT:</span>
                <p className="text-lg font-mono font-bold text-emerald-400">
                  ${breakdown.totalRetencionesMXN.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
                </p>
                <p className="text-[10px] text-emerald-400/80">Línea de captura 20 dígitos</p>
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400 flex-shrink-0" />
              <div>
                <span className="text-slate-300 font-medium">Bóveda Soberana MXN Disponible: </span>
                <span className="font-mono font-bold text-emerald-400">
                  ${vaultBalances.MXN.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <span className="text-[11px]">Banco Destino:</span>
              <span className="font-mono text-slate-300">BBVA México (SAT Recaudación)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: SAT Withholding Rules Engine Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-950/40">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-slate-200">
              Reglas de Retención SAT Aplicables al Periodo ({rules.filter(r => r.isActive).length}/{rules.length} Activas)
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            Ajusta las bases imponibles para simular retenciones operativas en tiempo real
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/70 text-slate-400 font-mono text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Estado</th>
                <th className="py-2.5 px-3">Impuesto</th>
                <th className="py-2.5 px-3">Concepto & Fundamento Legal</th>
                <th className="py-2.5 px-3 text-right">Tasa SAT</th>
                <th className="py-2.5 px-3 text-right">Base Imponible (MXN)</th>
                <th className="py-2.5 px-3 text-right">Retención Calculada (MXN)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {rules.map((rule) => {
                const isSelected = rule.isActive;
                return (
                  <tr key={rule.code} className={`hover:bg-slate-800/40 transition-colors ${!isSelected ? 'opacity-50 bg-slate-950/30' : ''}`}>
                    <td className="py-2.5 px-3">
                      <input 
                        type="checkbox"
                        checked={rule.isActive}
                        onChange={() => toggleRuleActive(rule.code)}
                        className="rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-0 cursor-pointer"
                      />
                    </td>
                    <td className="py-2.5 px-3 font-mono">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        rule.taxType === 'ISR' 
                          ? 'bg-sky-950 text-sky-400 border border-sky-800/40' 
                          : 'bg-teal-950 text-teal-400 border border-teal-800/40'
                      }`}>
                        {rule.taxType}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <p className="font-semibold text-slate-200">{rule.name}</p>
                      <p className="text-[11px] text-cyan-400/90 font-mono">{rule.legalArticle}</p>
                      <p className="text-[10px] text-slate-500 line-clamp-1">{rule.description}</p>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-300">
                      {rule.ratePercentage.toFixed(2)}%
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <span className="text-slate-500">$</span>
                        <input
                          type="number"
                          value={rule.baseAmountMXN}
                          onChange={(e) => handleUpdateRuleBase(rule.code, parseFloat(e.target.value) || 0)}
                          disabled={!rule.isActive}
                          className="w-32 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-right font-mono text-slate-200 text-xs focus:border-cyan-500 focus:outline-none"
                        />
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400">
                      ${rule.calculatedTaxMXN.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 3: Webhook Notification & Dispatcher Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left: Webhook Security & Configuration */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4.5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-slate-200">Protocolo de Notificación Webhook (SAT / TESOFE)</h3>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800/40">
              HMAC-SHA256
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Target Government Webhook URL:</label>
              <div className="flex items-center gap-1.5 bg-slate-950 p-2 rounded border border-slate-800 font-mono text-slate-300">
                <span className="text-emerald-400 font-bold">POST</span>
                <span className="truncate flex-1">{config.webhookEndpointUrl}</span>
                <button 
                  onClick={() => handleCopy(config.webhookEndpointUrl, 'wh_url')}
                  className="text-slate-400 hover:text-cyan-300 ml-1"
                >
                  {copiedKey === 'wh_url' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Government Portal Shared Secret (HMAC Key):</label>
              <div className="flex items-center justify-between bg-slate-950 p-2 rounded border border-slate-800 font-mono text-slate-300">
                <span className="text-amber-400 truncate">•••••••••••••••••••••••••• (HSM FIPS-140-2)</span>
                <span className="text-[10px] text-slate-500 font-sans">Enclave Criptográfico</span>
              </div>
            </div>

            <div className="p-3 bg-slate-950/70 rounded-lg border border-slate-800 space-y-2">
              <span className="text-slate-300 font-semibold block text-[11px]">Cabeceras de Autenticidad en Despacho:</span>
              <ul className="space-y-1 text-[11px] font-mono text-slate-400">
                <li className="flex justify-between">
                  <span className="text-cyan-400">X-SAT-Signature:</span>
                  <span className="text-slate-300">sha256=HMAC_SHA256(payload, secret)</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-cyan-400">X-Timestamp:</span>
                  <span className="text-slate-300">Epoch ISO 8601 UTC Nonce</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-cyan-400">X-Idempotency-Key:</span>
                  <span className="text-slate-300">IDEMP-SUB-SAT-2026-UUID</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-cyan-400">X-RFC-Emisor:</span>
                  <span className="text-slate-300">{efirma.rfc}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Right: Last Dispatched Webhook Payload / Acuse Viewer */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4.5 space-y-3 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <Code className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-slate-200">
                {selectedLog ? `Detalle Webhook: ${selectedLog.id}` : 'Inspector de Carga Útil (JSON Payload)'}
              </h3>
            </div>
            {selectedLog && (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-800/40">
                HTTP {selectedLog.httpStatus} OK ({selectedLog.latencyMs}ms)
              </span>
            )}
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-[11px] text-slate-300 overflow-y-auto max-h-56 space-y-1">
            {selectedLog ? (
              <pre className="text-emerald-300 whitespace-pre-wrap">
                {JSON.stringify({
                  request: {
                    endpoint: selectedLog.targetEndpoint,
                    headers: selectedLog.requestHeaders.reduce((acc, h) => ({ ...acc, [h.key]: h.value }), {}),
                    payload: selectedLog.requestPayload
                  },
                  response: selectedLog.responseBody
                }, null, 2)}
              </pre>
            ) : (
              <div className="text-slate-500 py-8 text-center space-y-2">
                <Code className="w-8 h-8 mx-auto text-slate-600" />
                <p>Ningún Webhook ejecutado en esta sesión todavía.</p>
                <p className="text-[10px]">Pulsa "Ejecutar Envío y Dispersión Automatizada" para generar la firma, pago SPEI y transmisión Webhook.</p>
              </div>
            )}
          </div>

          {selectedLog && (
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-slate-400">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Folio Acuse: <strong className="text-emerald-300 font-mono">{selectedLog.responseBody.folio_acuse_sat}</strong></span>
              </div>
              <a
                href={selectedLog.responseBody.qr_verificacion}
                target="_blank"
                rel="noreferrer"
                className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium"
              >
                <span>Validar en Portal SAT</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Section 4: History Table of Dispatched Submissions & Webhook Logs */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-slate-200">
              Historial de Órdenes y Transmisiones Webhook a Gobierno ({webhookLogs.length} Eventos)
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            Registro inmutable de declaraciones provisionales y enteros fiscales
          </span>
        </div>

        {webhookLogs.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            No hay transmisiones Webhook registradas aún en el historial.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/70 text-slate-400 font-mono text-[11px] border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Submission ID</th>
                  <th className="py-2.5 px-3">Línea de Captura</th>
                  <th className="py-2.5 px-3">Monto Total</th>
                  <th className="py-2.5 px-3">Status Webhook</th>
                  <th className="py-2.5 px-3">Folio Acuse SAT</th>
                  <th className="py-2.5 px-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {webhookLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-3 font-mono text-slate-400 text-[11px]">
                      {new Date(log.timestamp).toLocaleString('es-MX')}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-semibold text-cyan-400">
                      {log.submissionId}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-300">
                      {log.requestPayload.linea_captura_sat}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-emerald-400">
                      ${log.requestPayload.total_retenciones_a_enterar_mxn.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800/40 flex items-center gap-1 w-fit">
                        <Check className="w-3 h-3" />
                        HTTP 200 OK
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-300 text-[11px]">
                      {log.responseBody.folio_acuse_sat}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px] font-medium transition-colors flex items-center gap-1 ml-auto"
                      >
                        <Eye className="w-3 h-3 text-cyan-400" />
                        Ver Payload
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
