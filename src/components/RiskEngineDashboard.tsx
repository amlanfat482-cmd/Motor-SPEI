import React, { useState } from 'react';
import { EngineStats, Transaction, TransactionChannel } from '../types/aml';
import { RiskScoreDisplay } from './RiskScoreDisplay';
import { 
  Zap, 
  Flame, 
  Trash2, 
  PlusCircle, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertOctagon, 
  Building2, 
  Coins, 
  FileCode2, 
  ExternalLink, 
  ShieldCheck, 
  Send, 
  Eye, 
  RefreshCw,
  Archive,
  FolderArchive,
  Clock,
  Radio,
  Play,
  Pause,
  Activity,
  Gauge,
  Sparkles,
  Percent,
  Scale,
  Lock,
  Gavel
} from 'lucide-react';

interface RiskEngineDashboardProps {
  transactions: Transaction[];
  engineStats: EngineStats;
  onSetEngineMode: (mode: 'STANDARD' | 'ACCELERATOR' | 'TURBO') => void;
  onToggleAutoDispatch: () => void;
  onCleanBufferMemory: () => void;
  onGenerateBatch: (channel?: TransactionChannel, forceReprobable?: boolean) => void;
  onInspectTransaction: (tx: Transaction) => void;
  onDispatchSar: (txId: string) => void;
  onTriggerArchiveCycle: () => void;
  onToggleStreaming?: () => void;
  onSetStreamingSpeed?: (speedMs: number) => void;
  onUpdateFeeStatus?: (txId: string, action: 'HOLD_8' | 'SEIZE_20' | 'STANDARD_1_8') => void;
}

export const RiskEngineDashboard: React.FC<RiskEngineDashboardProps> = ({
  transactions,
  engineStats,
  onSetEngineMode,
  onToggleAutoDispatch,
  onCleanBufferMemory,
  onGenerateBatch,
  onInspectTransaction,
  onDispatchSar,
  onTriggerArchiveCycle,
  onToggleStreaming,
  onSetStreamingSpeed,
  onUpdateFeeStatus
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'BANKING' | 'CRYPTO' | 'REPROBABLE' | 'BLACKLIST' | 'FEE_1_8' | 'FEE_2_5' | 'FEE_8' | 'FEE_20'>('ALL');
  const [cleanFeedback, setCleanFeedback] = useState(false);

  const handleCleanMemory = () => {
    onCleanBufferMemory();
    setCleanFeedback(true);
    setTimeout(() => setCleanFeedback(false), 2000);
  };

  // Real-time calculated fee metrics from active transactions
  const totalFeesCollected = transactions.reduce(
    (sum, t) => sum + (t.feeBreakdown?.feeAmountMXN || Math.round(t.amountMXN * 0.018)), 
    0
  );
  const count1_8 = transactions.filter((t) => !t.feeBreakdown?.isTemporaryHold && !t.feeBreakdown?.isSeized && (t.feeBreakdown?.feePercentage === 1.8 || !t.feeBreakdown)).length;
  const count2_5 = transactions.filter((t) => !t.feeBreakdown?.isTemporaryHold && !t.feeBreakdown?.isSeized && t.feeBreakdown?.feePercentage === 2.5).length;
  const count8_0 = transactions.filter((t) => t.feeBreakdown?.isTemporaryHold || t.feeBreakdown?.feePercentage === 8.0).length;
  const count20_0 = transactions.filter((t) => t.feeBreakdown?.isSeized || t.feeBreakdown?.feePercentage === 20.0).length;
  const countBlacklist = transactions.filter((t) => t.isBlacklisted || t.blacklistMatch).length;

  const filteredTransactions = transactions.filter((t) => {
    // Search query match
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || 
      t.id.toLowerCase().includes(q) ||
      t.originator.name.toLowerCase().includes(q) ||
      t.originator.taxId.toLowerCase().includes(q) ||
      t.trackingKey.toLowerCase().includes(q) ||
      (t.cryptoNetwork && t.cryptoNetwork.toLowerCase().includes(q)) ||
      (t.bankName && t.bankName.toLowerCase().includes(q));

    if (!matchesSearch) return false;

    if (filterType === 'BANKING') return t.channel === 'SPEI' || t.channel === 'SWIFT';
    if (filterType === 'CRYPTO') return t.channel === 'CRYPTO';
    if (filterType === 'REPROBABLE') return t.riskBreakdown.totalScore >= 800;
    if (filterType === 'BLACKLIST') return t.isBlacklisted || t.blacklistMatch;
    if (filterType === 'FEE_1_8') return !t.feeBreakdown?.isTemporaryHold && !t.feeBreakdown?.isSeized && (t.feeBreakdown?.feePercentage === 1.8 || !t.feeBreakdown);
    if (filterType === 'FEE_2_5') return !t.feeBreakdown?.isTemporaryHold && !t.feeBreakdown?.isSeized && t.feeBreakdown?.feePercentage === 2.5;
    if (filterType === 'FEE_8') return t.feeBreakdown?.isTemporaryHold || t.feeBreakdown?.feePercentage === 8.0;
    if (filterType === 'FEE_20') return t.feeBreakdown?.isSeized || t.feeBreakdown?.feePercentage === 20.0;

    return true;
  });

  const bufferPercentage = Math.min(100, Math.round((engineStats.bufferMemoryKB / engineStats.bufferCapacityKB) * 100));

  return (
    <div className="space-y-6">
      {/* Engine Status & Accelerator / Turbo Panel */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${engineStats.isStreamingActive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <h1 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <span>Motor de Riesgo AMLanfat · Núcleo de Evaluación (0-1000)</span>
                <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/70 border border-emerald-700/60 px-2 py-0.2 rounded-full">
                  {engineStats.isStreamingActive ? 'SINCRONIZADO EN TIEMPO REAL' : 'PAUSADO'}
                </span>
              </h1>
              <span className="text-xs text-slate-400 font-mono">v3.8-CNBV</span>
            </div>
            <p className="text-xs text-slate-400 max-w-2xl">
              Motor analítico sincrónico en tiempo real para evaluar transferencias SPEI, SWIFT bancario y todas las redes de criptoactivos contra la ecuación de riesgo y listas CenFi/GAFI.
            </p>
          </div>

          {/* Accelerator & Turbo Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-[11px] text-slate-400 mr-1 hidden sm:block">Aceleración:</div>
            
            <button
              onClick={() => onSetEngineMode('STANDARD')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                engineStats.mode === 'STANDARD'
                  ? 'bg-slate-800 text-slate-100 border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
              }`}
            >
              <span>Estándar (1x)</span>
            </button>

            <button
              onClick={() => onSetEngineMode('ACCELERATOR')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                engineStats.mode === 'ACCELERATOR'
                  ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-cyan-300 hover:bg-slate-850'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span>Acelerador (5x)</span>
            </button>

            <button
              onClick={() => onSetEngineMode('TURBO')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                engineStats.mode === 'TURBO'
                  ? 'bg-amber-950/80 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-amber-300 hover:bg-slate-850'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>Turbo Bloques (20x)</span>
            </button>
          </div>
        </div>

        {/* Real-time Streaming Live Sync Controller Bar */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950/30 border border-emerald-500/30 flex flex-col lg:flex-row lg:items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border flex items-center justify-center shrink-0 ${
              engineStats.isStreamingActive 
                ? 'bg-emerald-950/80 border-emerald-500 text-emerald-400' 
                : 'bg-slate-950 border-slate-800 text-slate-500'
            }`}>
              <Radio className={`w-5 h-5 ${engineStats.isStreamingActive ? 'animate-pulse' : ''}`} />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${engineStats.isStreamingActive ? 'bg-emerald-400 animate-ping' : 'bg-slate-600'}`} />
                <strong className="text-white text-xs font-semibold">
                  {engineStats.isStreamingActive ? 'Sincronización en Tiempo Real: ACTIVA (En Vivo)' : 'Sincronización en Tiempo Real: PAUSADA'}
                </strong>
                <span className="text-[10px] font-mono text-emerald-300 bg-emerald-950 border border-emerald-700/50 px-2 py-0.2 rounded">
                  {engineStats.realtimeThroughputTps || 12.5} tx/seg
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Ingesta continua e instantánea de transferencias SPEI, SWIFT y redes cripto (BTC/ETH/SOL/TRX). Cada evento computa su Score (0-1000) en microsegundos.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-end lg:self-auto shrink-0">
            {/* Speed selector */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-[11px]">
              <span className="text-slate-400 px-1.5">Frecuencia:</span>
              <button
                type="button"
                onClick={() => onSetStreamingSpeed && onSetStreamingSpeed(2000)}
                className={`px-2 py-0.5 rounded cursor-pointer ${
                  (engineStats.streamingSpeedMs || 1800) >= 1500 
                    ? 'bg-slate-800 text-white font-semibold' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                1x
              </button>
              <button
                type="button"
                onClick={() => onSetStreamingSpeed && onSetStreamingSpeed(800)}
                className={`px-2 py-0.5 rounded cursor-pointer ${
                  engineStats.streamingSpeedMs === 800 
                    ? 'bg-cyan-950 text-cyan-300 font-semibold border border-cyan-700/50' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                2x
              </button>
              <button
                type="button"
                onClick={() => onSetStreamingSpeed && onSetStreamingSpeed(350)}
                className={`px-2 py-0.5 rounded cursor-pointer ${
                  engineStats.streamingSpeedMs === 350 
                    ? 'bg-amber-950 text-amber-300 font-semibold border border-amber-700/50' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Turbo
              </button>
            </div>

            {/* Toggle Streaming Button */}
            <button
              type="button"
              onClick={onToggleStreaming}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-md ${
                engineStats.isStreamingActive
                  ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
              }`}
            >
              {engineStats.isStreamingActive ? (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  <span>Pausar En Vivo</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Reanudar En Vivo</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Official Tariff Schedule & Fee Revenue Bar (1.8%, 2.5%, 8%, 20%) */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/40 border border-teal-500/30 flex flex-col lg:flex-row lg:items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-teal-950 border border-teal-500/50 text-teal-400 shrink-0">
              <Scale className="w-5 h-5" />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-white font-bold text-xs uppercase tracking-wide">
                  Estructura Arancelaria AMLanfat & Recaudación
                </span>
                <span className="text-[10px] bg-teal-950 text-teal-300 border border-teal-700/50 px-2 py-0.2 rounded-full font-mono">
                  Directo a Bóveda Soberana
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                1.8% Transferencia estándar · 2.5% Riesgo medio/alto · 8.0% Retención preventiva de liquidación · 20.0% Decomisos regulatorios.
              </p>
            </div>
          </div>

          {/* Quick Tariff breakdown badges */}
          <div className="flex flex-wrap items-center gap-2 font-mono text-[11px]">
            <div className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300">
              <span className="text-slate-500 mr-1">1.8% Estándar:</span>
              <strong className="text-white">{count1_8}</strong>
            </div>

            <div className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-yellow-300">
              <span className="text-slate-500 mr-1">2.5% Riesgo:</span>
              <strong className="text-yellow-400">{count2_5}</strong>
            </div>

            <div className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-amber-300">
              <span className="text-slate-500 mr-1">8.0% Retención:</span>
              <strong className="text-amber-400">{count8_0}</strong>
            </div>

            <div className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-rose-300">
              <span className="text-slate-500 mr-1">20.0% Decomiso:</span>
              <strong className="text-rose-400">{count20_0}</strong>
            </div>

            <div className="px-3 py-1 rounded-lg bg-teal-950/80 border border-teal-600/60 text-teal-300">
              <span className="text-slate-400 mr-1">Total Recaudado:</span>
              <strong className="text-emerald-400">${totalFeesCollected.toLocaleString()} MXN</strong>
            </div>
          </div>
        </div>

        {/* Memory buffer & Auto-dispatch banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Buffer memory state with auto-cleaning GC */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex flex-col justify-between gap-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-medium">Búfer de Memoria por Bloques:</span>
              <span className="font-mono text-slate-200">
                {engineStats.bufferMemoryKB} KB / {engineStats.bufferCapacityKB} KB ({bufferPercentage}%)
              </span>
            </div>
            
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-300 ${
                  bufferPercentage > 85 ? 'bg-rose-500' : bufferPercentage > 50 ? 'bg-amber-500' : 'bg-cyan-500'
                }`}
                style={{ width: `${bufferPercentage}%` }}
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-slate-400">
                Purga de bloques: <strong className="font-mono text-slate-300">{engineStats.cleanedBlocksCount}</strong>
              </span>

              <button
                onClick={handleCleanMemory}
                className="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 hover:underline cursor-pointer"
                title="Ejecutar autoservicio de limpieza de memoria para optimizar la velocidad"
              >
                <Trash2 className="w-3 h-3" />
                <span>{cleanFeedback ? '¡Memoria Optimizada!' : 'Autoservicio de Limpieza'}</span>
              </button>
            </div>
          </div>

          {/* Engine Latency & Threads */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex flex-col justify-between">
            <span className="text-slate-400 font-medium">Desempeño & Latencia de Procesamiento:</span>
            <div className="flex items-baseline gap-3 my-1">
              <span className="text-xl font-bold font-mono text-white tabular-nums">
                {engineStats.avgLatencyUs} <span className="text-xs text-slate-400 font-normal">µs / tx</span>
              </span>
              <span className="text-slate-400">·</span>
              <span className="text-xs text-slate-300 font-mono">
                {engineStats.parallelThreads} Hilos Paralelos
              </span>
            </div>
            <span className="text-[11px] text-slate-400">
              Evaluación sincrónica de las 5 matrices sin cuellos de botella.
            </span>
          </div>

          {/* Auto-Dispatch switch */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex flex-col justify-between gap-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-300 font-medium">Despacho Automático SAR a UIF:</span>
              <button
                onClick={onToggleAutoDispatch}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  engineStats.autoDispatchEnabled ? 'bg-rose-600' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    engineStats.autoDispatchEnabled ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              {engineStats.autoDispatchEnabled
                ? 'Activo: Transmite en automático el layout JSON oficial ante cualquier Score >= 800.'
                : 'En pausa: Requiere autorización manual de compliance antes de emitir a UIF.'}
            </p>
          </div>
        </div>

        {/* Generator Actions Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-300 mr-1">Inyectar Transacciones:</span>
            
            <button
              onClick={() => onGenerateBatch('SPEI')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 border border-slate-700 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              <Building2 className="w-3.5 h-3.5 text-sky-400" />
              <span>Lote Bancario (SPEI)</span>
            </button>

            <button
              onClick={() => onGenerateBatch('CRYPTO')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 border border-slate-700 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <span>Lote Criptoactivos (BTC/ETH/TRX/SOL)</span>
            </button>

            <button
              onClick={() => onGenerateBatch(undefined, true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-300 bg-rose-950/60 border border-rose-800/60 hover:bg-rose-900/60 rounded-lg transition-colors cursor-pointer"
            >
              <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
              <span>Simular Caso Crítico (Score Reprobable &gt;= 800)</span>
            </button>
          </div>

          <div className="text-xs text-slate-400 font-mono">
            Total en cola: <strong className="text-white">{transactions.length}</strong>
          </div>
        </div>

        {/* 30-Day Automated Long-Term Storage Background Worker Banner */}
        <div className="p-3.5 rounded-xl bg-slate-950/80 border border-indigo-900/50 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-950 border border-indigo-700/50 text-indigo-400 shrink-0">
              <Archive className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <strong className="text-white font-medium">Background Job: Compresión & Archivo a Long-Term Storage (Cada 30 días)</strong>
                <span className="text-[10px] font-mono text-indigo-300 bg-indigo-900/50 border border-indigo-700/50 px-1.5 py-0.2 rounded">
                  Ciclo en: {engineStats.nextArchiveCycleSeconds}s
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Comprime automáticamente los logs JSON de despachos SAR despachados (&gt;30 días) y los traslada a almacenamiento en frío para mantener el motor activo ágil y libre de sobrecarga.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end md:self-auto shrink-0">
            <div className="text-right text-[11px] font-mono hidden sm:block">
              <span className="text-slate-400 block">En Bóveda Fría: <strong className="text-indigo-300">{engineStats.longTermArchivedCount} logs</strong></span>
              <span className="text-emerald-400 block">RAM Liberada: <strong className="text-emerald-300">{engineStats.totalCompressedSavedKB} KB</strong></span>
            </div>

            <button
              onClick={onTriggerArchiveCycle}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-200 bg-indigo-950 hover:bg-indigo-900 border border-indigo-700/60 rounded-lg shadow-sm transition-colors cursor-pointer whitespace-nowrap"
              title="Avanzar el reloj 30 días y ejecutar inmediatamente el job de archivo y compresión"
            >
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              <span>Avanzar 30 Días / Forzar Archivo</span>
            </button>
          </div>
        </div>
      </div>

      {/* Numerical Metrics Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-xs text-slate-400 block font-medium">Total Evaluadas por Motor</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-white">
              {engineStats.processedCount.toLocaleString()}
            </span>
            <span className="text-xs text-slate-400 font-normal">operaciones</span>
          </div>
          <span className="text-[11px] text-slate-500 font-mono mt-0.5 block">Canales SPEI, SWIFT & Cripto</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-xs text-slate-400 block font-medium">Comisiones Recaudadas</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-teal-400">
              ${totalFeesCollected.toLocaleString()}
            </span>
            <span className="text-xs text-teal-300 font-normal">MXN</span>
          </div>
          <span className="text-[11px] text-teal-400/80 font-mono mt-0.5 block">1.8% / 2.5% / 8% / 20%</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-xs text-slate-400 block font-medium">Alertas Críticas (&gt;= 800)</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-rose-400">
              {engineStats.reprobableCount}
            </span>
            <span className="text-xs text-rose-300 font-normal">reprobables</span>
          </div>
          <span className="text-[11px] text-rose-400/80 font-mono mt-0.5 block">Despacho SAR Obligatorio UIF</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-xs text-slate-400 block font-medium">Retenciones (8%) & Decomisos (20%)</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-amber-400">
              {count8_0 + count20_0}
            </span>
            <span className="text-xs text-amber-300 font-normal">({count8_0} ret / {count20_0} dec)</span>
          </div>
          <span className="text-[11px] text-amber-400/80 font-mono mt-0.5 block">Custodia Forense y Extinción</span>
        </div>
      </div>

      {/* Transaction Feed & Inspector Data Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden space-y-0">
        {/* Table Filters & Search */}
        <div className="p-4 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-900/90">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por ID, RFC, nombre, tracking o banco..."
                className="bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-64 md:w-80"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
              <button
                onClick={() => setFilterType('ALL')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  filterType === 'ALL' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Todas ({transactions.length})
              </button>
              <button
                onClick={() => setFilterType('BANKING')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  filterType === 'BANKING' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Bancarias
              </button>
              <button
                onClick={() => setFilterType('CRYPTO')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  filterType === 'CRYPTO' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Cripto
              </button>
              <button
                onClick={() => setFilterType('REPROBABLE')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  filterType === 'REPROBABLE' ? 'bg-rose-950 text-rose-300 font-semibold' : 'text-rose-400 hover:text-rose-300'
                }`}
              >
                Reprobables ({engineStats.reprobableCount})
              </button>
              <button
                onClick={() => setFilterType('BLACKLIST')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer flex items-center gap-1 ${
                  filterType === 'BLACKLIST' ? 'bg-red-950 text-red-300 font-bold border border-red-700/50' : 'text-red-400 hover:text-red-300'
                }`}
              >
                <span>Listas Negras ({countBlacklist})</span>
              </button>
              <button
                onClick={() => setFilterType('FEE_1_8')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  filterType === 'FEE_1_8' ? 'bg-emerald-950 text-emerald-300 font-semibold' : 'text-emerald-400 hover:text-emerald-300'
                }`}
              >
                1.8% ({count1_8})
              </button>
              <button
                onClick={() => setFilterType('FEE_2_5')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  filterType === 'FEE_2_5' ? 'bg-yellow-950 text-yellow-300 font-semibold' : 'text-yellow-400 hover:text-yellow-300'
                }`}
              >
                2.5% ({count2_5})
              </button>
              <button
                onClick={() => setFilterType('FEE_8')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  filterType === 'FEE_8' ? 'bg-amber-950 text-amber-300 font-semibold' : 'text-amber-400 hover:text-amber-300'
                }`}
              >
                8% Retención ({count8_0})
              </button>
              <button
                onClick={() => setFilterType('FEE_20')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  filterType === 'FEE_20' ? 'bg-rose-950 text-rose-300 font-semibold' : 'text-rose-400 hover:text-rose-300'
                }`}
              >
                20% Decomiso ({count20_0})
              </button>
            </div>
          </div>

          <div className="text-xs text-slate-400 font-mono flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Monitoreando: {filteredTransactions.length} registros</span>
          </div>
        </div>

        {/* Data Grid */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Folio / Fecha</th>
                <th className="py-3 px-4">Canal / Red</th>
                <th className="py-3 px-4">Originador & RFC</th>
                <th className="py-3 px-4">Beneficiario</th>
                <th className="py-3 px-4 text-right">Monto MXN</th>
                <th className="py-3 px-4 text-center">Score (0-1000)</th>
                <th className="py-3 px-4 text-center">Arancel AML</th>
                <th className="py-3 px-4">Estatus SAR / UIF</th>
                <th className="py-3 px-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredTransactions.map((tx) => {
                const isReprobable = tx.riskBreakdown.totalScore >= 800;
                const fee = tx.feeBreakdown || {
                  feePercentage: 1.8,
                  feeCategory: 'STANDARD_PROCESSED' as const,
                  feeCategoryLabel: 'Estándar (1.8%)',
                  feeAmountMXN: Math.round(tx.amountMXN * 0.018),
                  netDisbursedMXN: Math.round(tx.amountMXN * 0.982),
                  isTemporaryHold: false,
                  isSeized: false
                };

                return (
                  <tr 
                    key={tx.id} 
                    className={`hover:bg-slate-800/40 transition-colors ${
                      fee.isSeized ? 'bg-rose-950/25' : fee.isTemporaryHold ? 'bg-amber-950/20' : isReprobable ? 'bg-rose-950/15' : ''
                    }`}
                  >
                    <td className="py-3 px-4">
                      <div className="font-mono font-medium text-slate-200">{tx.id}</div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {new Date(tx.timestamp).toLocaleDateString()} {new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 font-medium text-slate-200">
                        {tx.channel === 'CRYPTO' ? (
                          <Coins className="w-3.5 h-3.5 text-amber-400" />
                        ) : (
                          <Building2 className="w-3.5 h-3.5 text-sky-400" />
                        )}
                        <span>{tx.channel}</span>
                      </div>
                      <span className="text-[11px] text-slate-400 truncate max-w-[140px] block">
                        {tx.cryptoNetwork || tx.bankName || 'Directo'}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-200 truncate max-w-[160px] flex items-center gap-1.5">
                        <span>{tx.originator.name}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono flex flex-wrap items-center gap-1 mt-0.5">
                        <span>{tx.originator.taxId}</span>
                        {tx.originator.isPEP && (
                          <span className="text-[10px] text-amber-400 font-bold bg-amber-950 px-1 rounded">PEP</span>
                        )}
                        {(tx.isBlacklisted || tx.blacklistMatch) && (
                          <span className="text-[9px] text-rose-300 font-bold bg-rose-950 px-1 py-0.2 rounded border border-rose-800">
                            🚨 LISTA NEGRA
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-300 truncate max-w-[150px]">{tx.beneficiary.name}</div>
                      <div className="text-[11px] text-slate-400 truncate max-w-[150px]">{tx.beneficiary.institution}</div>
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-medium text-slate-100 tabular-nums">
                      <div>${tx.amountMXN.toLocaleString()} MXN</div>
                      {tx.currency !== 'MXN' && (
                        <span className="text-[10px] text-slate-500 font-mono block">
                          {tx.amount} {tx.currency}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <RiskScoreDisplay
                        score={tx.riskBreakdown.totalScore}
                        level={tx.riskLevel}
                        showBar={true}
                      />
                    </td>

                    {/* Tariff / Fee Column */}
                    <td className="py-3 px-4 text-center">
                      <div className="space-y-0.5">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold border ${
                          fee.isSeized
                            ? 'bg-rose-950 text-rose-300 border-rose-700 font-bold'
                            : fee.isTemporaryHold
                            ? 'bg-amber-950 text-amber-300 border-amber-700 font-bold'
                            : fee.feePercentage === 2.5
                            ? 'bg-yellow-950 text-yellow-300 border-yellow-700/60'
                            : 'bg-emerald-950 text-emerald-300 border-emerald-700/60'
                        }`}>
                          {fee.isSeized ? <Gavel className="w-3 h-3 text-rose-400" /> : fee.isTemporaryHold ? <Lock className="w-3 h-3 text-amber-400" /> : <Percent className="w-3 h-3 text-teal-400" />}
                          <span>{fee.feePercentage}%</span>
                        </span>
                        <span className="block text-[10px] font-mono text-teal-400">
                          ${fee.feeAmountMXN.toLocaleString()} MXN
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      {tx.sarStatus === 'DISPATCHED_UIF' ? (
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span>DESPACHADO UIF</span>
                          </span>
                          {tx.storageTier === 'LONG_TERM_STORAGE' ? (
                            <span className="block text-[10px] font-mono text-indigo-300">
                              En Bóveda Fría (-88%)
                            </span>
                          ) : (
                            <span className="block text-[10px] font-mono text-slate-400 truncate max-w-[130px]">
                              {tx.sarFolio}
                            </span>
                          )}
                        </div>
                      ) : isReprobable ? (
                        <button
                          onClick={() => onDispatchSar(tx.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-rose-200 bg-rose-950 border border-rose-700/60 hover:bg-rose-900 rounded-lg transition-colors cursor-pointer"
                        >
                          <Send className="w-3 h-3 text-rose-400" />
                          <span>Despachar SAR</span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-500 font-mono">Sin novedad</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onInspectTransaction(tx)}
                        className="px-2.5 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1"
                        title="Ver desglose de ecuación, tarifas y layout JSON oficial"
                      >
                        <Eye className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Inspeccionar</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
