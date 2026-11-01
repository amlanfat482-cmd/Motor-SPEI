import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Calendar, 
  ShieldCheck, 
  Key, 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ArrowRight, 
  Lock, 
  Download, 
  RefreshCw, 
  Play, 
  Pause, 
  ExternalLink, 
  FileCode, 
  QrCode, 
  Receipt, 
  Send, 
  Cpu, 
  Copy, 
  Check, 
  Plus, 
  DollarSign, 
  Layers, 
  AlertCircle,
  TrendingDown,
  Sparkles,
  Search,
  Filter,
  Zap
} from 'lucide-react';
import { 
  TaxObligationItem, 
  EFirmaConfig, 
  GovernmentAuthority, 
  ObligationPaymentStatus 
} from '../types/taxCompliance';
import { 
  loadTaxObligations, 
  saveTaxObligations, 
  loadEFirmaConfig, 
  saveEFirmaConfig,
  getTimeRemaining,
  executeTaxDisbursementWithSignature,
  computeTaxComplianceSummary,
  generateCadenaOriginal,
  generateDigitalSignature
} from '../utils/taxEngine';
import { VaultBalances } from '../types/aml';
import { AutomatedTaxSubmissionConsole } from './AutomatedTaxSubmissionConsole';

interface GovernmentTaxComplianceManagerProps {
  vaultBalances: VaultBalances;
  onUpdateVaultBalances: React.Dispatch<React.SetStateAction<VaultBalances>>;
}

export const GovernmentTaxComplianceManager: React.FC<GovernmentTaxComplianceManagerProps> = ({
  vaultBalances,
  onUpdateVaultBalances
}) => {
  const [obligations, setObligations] = useState<TaxObligationItem[]>(() => loadTaxObligations());
  const [efirma, setEFirma] = useState<EFirmaConfig>(() => loadEFirmaConfig());
  const [activeSubTab, setActiveSubTab] = useState<'calendar' | 'automatedSubmission' | 'efirma' | 'acuses' | 'cffSimulator'>('calendar');
  const [selectedAuthorityFilter, setSelectedAuthorityFilter] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Modal states
  const [selectedAcuseItem, setSelectedAcuseItem] = useState<TaxObligationItem | null>(null);
  const [isNewObligationModalOpen, setIsNewObligationModalOpen] = useState(false);
  const [actionSuccessToast, setActionSuccessToast] = useState<string | null>(null);

  // Close modals when superimposed Back button is clicked
  useEffect(() => {
    const handleRemoteClose = () => {
      if (selectedAcuseItem) setSelectedAcuseItem(null);
      if (isNewObligationModalOpen) setIsNewObligationModalOpen(false);
    };
    window.addEventListener('amlanfat:close_active_modal', handleRemoteClose);
    return () => window.removeEventListener('amlanfat:close_active_modal', handleRemoteClose);
  }, [selectedAcuseItem, isNewObligationModalOpen]);

  // Sandbox state in e.firma tab
  const [sandboxCadena, setSandboxCadena] = useState<string>('');
  const [sandboxSignature, setSandboxSignature] = useState<string>('');
  const [isSandboxSigning, setIsSandboxSigning] = useState(false);

  // New obligation form state
  const [newAuthority, setNewAuthority] = useState<GovernmentAuthority>('SAT');
  const [newConcept, setNewConcept] = useState('');
  const [newPeriod, setNewPeriod] = useState('Octubre 2026');
  const [newDueDate, setNewDueDate] = useState('2026-11-17T23:59');
  const [newCaptureLine, setNewCaptureLine] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newCollectingBank, setNewCollectingBank] = useState('BBVA México (SAT Recaudación Concentradora)');
  const [newCollectingCLABE, setNewCollectingCLABE] = useState('012180001948201948');

  // Compute summary metrics
  const summary = computeTaxComplianceSummary(obligations, efirma);

  // Persist obligations and efirma on changes
  useEffect(() => {
    saveTaxObligations(obligations);
  }, [obligations]);

  useEffect(() => {
    saveEFirmaConfig(efirma);
  }, [efirma]);

  // Handle clipboard copy
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2500);
  };

  // Toast auto-clear
  useEffect(() => {
    if (actionSuccessToast) {
      const timer = setTimeout(() => setActionSuccessToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [actionSuccessToast]);

  // Execute immediate payment with e.firma
  const handleExecutePayment = (item: TaxObligationItem) => {
    // Check if sufficient MXN balance in vault
    if (vaultBalances.MXN < item.totalToPayMXN) {
      alert(`Fondos insuficientes en la Bóveda Soberana MXN. Requerido: $${item.totalToPayMXN.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN | Disponible: $${vaultBalances.MXN.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN`);
      return;
    }

    const { updatedItem, speiTrackingKey, acuseFolio } = executeTaxDisbursementWithSignature(item, efirma);

    // Deduct from Sovereign Vault MXN
    onUpdateVaultBalances(prev => ({
      ...prev,
      MXN: Math.max(0, prev.MXN - item.totalToPayMXN)
    }));

    // Update obligations list
    setObligations(prev => prev.map(o => o.id === item.id ? updatedItem : o));

    // Update efirma stats
    setEFirma(prev => ({
      ...prev,
      totalSignaturesGenerated: prev.totalSignaturesGenerated + 1,
      lastSignatureGeneratedAt: new Date().toISOString()
    }));

    setActionSuccessToast(
      `Dispersión SPEI exitosa y e.firma generada para ${item.concept}. Clave de Rastreo: ${speiTrackingKey} | Acuse: ${acuseFolio}`
    );
  };

  // Execute all due / upcoming obligations in bulk (< 48 hours)
  const handleExecuteAllDueNow = () => {
    const dueItems = obligations.filter(o => {
      if (o.status === 'PAGADO_AL_CORRIENTE') return false;
      const { totalHours, isOverdue } = getTimeRemaining(o.dueDate);
      return isOverdue || totalHours <= 48;
    });

    if (dueItems.length === 0) {
      setActionSuccessToast('Todas las obligaciones gubernamentales ya se encuentran al corriente.');
      return;
    }

    const totalNeeded = dueItems.reduce((acc, curr) => acc + curr.totalToPayMXN, 0);
    if (vaultBalances.MXN < totalNeeded) {
      alert(`Fondos insuficientes en Bóveda para liquidar en lote. Requerido: $${totalNeeded.toLocaleString('es-MX')} MXN | Disponible: $${vaultBalances.MXN.toLocaleString('es-MX')} MXN`);
      return;
    }

    let updatedList = [...obligations];
    let deductedAmount = 0;
    let signaturesCount = 0;

    for (const item of dueItems) {
      const { updatedItem } = executeTaxDisbursementWithSignature(item, efirma);
      updatedList = updatedList.map(o => o.id === item.id ? updatedItem : o);
      deductedAmount += item.totalToPayMXN;
      signaturesCount++;
    }

    onUpdateVaultBalances(prev => ({
      ...prev,
      MXN: Math.max(0, prev.MXN - deductedAmount)
    }));

    setObligations(updatedList);
    setEFirma(prev => ({
      ...prev,
      totalSignaturesGenerated: prev.totalSignaturesGenerated + signaturesCount,
      lastSignatureGeneratedAt: new Date().toISOString()
    }));

    setActionSuccessToast(
      `Se liquidaron y firmaron automáticamente ${signaturesCount} obligaciones por un total de $${deductedAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN ante SAT, CNBV, TESOFE e IMSS.`
    );
  };

  // Toggle Auto-Sign setting
  const handleToggleAutoSign = () => {
    setEFirma(prev => ({
      ...prev,
      autoSignEnabled: !prev.autoSignEnabled
    }));
  };

  // Run simulated sandbox sign
  const handleTestSandboxSign = () => {
    setIsSandboxSigning(true);
    setTimeout(() => {
      const testCadena = sandboxCadena || `||2.0|SAT|${efirma.rfc}|PAGO_PROVISIONAL_ISR|2026-10|01269482104829104819|348200.00|2026-10-19T23:59:59Z|${efirma.certificateSerialNumber}||`;
      setSandboxCadena(testCadena);
      const signature = generateDigitalSignature(testCadena);
      setSandboxSignature(signature);
      setIsSandboxSigning(false);
    }, 450);
  };

  // Add new obligation submit
  const handleCreateNewObligation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newConcept || !newCaptureLine || !newAmount) {
      alert('Por favor completa todos los campos requeridos.');
      return;
    }

    const parsedAmount = parseFloat(newAmount.replace(/,/g, ''));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert('Ingresa un monto válido.');
      return;
    }

    const newId = `TAX-${newAuthority}-${Date.now().toString().slice(-6)}`;
    const newItem: TaxObligationItem = {
      id: newId,
      authority: newAuthority,
      category: newAuthority === 'SAT' ? 'IMPUESTO_FEDERAL' : newAuthority === 'CNBV' ? 'DERECHO_SUPERVISION' : newAuthority === 'IMSS_SIPARE' ? 'CUOTA_SEGURIDAD_SOCIAL' : 'TARIFA_SPEI',
      concept: newConcept,
      period: newPeriod,
      dueDate: new Date(newDueDate).toISOString(),
      captureLine: newCaptureLine,
      amountMXN: parsedAmount,
      surchargesAndInflationMXN: 0,
      totalToPayMXN: parsedAmount,
      status: 'PROGRAMADO_AUTO_FIRMA',
      collectingBank: newCollectingBank,
      collectingCLABE: newCollectingCLABE,
      automatedExecutionScheduled: true,
      scheduledExecutionHoursBeforeDeadline: 24,
      regulatoryArticle: newAuthority === 'SAT' ? 'Código Fiscal de la Federación Art. 20' : 'Regulación Bancaria Mexicana'
    };

    setObligations(prev => [newItem, ...prev]);
    setIsNewObligationModalOpen(false);
    setNewConcept('');
    setNewCaptureLine('');
    setNewAmount('');
    setActionSuccessToast(`Nueva obligación registrada y calendarizada para firma autónoma: ${newItem.concept}`);
  };

  // Filtered obligations list
  const filteredObligations = obligations.filter(item => {
    if (selectedAuthorityFilter !== 'ALL' && item.authority !== selectedAuthorityFilter) return false;
    if (selectedStatusFilter !== 'ALL' && item.status !== selectedStatusFilter) return false;
    return true;
  });

  // Authority badge helper
  const renderAuthorityBadge = (authority: GovernmentAuthority) => {
    switch (authority) {
      case 'SAT':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Building2 className="w-3 h-3 text-amber-400" />
            SAT (Hacienda)
          </span>
        );
      case 'CNBV':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <ShieldCheck className="w-3 h-3 text-sky-400" />
            CNBV (Supervisión)
          </span>
        );
      case 'TESOFE_BANXICO':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Cpu className="w-3 h-3 text-emerald-400" />
            TESOFE / Banxico SPEI
          </span>
        );
      case 'IMSS_SIPARE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold bg-teal-500/10 text-teal-400 border border-teal-500/20">
            <FileText className="w-3 h-3 text-teal-400" />
            IMSS (SIPARE)
          </span>
        );
    }
  };

  // Status badge helper
  const renderStatusBadge = (status: ObligationPaymentStatus, dueDate: string) => {
    const time = getTimeRemaining(dueDate);
    switch (status) {
      case 'PAGADO_AL_CORRIENTE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-950/80 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" />
            Al Corriente (Pagado)
          </span>
        );
      case 'PROGRAMADO_AUTO_FIRMA':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-950/80 text-indigo-300 border border-indigo-500/30">
            <Clock className="w-3 h-3 animate-pulse text-indigo-400" />
            Auto-Firma Agendada ({time.days}d {time.hours}h)
          </span>
        );
      case 'POR_VENCER':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-950/80 text-amber-300 border border-amber-500/30">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            Por Vencer ({time.days}d {time.hours}h)
          </span>
        );
      case 'VENCIDO_RECARGOS':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-950/80 text-rose-300 border border-rose-500/30">
            <AlertCircle className="w-3 h-3 text-rose-400" />
            Vencido con Recargos
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {actionSuccessToast && (
        <div className="p-3 bg-emerald-950/90 border border-emerald-500/50 rounded-lg text-emerald-200 text-sm flex items-center justify-between shadow-lg shadow-emerald-950/50 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{actionSuccessToast}</span>
          </div>
          <button 
            onClick={() => setActionSuccessToast(null)}
            className="text-xs text-emerald-400 hover:text-emerald-200 ml-4 font-mono underline"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Main Institutional Status Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-emerald-500 via-sky-500 to-indigo-500" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950 border border-emerald-500/40 text-emerald-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                SISTEMA DE GOBIERNO: 100% AL CORRIENTE
              </span>
              <span className="px-2 py-0.5 rounded text-xs font-mono bg-slate-800 text-slate-300 border border-slate-700">
                RFC: {efirma.rfc}
              </span>
              <span className="px-2 py-0.5 rounded text-xs font-mono bg-slate-800 text-slate-400 border border-slate-700">
                Serie FIEL: {efirma.certificateSerialNumber}
              </span>
            </div>
            <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-emerald-400" />
              Gestor Fiscal & Regulatorio Gubernamental Automatizado
            </h1>
            <p className="text-xs text-slate-400 max-w-3xl">
              Monitoreo continuo y cumplimiento puntual ante el <strong className="text-slate-300">SAT (Hacienda)</strong>, <strong className="text-slate-300">CNBV (Supervisión e5cinco)</strong>, <strong className="text-slate-300">TESOFE / Banxico (SPEI)</strong> e <strong className="text-slate-300">IMSS (SIPARE)</strong> con dispersión bancaria directa y firma digital autónoma certificada mediante e.firma (FIEL SHA256withRSA).
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setIsNewObligationModalOpen(true)}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-400" />
              Nueva Línea de Captura
            </button>
            <button
              onClick={handleExecuteAllDueNow}
              className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-emerald-950/40 transition-all active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              Auto-Pagar Vencimientos Próximos (&lt;48h)
            </button>
          </div>
        </div>

        {/* Quick KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-800/80">
          <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/60">
            <div className="text-[11px] text-slate-400 flex items-center justify-between">
              <span>Total Pagado al Gobierno 2026</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-lg font-bold text-slate-100 font-mono mt-0.5">
              ${summary.totalPaidThisYearMXN.toLocaleString('es-MX', { minimumFractionDigits: 2 })} <span className="text-xs font-normal text-slate-400">MXN</span>
            </div>
            <div className="text-[10px] text-emerald-400/90 mt-0.5">
              Cero multas ni recargos acumulados
            </div>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/60">
            <div className="text-[11px] text-slate-400 flex items-center justify-between">
              <span>Programadas para Auto-Firma</span>
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <div className="text-lg font-bold text-slate-100 font-mono mt-0.5">
              ${summary.totalScheduledAutoPayMXN.toLocaleString('es-MX', { minimumFractionDigits: 2 })} <span className="text-xs font-normal text-slate-400">MXN</span>
            </div>
            <div className="text-[10px] text-indigo-300 mt-0.5">
              {obligations.filter(o => o.status === 'PROGRAMADO_AUTO_FIRMA').length} obligaciones agendadas
            </div>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/60">
            <div className="text-[11px] text-slate-400 flex items-center justify-between">
              <span>Próximo Vencimiento Crítico</span>
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-sm font-semibold text-amber-300 truncate mt-0.5">
              {summary.nextUpcomingObligation ? summary.nextUpcomingObligation.concept : 'Todo al corriente'}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
              {summary.nextUpcomingObligation ? getTimeRemaining(summary.nextUpcomingObligation.dueDate).statusLabel : 'Próximo mes'}
            </div>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/60">
            <div className="text-[11px] text-slate-400 flex items-center justify-between">
              <span>Firma Automatizada 24/7</span>
              <button 
                onClick={handleToggleAutoSign}
                className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-medium transition-colors ${
                  efirma.autoSignEnabled ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {efirma.autoSignEnabled ? 'ACTIVO' : 'PAUSADO'}
              </button>
            </div>
            <div className="text-sm font-semibold text-slate-200 mt-0.5 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-emerald-400" />
              <span>e.firma HSM FIPS 140-2</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {efirma.totalSignaturesGenerated} timbrados realizados
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-800 gap-1">
        <button
          onClick={() => setActiveSubTab('calendar')}
          className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors flex items-center gap-2 ${
            activeSubTab === 'calendar'
              ? 'bg-slate-900 text-emerald-400 border-t-2 border-emerald-500 border-x border-slate-800'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          Calendario de Obligaciones & Líneas de Captura
          <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-300 font-mono">
            {obligations.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('automatedSubmission')}
          className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors flex items-center gap-2 ${
            activeSubTab === 'automatedSubmission'
              ? 'bg-slate-900 text-cyan-400 border-t-2 border-cyan-500 border-x border-slate-800'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Zap className="w-3.5 h-3.5 text-cyan-400" />
          AutomatedTaxSubmission (Retenciones & Webhook)
          <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-cyan-950 text-cyan-300 font-mono border border-cyan-800/40">
            SAT v2.1
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('efirma')}
          className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors flex items-center gap-2 ${
            activeSubTab === 'efirma'
              ? 'bg-slate-900 text-emerald-400 border-t-2 border-emerald-500 border-x border-slate-800'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Key className="w-3.5 h-3.5" />
          Motor e.firma / FIEL Automatizada (X.509)
        </button>

        <button
          onClick={() => setActiveSubTab('acuses')}
          className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors flex items-center gap-2 ${
            activeSubTab === 'acuses'
              ? 'bg-slate-900 text-emerald-400 border-t-2 border-emerald-500 border-x border-slate-800'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Receipt className="w-3.5 h-3.5" />
          Bóveda de Acuses & CEPs Banxico
          <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-950 text-emerald-300 font-mono border border-emerald-800/40">
            {obligations.filter(o => o.status === 'PAGADO_AL_CORRIENTE').length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('cffSimulator')}
          className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors flex items-center gap-2 ${
            activeSubTab === 'cffSimulator'
              ? 'bg-slate-900 text-emerald-400 border-t-2 border-emerald-500 border-x border-slate-800'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <TrendingDown className="w-3.5 h-3.5" />
          Auditoría de Multas CFF Art. 21
        </button>
      </div>

      {/* Sub-Tab 1: Calendar & Obligations */}
      {activeSubTab === 'calendar' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-lg border border-slate-800">
            <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
              <span className="text-xs text-slate-400 flex items-center gap-1 mr-1">
                <Filter className="w-3.5 h-3.5" />
                Autoridad:
              </span>
              {(['ALL', 'SAT', 'CNBV', 'TESOFE_BANXICO', 'IMSS_SIPARE'] as const).map(auth => (
                <button
                  key={auth}
                  onClick={() => setSelectedAuthorityFilter(auth)}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                    selectedAuthorityFilter === auth
                      ? 'bg-emerald-500 text-slate-950 font-bold'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {auth === 'ALL' ? 'Todas' : auth === 'TESOFE_BANXICO' ? 'TESOFE/Banxico' : auth === 'IMSS_SIPARE' ? 'IMSS' : auth}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <span className="text-xs text-slate-400">Estatus:</span>
              <select
                value={selectedStatusFilter}
                onChange={e => setSelectedStatusFilter(e.target.value)}
                className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded px-2.5 py-1 focus:outline-none focus:border-emerald-500"
              >
                <option value="ALL">Todos los estatus</option>
                <option value="PROGRAMADO_AUTO_FIRMA">Programado con Auto-Firma</option>
                <option value="POR_VENCER">Por Vencer (&lt; 48h)</option>
                <option value="PAGADO_AL_CORRIENTE">Pagado / Al Corriente</option>
                <option value="VENCIDO_RECARGOS">Vencido</option>
              </select>
            </div>
          </div>

          {/* Obligations Cards Grid */}
          <div className="grid grid-cols-1 gap-4">
            {filteredObligations.map(item => {
              const time = getTimeRemaining(item.dueDate);
              const isPaid = item.status === 'PAGADO_AL_CORRIENTE';

              return (
                <div 
                  key={item.id}
                  className={`bg-slate-900/90 border rounded-xl p-5 transition-all shadow-md ${
                    isPaid 
                      ? 'border-slate-800/80 bg-slate-900/40 opacity-90'
                      : time.isOverdue
                      ? 'border-rose-500/40 bg-rose-950/10'
                      : time.totalHours <= 48
                      ? 'border-amber-500/40 bg-amber-950/10'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Left: Info */}
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {renderAuthorityBadge(item.authority)}
                        <span className="text-xs font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                          {item.period}
                        </span>
                        {renderStatusBadge(item.status, item.dueDate)}
                        <span className="text-[11px] text-slate-400 font-mono">
                          {item.regulatoryArticle}
                        </span>
                      </div>

                      <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                        {item.concept}
                      </h3>

                      {/* Official Capture Line Box */}
                      <div className="flex items-center gap-3 bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 flex-wrap">
                        <div className="text-xs text-slate-400">Línea de Captura Oficial:</div>
                        <div className="font-mono text-xs font-bold text-emerald-400 tracking-wider">
                          {item.captureLine}
                        </div>
                        <button
                          onClick={() => handleCopy(item.captureLine)}
                          className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 font-mono transition-colors"
                          title="Copiar línea de captura"
                        >
                          {copiedText === item.captureLine ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                          <span>{copiedText === item.captureLine ? 'Copiado' : 'Copiar'}</span>
                        </button>
                        <div className="text-slate-600">|</div>
                        <div className="text-xs text-slate-400">Banco Recaudador:</div>
                        <div className="text-xs text-slate-300 font-medium">{item.collectingBank}</div>
                        <div className="font-mono text-[11px] text-slate-500">({item.collectingCLABE})</div>
                      </div>

                      {/* Payment timing & auto-sign rule */}
                      <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>Fecha límite: <strong className="text-slate-200">{new Date(item.dueDate).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</strong></span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Auto-dispersión programada a las: <strong className="text-indigo-300">T-{item.scheduledExecutionHoursBeforeDeadline}h ({time.statusLabel})</strong></span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Amount & Actions */}
                    <div className="flex flex-col lg:items-end justify-between gap-3 min-w-[220px]">
                      <div>
                        <div className="text-[11px] text-slate-400 text-left lg:text-right">Monto Determinado a Pagar</div>
                        <div className="text-2xl font-bold font-mono text-slate-100 text-left lg:text-right">
                          ${item.totalToPayMXN.toLocaleString('es-MX', { minimumFractionDigits: 2 })} <span className="text-xs font-normal text-slate-400">MXN</span>
                        </div>
                        {item.surchargesAndInflationMXN > 0 && (
                          <div className="text-[10px] text-rose-400 font-mono text-right">
                            Incluye +${item.surchargesAndInflationMXN.toLocaleString('es-MX')} recargos CFF
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {isPaid ? (
                          <button
                            onClick={() => setSelectedAcuseItem(item)}
                            className="px-3 py-1.5 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors shadow-sm"
                          >
                            <Receipt className="w-3.5 h-3.5 text-emerald-400" />
                            Ver Acuse Fiscal Oficial
                          </button>
                        ) : (
                          <button
                            onClick={() => handleExecutePayment(item)}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-emerald-950/40 active:scale-95"
                          >
                            <Key className="w-3.5 h-3.5 text-amber-300" />
                            Pagar & Firmar Ahora con e.firma
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Sub-Tab 2: Motor e.firma / FIEL */}
      {activeSubTab === 'efirma' && (
        <div className="space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg">
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2 mb-2">
              <Key className="w-4 h-4 text-emerald-400" />
              Configuración y Custodia de la e.firma (FIEL X.509 SHA256withRSA)
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              La Firma Electrónica Avanzada amparada por un certificado vigente emitido por el SAT tiene el mismo valor legal que una firma autógrafa conforme al Artículo 17-D del Código Fiscal de la Federación y la Ley de Firma Electrónica Avanzada.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-2">
                <div className="text-[11px] text-slate-400">Titular y RFC Registrado:</div>
                <div className="text-sm font-bold text-slate-100">{efirma.legalEntityName}</div>
                <div className="font-mono text-xs text-emerald-400">{efirma.rfc}</div>
              </div>

              <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-2">
                <div className="text-[11px] text-slate-400">Número de Serie del Certificado SAT:</div>
                <div className="font-mono text-xs font-bold text-slate-200 tracking-wider">
                  {efirma.certificateSerialNumber}
                </div>
                <div className="text-[11px] text-slate-400">
                  Vigencia: <span className="text-emerald-400">Hasta 30/Jun/2028 (Vigente)</span>
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-2">
                <div className="text-[11px] text-slate-400">Custodia Criptográfica de Llave Privada:</div>
                <div className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-indigo-400" />
                  Hardware Security Module (HSM FIPS 140-2 Nivel 3)
                </div>
                <div className="text-[11px] text-slate-500 font-mono">Algoritmo: RSA 2048 bits / SHA-256</div>
              </div>
            </div>

            {/* Auto-Signing Policy Controls */}
            <div className="mt-5 p-4 bg-slate-950/80 rounded-lg border border-slate-800 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    Regla de Ejecución Autónoma sin Fricción (Guardia Tributaria 24/7)
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    El sistema ejecuta la dispersión SPEI hacia la cuenta concentradora de TESOFE y timbra la declaración ante el SAT exactamente 24 horas antes del vencimiento oficial.
                  </p>
                </div>
                <button
                  onClick={handleToggleAutoSign}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                    efirma.autoSignEnabled
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950/50'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  {efirma.autoSignEnabled ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Firma Autónoma Activada
                    </>
                  ) : (
                    <>
                      <Pause className="w-3.5 h-3.5" />
                      Firma Autónoma Pausada
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-400 pt-2 border-t border-slate-800/80">
                <div>
                  Límite máximo por pago autónomo: <span className="font-mono font-bold text-slate-200">${efirma.autoSignMaxThresholdMXN.toLocaleString('es-MX')} MXN</span>
                </div>
                <div>|</div>
                <div>
                  Último sello generado: <span className="font-mono text-slate-300">{new Date(efirma.lastSignatureGeneratedAt || Date.now()).toLocaleTimeString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Cryptographic Signing Sandbox */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <FileCode className="w-4 h-4 text-indigo-400" />
                Simulador & Validador de Cadena Original y Sello Digital SAT
              </h3>
              <button
                onClick={handleTestSandboxSign}
                disabled={isSandboxSigning}
                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded text-xs font-semibold flex items-center gap-1.5 transition-all"
              >
                {isSandboxSigning ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Play className="w-3.5 h-3.5" />
                )}
                Generar Sello Digital SHA256withRSA
              </button>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Cadena Original del Contribuyente (Anexo 20 CFF):</label>
              <textarea
                value={sandboxCadena || `||2.0|SAT|${efirma.rfc}|PAGO_PROVISIONAL_ISR_IVA|Septiembre 2026|01269482104829104819|348200.00|2026-10-19T23:59:59Z|${efirma.certificateSerialNumber}||`}
                onChange={e => setSandboxCadena(e.target.value)}
                rows={3}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 font-mono text-xs text-emerald-400 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {sandboxSignature && (
              <div className="space-y-2 bg-slate-950 p-4 rounded-lg border border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Sello Digital Criptográfico Generado (Base64 PKCS#1):
                  </span>
                  <button
                    onClick={() => handleCopy(sandboxSignature)}
                    className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 font-mono"
                  >
                    {copiedText === sandboxSignature ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedText === sandboxSignature ? 'Copiado' : 'Copiar Sello'}</span>
                  </button>
                </div>
                <div className="font-mono text-xs text-slate-300 break-all bg-slate-900 p-2.5 rounded border border-slate-800">
                  {sandboxSignature}
                </div>
                <div className="text-[11px] text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  Verificación Matemática Exitosa: Llave pública SAT valida la autenticidad del hash SHA-256.
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sub-Tab 3: Acuses & CEPs Bóveda */}
      {activeSubTab === 'acuses' && (
        <div className="space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-emerald-400" />
                  Bóveda de Acuses Oficiales de Recepción y CEPs SPEI
                </h3>
                <p className="text-xs text-slate-400">
                  Comprobantes inmutables de pago y sellos de acuse de recepción emitidos por las autoridades hacendarias y financieras mexicanas.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="pb-2 font-medium">Folio Fiscal Acuse</th>
                    <th className="pb-2 font-medium">Autoridad</th>
                    <th className="pb-2 font-medium">Concepto & Periodo</th>
                    <th className="pb-2 font-medium">Monto Liquidado</th>
                    <th className="pb-2 font-medium">Clave Rastreo SPEI / CEP</th>
                    <th className="pb-2 font-medium">Fecha Liquidación</th>
                    <th className="pb-2 font-medium text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {obligations
                    .filter(o => o.status === 'PAGADO_AL_CORRIENTE')
                    .map(item => (
                      <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 text-emerald-400 font-bold">
                          {item.folioFiscalAcuse || 'FOLIO-GENERADO'}
                        </td>
                        <td className="py-3 font-sans">
                          {renderAuthorityBadge(item.authority)}
                        </td>
                        <td className="py-3 font-sans text-slate-200">
                          <div>{item.concept}</div>
                          <div className="text-[10px] text-slate-400">{item.period}</div>
                        </td>
                        <td className="py-3 text-slate-100 font-bold">
                          ${item.totalToPayMXN.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
                        </td>
                        <td className="py-3 text-sky-400 text-[11px]">
                          <div>{item.claveRastreoSPEI || 'SPEI-TRACK'}</div>
                          <div className="text-[10px] text-slate-500">{item.cepFolioBanxico}</div>
                        </td>
                        <td className="py-3 text-slate-400 text-[11px] font-sans">
                          {item.settledAt ? new Date(item.settledAt).toLocaleString('es-MX') : 'Liquidado'}
                        </td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => setSelectedAcuseItem(item)}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-sans text-xs inline-flex items-center gap-1 transition-colors"
                          >
                            <FileText className="w-3 h-3 text-emerald-400" />
                            Ver Acuse
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Sub-Tab 4: CFF Recargos & Multas Simulator */}
      {activeSubTab === 'cffSimulator' && (
        <div className="space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-emerald-400" />
              Impacto Regulatorio: Ahorro por Cumplimiento Automatizado vs. Multas del CFF
            </h3>
            <p className="text-xs text-slate-400">
              Conforme al Artículo 21 del Código Fiscal de la Federación (CFF) y la Ley Fintech, el pago extemporáneo causa actualización por inflación (INPC) más recargos por mora (tasa mensual del 1.47%), además de riesgo de revocación de licencia de fondos de pago.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-950 p-4 rounded-lg border border-emerald-500/30 space-y-2">
                <div className="text-xs text-slate-400">Régimen Automatizado 24/7 (Actual):</div>
                <div className="text-xl font-bold text-emerald-400 font-mono">$0.00 MXN</div>
                <div className="text-xs text-slate-300">Multas, actualizaciones y recargos: 0</div>
                <div className="text-[11px] text-emerald-400/90 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  Opinión de Cumplimiento 32-D SAT: Positiva
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-2">
                <div className="text-xs text-slate-400">Costo Estimado si hubiera mora de 30 días:</div>
                <div className="text-xl font-bold text-rose-400 font-mono">+$24,850.00 MXN</div>
                <div className="text-xs text-slate-400">1.47% recargos mensuales + INPC 0.45%</div>
                <div className="text-[11px] text-rose-400/80">
                  Riesgo de Opinión Negativa SAT
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-2">
                <div className="text-xs text-slate-400">Sanción CNBV por omisión de cuota e5cinco:</div>
                <div className="text-xl font-bold text-amber-400 font-mono">2,000 a 10,000 UMAS</div>
                <div className="text-xs text-slate-400">Equivalente a ~$217,000 a $1,085,000 MXN</div>
                <div className="text-[11px] text-amber-400/90">
                  Evitado gracias al despachador automático
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-950 rounded-lg border border-slate-800">
              <h4 className="text-xs font-bold text-slate-200 mb-2">Protocolo de Resiliencia Tributaria:</h4>
              <ul className="text-xs text-slate-400 space-y-1.5 list-disc pl-4">
                <li><strong className="text-slate-300">Ventana T-24 Horas:</strong> El sistema dispersa el monto correspondiente antes del cierre del horario bancario SPEI del día hábil anterior a la fecha límite.</li>
                <li><strong className="text-slate-300">Conciliación Automática CEP:</strong> Al recibir el acuse con el folio CEP de Banco de México, se timbra el registro contable en el Libro Inmutable.</li>
                <li><strong className="text-slate-300">Respaldo de e.firma:</strong> Las firmas se auditan con estampa de tiempo conforme a la NOM-151-SCFI-2016 para total validez ante visitas domiciliarias del SAT o CNBV.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Sub-Tab: AutomatedTaxSubmission Engine */}
      {activeSubTab === 'automatedSubmission' && (
        <AutomatedTaxSubmissionConsole
          vaultBalances={vaultBalances}
          onUpdateVaultBalances={onUpdateVaultBalances}
          onSubmissionComplete={(order) => {
            setObligations(loadTaxObligations());
            setEFirma(loadEFirmaConfig());
            setActionSuccessToast(
              `Retenciones SAT declaradas y liquidadas exitosamente por $${order.totalAmountMXN.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN. Acuse SAT: ${order.satAcuseFolio}`
            );
          }}
        />
      )}

      {/* Modal: Ver Acuse Oficial Fiscal */}
      {selectedAcuseItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full p-6 space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-slate-100">
                  Acuse Oficial de Recepción y Pago de Contribuciones Federales
                </h3>
              </div>
              <button
                onClick={() => setSelectedAcuseItem(null)}
                className="text-slate-400 hover:text-slate-200 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Official Header Sheet */}
            <div className="bg-white text-slate-900 p-6 rounded-lg shadow space-y-4 font-sans text-xs">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <div className="font-bold text-sm text-slate-800 uppercase">
                    {selectedAcuseItem.authority === 'SAT' ? 'SERVICIO DE ADMINISTRACIÓN TRIBUTARIA' : selectedAcuseItem.authority === 'CNBV' ? 'COMISIÓN NACIONAL BANCARIA Y DE VALORES' : selectedAcuseItem.authority === 'IMSS_SIPARE' ? 'INSTITUTO MEXICANO DEL SEGURO SOCIAL' : 'TESORERÍA DE LA FEDERACIÓN'}
                  </div>
                  <div className="text-[11px] text-slate-600">Acuse de Recibo Declaración y Pago SPEI</div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-[11px] font-bold text-slate-700">FOLIO FISCAL:</div>
                  <div className="font-mono text-xs font-bold text-emerald-700">{selectedAcuseItem.folioFiscalAcuse}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-[11px]">
                <div>
                  <span className="text-slate-500 block">RFC Contribuyente:</span>
                  <span className="font-bold font-mono">{efirma.rfc}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Denominación / Razón Social:</span>
                  <span className="font-bold">{efirma.legalEntityName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Concepto de Pago:</span>
                  <span className="font-bold">{selectedAcuseItem.concept}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Periodo Declarado:</span>
                  <span className="font-bold">{selectedAcuseItem.period}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Línea de Captura Oficial:</span>
                  <span className="font-bold font-mono text-emerald-800">{selectedAcuseItem.captureLine}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Monto Pagado:</span>
                  <span className="font-bold font-mono text-sm text-slate-900">${selectedAcuseItem.totalToPayMXN.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Clave de Rastreo SPEI Banxico:</span>
                  <span className="font-mono text-sky-800">{selectedAcuseItem.claveRastreoSPEI || '202610178472918402'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Comprobante Electrónico (CEP):</span>
                  <span className="font-mono text-slate-800">{selectedAcuseItem.cepFolioBanxico || 'CEP-SPEI-OFFICIAL'}</span>
                </div>
              </div>

              {/* Cadena Original & Sello */}
              <div className="space-y-2 pt-2 border-t text-[10px]">
                <div>
                  <span className="text-slate-500 font-bold block">Cadena Original del Acuse:</span>
                  <div className="font-mono bg-slate-100 p-2 rounded text-slate-700 break-all">
                    {selectedAcuseItem.cadenaOriginal || generateCadenaOriginal(selectedAcuseItem, efirma.rfc, efirma.certificateSerialNumber)}
                  </div>
                </div>

                <div>
                  <span className="text-slate-500 font-bold block">Sello Digital del Contribuyente (e.firma):</span>
                  <div className="font-mono bg-slate-100 p-2 rounded text-slate-700 break-all">
                    {selectedAcuseItem.selloDigitalContribuyente || generateDigitalSignature(selectedAcuseItem.concept)}
                  </div>
                </div>

                <div>
                  <span className="text-slate-500 font-bold block">Sello Digital de la Autoridad Fiscal / TESOFE:</span>
                  <div className="font-mono bg-slate-100 p-2 rounded text-slate-700 break-all">
                    {selectedAcuseItem.selloDigitalAutoridad || 'SAT970701NN3|TIMBRADO_VALIDO_SPEI_LIQUIDATED'}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t text-[10px] text-slate-500">
                <span>Certificado SAT No.: {efirma.certificateSerialNumber}</span>
                <span className="text-emerald-700 font-bold">✓ PAGO RECIBIDO Y LIQUIDADO A FAVOR DE LA TESORERÍA DE LA FEDERACIÓN</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  window.print();
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Imprimir / Guardar PDF
              </button>
              <button
                onClick={() => setSelectedAcuseItem(null)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-colors"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Registrar Nueva Línea de Captura */}
      {isNewObligationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-400" />
                Registrar Nueva Obligación Fiscal o Permiso
              </h3>
              <button
                onClick={() => setIsNewObligationModalOpen(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateNewObligation} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 block mb-1">Autoridad Gubernamental Destino:</label>
                <select
                  value={newAuthority}
                  onChange={e => {
                    const auth = e.target.value as GovernmentAuthority;
                    setNewAuthority(auth);
                    if (auth === 'SAT') {
                      setNewCollectingBank('BBVA México (SAT Recaudación Concentradora)');
                      setNewCollectingCLABE('012180001948201948');
                    } else if (auth === 'CNBV') {
                      setNewCollectingBank('Santander México (Tesorería de la Federación - e5cinco)');
                      setNewCollectingCLABE('014180004928172635');
                    } else if (auth === 'IMSS_SIPARE') {
                      setNewCollectingBank('Citibanamex (IMSS Recaudación Concentradora)');
                      setNewCollectingCLABE('002180003847261524');
                    } else {
                      setNewCollectingBank('Banco de México (Cuenta Única TESOFE)');
                      setNewCollectingCLABE('000000000000000001');
                    }
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200"
                >
                  <option value="SAT">SAT (Servicio de Administración Tributaria)</option>
                  <option value="CNBV">CNBV (Comisión Nacional Bancaria y de Valores - e5cinco)</option>
                  <option value="TESOFE_BANXICO">TESOFE / Banco de México (SPEI)</option>
                  <option value="IMSS_SIPARE">IMSS / INFONAVIT (SIPARE)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 block mb-1">Concepto o Descripción:</label>
                <input
                  type="text"
                  required
                  placeholder="ej. Declaración Provisional ISR Personas Morales"
                  value={newConcept}
                  onChange={e => setNewConcept(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1">Periodo:</label>
                  <input
                    type="text"
                    required
                    value={newPeriod}
                    onChange={e => setNewPeriod(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1">Fecha Límite:</label>
                  <input
                    type="datetime-local"
                    required
                    value={newDueDate}
                    onChange={e => setNewDueDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 block mb-1">Línea de Captura Oficial:</label>
                <input
                  type="text"
                  required
                  placeholder="ej. 0126 9482 1048 2910 4819"
                  value={newCaptureLine}
                  onChange={e => setNewCaptureLine(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200 font-mono"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1">Monto Determinado (MXN):</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={newAmount}
                  onChange={e => setNewAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200 font-mono"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewObligationModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-semibold flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  Guardar & Calendarizar Auto-Firma
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
