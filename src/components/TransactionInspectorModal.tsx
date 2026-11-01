import React, { useState, useEffect } from 'react';
import { Transaction } from '../types/aml';
import { RiskScoreDisplay } from './RiskScoreDisplay';
import { buildUifOfficialJsonPayload } from '../utils/riskEngine';
import { downloadJsonFile } from '../utils/exportUtils';
import { formatAccountDisplay } from '../utils/mexicanBanks';
import { 
  X, 
  Send, 
  Download, 
  Copy, 
  Check, 
  ExternalLink, 
  ShieldAlert, 
  Cpu, 
  Building2, 
  Coins, 
  UserCheck, 
  Clock,
  Archive,
  FolderArchive,
  Percent,
  Scale,
  Lock,
  AlertTriangle,
  Gavel,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';

interface TransactionInspectorModalProps {
  transaction: Transaction | null;
  onClose: () => void;
  onDispatchSar: (txId: string) => void;
  onUpdateFeeStatus?: (txId: string, action: 'HOLD_8' | 'SEIZE_20' | 'STANDARD_1_8') => void;
}

export const TransactionInspectorModal: React.FC<TransactionInspectorModalProps> = ({
  transaction,
  onClose,
  onDispatchSar,
  onUpdateFeeStatus
}) => {
  const [activeTab, setActiveTab] = useState<'equation' | 'fees' | 'entities' | 'json'>('equation');
  const [copiedJson, setCopiedJson] = useState(false);
  const [feeActionFeedback, setFeeActionFeedback] = useState<string | null>(null);

  if (!transaction) return null;

  useEffect(() => {
    const handleClose = () => onClose();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('amlanfat:close_active_modal', handleClose);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('amlanfat:close_active_modal', handleClose);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const jsonPayload = buildUifOfficialJsonPayload(transaction);
  const fee = transaction.feeBreakdown || {
    feePercentage: 1.8,
    feeCategory: 'STANDARD_PROCESSED' as const,
    feeCategoryLabel: 'Procesamiento Estándar (1.8%)',
    feeAmountMXN: Math.round(transaction.amountMXN * 0.018),
    netDisbursedMXN: Math.round(transaction.amountMXN * 0.982),
    isTemporaryHold: false,
    isSeized: false
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(jsonPayload, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  const handleDownloadJson = () => {
    downloadJsonFile(jsonPayload, `SAR_UIF_${transaction.id}.json`);
  };

  const handleFeeAction = (action: 'HOLD_8' | 'SEIZE_20' | 'STANDARD_1_8') => {
    if (onUpdateFeeStatus) {
      onUpdateFeeStatus(transaction.id, action);
      if (action === 'HOLD_8') {
        setFeeActionFeedback('Retención Temporal de Liquidación aplicada con cargo del 8.0%.');
      } else if (action === 'SEIZE_20') {
        setFeeActionFeedback('Decomiso regulatorio oficial ejecutado con cargo del 20.0%.');
      } else {
        setFeeActionFeedback('Operación restablecida a procesamiento estándar (1.8%).');
      }
      setTimeout(() => setFeeActionFeedback(null), 4000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-slate-800 border border-slate-700">
              {transaction.channel === 'CRYPTO' ? (
                <Coins className="w-5 h-5 text-amber-400" />
              ) : (
                <Building2 className="w-5 h-5 text-sky-400" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-white font-mono">{transaction.id}</h2>
                <span className="text-xs text-slate-400">·</span>
                <span className="text-xs text-slate-300 font-medium">
                  {transaction.channel === 'CRYPTO' ? transaction.cryptoNetwork : `${transaction.channel} (${transaction.bankName || 'Bancario'})`}
                </span>
                
                {/* Fee Badge in Header */}
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                  fee.isSeized 
                    ? 'bg-rose-950/80 text-rose-300 border-rose-700/60 font-bold'
                    : fee.isTemporaryHold
                    ? 'bg-amber-950/80 text-amber-300 border-amber-700/60 font-bold'
                    : fee.feePercentage === 2.5
                    ? 'bg-yellow-950/80 text-yellow-300 border-yellow-700/60'
                    : 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60'
                }`}>
                  Tarifa: {fee.feePercentage}% {fee.isSeized ? '(Decomiso)' : fee.isTemporaryHold ? '(Retención)' : ''}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Clave de Rastreo / Hash: <span className="font-mono text-slate-300 select-all">{transaction.trackingKey}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="px-6 py-2.5 bg-slate-950/60 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('equation')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                activeTab === 'equation'
                  ? 'bg-slate-800 text-white border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Desglose Ecuación AML (0-1000)
            </button>
            <button
              onClick={() => setActiveTab('fees')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'fees'
                  ? 'bg-slate-800 text-teal-300 border border-teal-500/50'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Percent className="w-3.5 h-3.5 text-teal-400" />
              <span>Aranceles & Decomisos ({fee.feePercentage}%)</span>
            </button>
            <button
              onClick={() => setActiveTab('entities')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                activeTab === 'entities'
                  ? 'bg-slate-800 text-white border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Remitente & Beneficiario
            </button>
            <button
              onClick={() => setActiveTab('json')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                activeTab === 'json'
                  ? 'bg-slate-800 text-white border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Payload JSON Oficial UIF / CenFi
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[11px] text-slate-400 block">Monto Transacción</span>
              <span className="text-sm font-semibold text-white font-mono tabular-nums">
                {transaction.amount.toLocaleString()} {transaction.currency}
                {transaction.currency !== 'MXN' && (
                  <span className="text-xs text-slate-400 ml-1.5">
                    (≈ ${transaction.amountMXN.toLocaleString()} MXN)
                  </span>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Content body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {feeActionFeedback && (
            <div className="p-3 rounded-xl bg-teal-950/70 border border-teal-700 text-xs text-teal-200 flex items-center gap-2">
              <Check className="w-4 h-4 text-teal-400" />
              <span>{feeActionFeedback}</span>
            </div>
          )}

          {/* Regulatory Blacklist Screening Result Banner */}
          {transaction.isBlacklisted || transaction.blacklistMatch ? (
            <div className="p-4 rounded-xl bg-rose-950/50 border border-rose-500/60 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-rose-300 font-bold text-xs">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>🚨 ALERTA REGULATORIA MÁXIMA: COINCIDENCIA CONFIRMADA EN LISTA NEGRA</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-900 text-rose-200 border border-rose-700">
                  {transaction.blacklistMatch?.authority || 'OFAC_SDN'}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono text-slate-300 pt-1">
                <div>
                  <span className="text-slate-400">Entidad Sancionada: </span>
                  <span className="text-white font-bold">{transaction.blacklistMatch?.matchedEntity || transaction.originator.name}</span>
                </div>
                <div>
                  <span className="text-slate-400">Oficio / Notificación: </span>
                  <span className="text-amber-400 font-semibold">{transaction.blacklistMatch?.sanctionOrderFolio || 'DOF-ORDEN-2026'}</span>
                </div>
                <div>
                  <span className="text-slate-400">Identificador Detectado: </span>
                  <span className="text-rose-300 break-all">{transaction.blacklistMatch?.matchedIdentifier || transaction.originator.accountOrAddress}</span>
                </div>
                <div>
                  <span className="text-slate-400">Medida Cautelar Obligatoria: </span>
                  <span className="text-rose-400 font-bold">
                    {fee.isSeized ? 'DECOMISO JUDICIAL 20.0%' : 'RETENCIÓN PREVENTIVA 8.0%'}
                  </span>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 font-mono border-t border-rose-900/40 pt-1">
                Dictamen: {transaction.blacklistMatch?.notes || 'Bloqueo legal obligatorio conforme al Art. 115 LIC / OFAC SDN.'}
              </p>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-slate-950/70 border border-emerald-500/30 flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-2 text-emerald-400">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="font-semibold">Verificación de Listas Negras (OFAC / UIF 115 / SAT 69-B): CLEAR</span>
              </div>
              <span className="text-[10px] text-slate-400">Sin antecedentes ni medidas cautelares</span>
            </div>
          )}

          {activeTab === 'equation' && (
            <div className="space-y-6">
              {/* Score header box */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
                      Evaluación Integral de Riesgo
                    </span>
                    <span className="text-xs text-slate-500 font-mono">Art. 115 LIC & GAFI</span>
                  </div>
                  <p className="text-xs text-slate-400 max-w-xl">
                    Ponderación algorítmica multidimensional del comportamiento de la transferencia frente a tipologías de lavado de dinero y financiamiento al terrorismo.
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <RiskScoreDisplay
                    score={transaction.riskBreakdown.totalScore}
                    level={transaction.riskLevel}
                    size="lg"
                    showBar={true}
                  />
                </div>
              </div>

              {/* Factors grid */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-200">Factores de la Ecuación Ponderada de Riesgo</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Factor 1 */}
                  <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-300 font-medium">1. Pitufeo / Estructuración (Smurfing)</span>
                      <span className="font-mono tabular-nums font-semibold text-slate-200">
                        {transaction.riskBreakdown.structuringScore} / 200
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-indigo-500" 
                        style={{ width: `${(transaction.riskBreakdown.structuringScore / 200) * 100}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Monitorea transferencias fragmentadas en proximidad al umbral legal de $140,000 MXN / $7,500 USD (Art. 115 LIC).
                    </p>
                  </div>

                  {/* Factor 2 */}
                  <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-300 font-medium">2. Contaminación On-Chain / Mezcladores</span>
                      <span className="font-mono tabular-nums font-semibold text-slate-200">
                        {transaction.riskBreakdown.mixerDarknetScore} / 250
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-rose-500" 
                        style={{ width: `${(transaction.riskBreakdown.mixerDarknetScore / 250) * 100}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Rastreo de saltos hacia Tornado Cash, Sinbad, wallets sancionadas o depósitos de efectivo en sucursales de alto riesgo.
                    </p>
                  </div>

                  {/* Factor 3 */}
                  <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-300 font-medium">3. Listas OFAC, GAFI & PEPs</span>
                      <span className="font-mono tabular-nums font-semibold text-slate-200">
                        {transaction.riskBreakdown.sanctionsScore} / 250
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-amber-500" 
                        style={{ width: `${(transaction.riskBreakdown.sanctionsScore / 250) * 100}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Cotejo contra listas de países no cooperantes GAFI, lista SDN de la OFAC y catálogo de Personas Expuestas Políticamente.
                    </p>
                  </div>

                  {/* Factor 4 */}
                  <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-300 font-medium">4. Velocidad & Ráfaga Transaccional</span>
                      <span className="font-mono tabular-nums font-semibold text-slate-200">
                        {transaction.riskBreakdown.velocityScore} / 150
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-cyan-500" 
                        style={{ width: `${(transaction.riskBreakdown.velocityScore / 150) * 100}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Detección de dispersión acelerada de fondos dentro de ventanas temporales menores a 10 minutos.
                    </p>
                  </div>

                  {/* Factor 5 */}
                  <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800 space-y-2 md:col-span-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-300 font-medium">5. Discrepancia Perfil KYC / Nivel de Cuenta</span>
                      <span className="font-mono tabular-nums font-semibold text-slate-200">
                        {transaction.riskBreakdown.kycDiscrepancyScore} / 150
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-purple-500" 
                        style={{ width: `${(transaction.riskBreakdown.kycDiscrepancyScore / 150) * 100}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Incongruencia entre el nivel de identificación del originador (Nivel 1 básico vs operaciones corporativas) y su capacidad económica comprobable.
                    </p>
                  </div>
                </div>
              </div>

              {/* Flags list */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wide block">
                  Alertas Específicas Detonadas ({transaction.riskBreakdown.flags.length})
                </span>
                {transaction.riskBreakdown.flags.length > 0 ? (
                  <div className="space-y-1.5">
                    {transaction.riskBreakdown.flags.map((flag, idx) => (
                      <div key={idx} className="p-2.5 rounded-lg bg-rose-950/30 border border-rose-800/40 text-xs text-rose-300 flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                        <span>{flag}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-900/30 text-xs text-emerald-300">
                    Operación sin banderas de riesgo atípicas. Parámetros dentro del rango nominal de debida diligencia.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: FEES & CHARGES (1.8%, 2.5%, 8%, 20%) */}
          {activeTab === 'fees' && (
            <div className="space-y-6">
              {/* Tariff Card Summary */}
              <div className="p-5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Scale className="w-5 h-5 text-teal-400" />
                    <div>
                      <h3 className="text-sm font-bold text-white">Estructura Arancelaria & Retenciones AMLanfat</h3>
                      <p className="text-[11px] text-slate-400">
                        Cargos por transferencia procesada, sobretasa por riesgo, retención preventiva y decomisos.
                      </p>
                    </div>
                  </div>

                  <span className={`text-xs font-mono font-bold px-3 py-1 rounded-full border ${
                    fee.isSeized
                      ? 'bg-rose-950 text-rose-300 border-rose-600'
                      : fee.isTemporaryHold
                      ? 'bg-amber-950 text-amber-300 border-amber-600'
                      : fee.feePercentage === 2.5
                      ? 'bg-yellow-950 text-yellow-300 border-yellow-600'
                      : 'bg-emerald-950 text-emerald-300 border-emerald-600'
                  }`}>
                    {fee.feeCategoryLabel}
                  </span>
                </div>

                {/* Numbers calculation */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 block text-[11px]">Monto Bruto de la Operación</span>
                    <strong className="text-base font-bold font-mono text-white mt-1 block">
                      ${transaction.amountMXN.toLocaleString()} MXN
                    </strong>
                    <span className="text-[10px] text-slate-500 font-mono">Base arancelaria</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 text-[11px]">Comisión Retenida ({fee.feePercentage}%)</span>
                      <Percent className="w-3.5 h-3.5 text-teal-400" />
                    </div>
                    <strong className="text-base font-bold font-mono text-teal-400 mt-1 block">
                      ${fee.feeAmountMXN.toLocaleString()} MXN
                    </strong>
                    <span className="text-[10px] text-teal-300/80 font-mono">Ingresado a Bóveda Soberana</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 block text-[11px]">Neto Liquidado / Disponible</span>
                    <strong className="text-base font-bold font-mono text-emerald-400 mt-1 block">
                      ${fee.netDisbursedMXN.toLocaleString()} MXN
                    </strong>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {fee.isTemporaryHold ? 'En custodia preventiva' : fee.isSeized ? 'Sujeto a extinción' : 'Liquidación aprobada'}
                    </span>
                  </div>
                </div>

                {/* Legal Justification Table */}
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2 text-xs">
                  <span className="font-semibold text-slate-300 block">Esquema Arancelario Oficial Aplicable:</span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                    <div className={`p-2.5 rounded-lg border ${fee.feePercentage === 1.8 ? 'bg-slate-800 border-teal-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400'}`}>
                      <strong className="text-white block">1.8% Transferencia Ordinaria (Riesgo Bajo)</strong>
                      <span>Operaciones que cumplen nominalmente con todos los filtros KYC y sin banderas.</span>
                    </div>

                    <div className={`p-2.5 rounded-lg border ${fee.feePercentage === 2.5 ? 'bg-slate-800 border-yellow-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400'}`}>
                      <strong className="text-white block">2.5% Riesgo Medio o Alto</strong>
                      <span>Aplica para transacciones con Score 300 - 799 sujetas a debida diligencia reforzada (EDD).</span>
                    </div>

                    <div className={`p-2.5 rounded-lg border ${fee.feePercentage === 8.0 ? 'bg-slate-800 border-amber-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400'}`}>
                      <strong className="text-white block">8.0% Retención Temporal de Liquidación</strong>
                      <span>Custodia preventiva por factores de riesgo crítico previo a dictamen de la UIF.</span>
                    </div>

                    <div className={`p-2.5 rounded-lg border ${fee.feePercentage === 20.0 ? 'bg-slate-800 border-rose-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400'}`}>
                      <strong className="text-white block">20.0% Decomisos Oficiales / Judiciales</strong>
                      <span>Honorario de extinción de dominio por fondos ilícitos confirmados o listas negras OFAC/GAFI.</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Compliance Officer Tariff Override Actions */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                <span className="text-xs font-semibold text-slate-200 block">
                  Acciones del Oficial de Cumplimiento sobre esta Liquidación:
                </span>

                <div className="flex flex-wrap gap-2 text-xs">
                  <button
                    onClick={() => handleFeeAction('HOLD_8')}
                    className="flex items-center gap-1.5 px-3 py-2 bg-amber-950/80 hover:bg-amber-900/80 text-amber-300 border border-amber-700/60 rounded-xl transition-colors cursor-pointer font-medium"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Aplicar Retención Temporal (Cobrar 8.0%)</span>
                  </button>

                  <button
                    onClick={() => handleFeeAction('SEIZE_20')}
                    className="flex items-center gap-1.5 px-3 py-2 bg-rose-950/80 hover:bg-rose-900/80 text-rose-300 border border-rose-700/60 rounded-xl transition-colors cursor-pointer font-medium"
                  >
                    <Gavel className="w-3.5 h-3.5" />
                    <span>Ejecutar Decomiso Regulatorio (Cobrar 20.0%)</span>
                  </button>

                  <button
                    onClick={() => handleFeeAction('STANDARD_1_8')}
                    className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Restablecer a Tarifa Ordinaria (1.8% / 2.5%)</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'entities' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Originator */}
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-semibold text-cyan-400">EXPEDIENTE REMITENTE (ORIGINADOR)</span>
                    <span className="text-[11px] text-slate-400 font-mono">{transaction.originator.jurisdiction}</span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Nombre o Razón Social:</span>
                      <strong className="text-white text-sm">{transaction.originator.name}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">RFC / Tax ID:</span>
                      <strong className="text-slate-200 font-mono">{transaction.originator.taxId}</strong>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-slate-400 block text-[11px]">Cuenta / Dirección Origen:</span>
                        {transaction.channel === 'SPEI' && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-900 text-cyan-300 border border-slate-800">
                            {transaction.originator.accountOrAddress.length === 16 ? 'PAN 16d' : (transaction.originator.accountOrAddress.length === 10 ? 'DiMo 10d' : 'CLABE 18d')}
                          </span>
                        )}
                      </div>
                      <span className="text-slate-200 font-mono text-[11px] break-all select-all font-semibold">
                        {transaction.channel === 'SPEI' 
                          ? formatAccountDisplay(
                              transaction.originator.accountOrAddress, 
                              transaction.originator.accountOrAddress.length === 16 ? 'PAN_16' : (transaction.originator.accountOrAddress.length === 10 ? 'DIMO_10' : 'CLABE_18')
                            )
                          : transaction.originator.accountOrAddress}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 pt-2">
                      <div>
                        <span className="text-slate-400 text-[11px] block">Nivel KYC:</span>
                        <span className="text-slate-200 font-medium">{transaction.originator.kycTier}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[11px] block">Condición PEP:</span>
                        <span className={transaction.originator.isPEP ? 'text-amber-400 font-semibold' : 'text-slate-300'}>
                          {transaction.originator.isPEP ? 'SÍ (Expuesta Políticamente)' : 'NO'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Beneficiary */}
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-semibold text-emerald-400">EXPEDIENTE BENEFICIARIO (DESTINO)</span>
                    <span className="text-[11px] text-slate-400 font-mono">{transaction.beneficiary.jurisdiction}</span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Nombre / Bóveda Receptora:</span>
                      <strong className="text-white text-sm">{transaction.beneficiary.name}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">RFC / Tax ID:</span>
                      <strong className="text-slate-200 font-mono">{transaction.beneficiary.taxId}</strong>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-slate-400 block text-[11px]">Destino de Abono (CLABE / PAN / DiMo / Wallet):</span>
                        {transaction.beneficiaryAccountFormat && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-900 text-emerald-300 border border-slate-800">
                            {transaction.beneficiaryAccountFormat === 'PAN_16' ? 'PAN 16d' : (transaction.beneficiaryAccountFormat === 'DIMO_10' ? 'DiMo 10d' : 'CLABE 18d')}
                          </span>
                        )}
                      </div>
                      <span className="text-slate-200 font-mono text-[11px] break-all select-all font-semibold">
                        {transaction.beneficiaryAccountFormat 
                          ? formatAccountDisplay(transaction.beneficiary.accountOrAddress, transaction.beneficiaryAccountFormat)
                          : transaction.beneficiary.accountOrAddress}
                      </span>
                    </div>
                    <div className="pt-2">
                      <span className="text-slate-400 text-[11px] block">Institución Financiera / VASP:</span>
                      <span className="text-slate-200 font-medium">{transaction.beneficiary.institution}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Concept & Compliance */}
              <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 space-y-2 text-xs">
                <span className="text-slate-400 text-[11px] uppercase tracking-wide font-medium">Concepto Declarado en la Instrucción</span>
                <p className="text-slate-200 font-mono">{transaction.concept}</p>
              </div>
            </div>
          )}

          {activeTab === 'json' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-slate-200">
                    Estructura JSON Oficial para UIF México & CenFi / GAFI
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Layout estandarizado conforme a las Disposiciones Generales del Art. 58 Ley Fintech y Art. 115 LIC.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyJson}
                    className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-md transition-colors cursor-pointer"
                  >
                    {copiedJson ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedJson ? 'Copiado' : 'Copiar'}</span>
                  </button>
                  <button
                    onClick={handleDownloadJson}
                    className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 hover:bg-emerald-900/60 rounded-md transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Descargar .json</span>
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-emerald-300/90 overflow-x-auto max-h-[360px] leading-relaxed select-all">
                <pre>{JSON.stringify(jsonPayload, null, 2)}</pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 bg-slate-900/90 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-slate-400">
            {transaction.riskBreakdown.totalScore >= 800 ? (
              <span className="text-rose-400 font-medium flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                Score reprobable: Transmisión obligatoria e inmediata de reporte SAR a UIF.
              </span>
            ) : (
              <span className="text-slate-400">
                Score por debajo de umbral reprobable (800). Archivo en resguardo interno de fiscalización por 10 años.
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {transaction.sarStatus === 'NONE' || transaction.sarStatus === 'AUTO_QUEUED' ? (
              <button
                onClick={() => onDispatchSar(transaction.id)}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Despachar SAR a UIF / CenFi</span>
              </button>
            ) : (
              <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/40 px-3 py-1.5 rounded-lg border border-emerald-800/40">
                <Check className="w-4 h-4" />
                <span>Transmitido · Folio: <strong className="font-mono text-emerald-300">{transaction.sarFolio}</strong></span>
              </div>
            )}
            
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
