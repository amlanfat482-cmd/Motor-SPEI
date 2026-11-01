import React from 'react';
import { 
  ShieldAlert, 
  Send, 
  Wallet, 
  FileSpreadsheet, 
  Scale, 
  Cpu, 
  Download,
  Printer,
  ShieldCheck,
  EyeOff,
  Activity,
  Layers,
  Network,
  Ban,
  Server,
  Building2,
  ArrowLeft,
  X,
  Key
} from 'lucide-react';

export type ActiveTab = 'engine' | 'architecture' | 'whitelist' | 'taxes' | 'blacklist' | 'dispenser' | 'vault' | 'sar' | 'ledger' | 'audit' | 'legal';

interface NavigationProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  reprobableCount: number;
  autoDispatchedCount: number;
  blacklistCount?: number;
  pendingTaxesCount?: number;
  canGoBack?: boolean;
  onBack?: () => void;
  onCloseWindow?: () => void;
  onExportExcel: () => void;
  onPrintAudit: () => void;
  onTriggerAntiSnooping?: () => void;
  onTriggerKeepAlive?: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  setActiveTab,
  reprobableCount,
  autoDispatchedCount,
  blacklistCount = 0,
  pendingTaxesCount = 0,
  canGoBack = false,
  onBack,
  onCloseWindow,
  onExportExcel,
  onPrintAudit,
  onTriggerAntiSnooping,
  onTriggerKeepAlive
}) => {
  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'engine', label: 'Motor AML & Feed', icon: <Cpu className="w-3.5 h-3.5" /> },
    { id: 'whitelist', label: 'Mi Cuenta Final (HSM)', icon: <Key className="w-3.5 h-3.5 text-cyan-400" /> },
    { id: 'architecture', label: 'Auditoría Mainnet SPEI', icon: <Server className="w-3.5 h-3.5" /> },
    { id: 'taxes', label: 'Impuestos & Permisos Gob', icon: <Building2 className="w-3.5 h-3.5" />, badge: pendingTaxesCount },
    { id: 'blacklist', label: 'Listas Negras', icon: <Ban className="w-3.5 h-3.5" />, badge: blacklistCount },
    { id: 'dispenser', label: 'Nodos & Dispensador', icon: <Network className="w-3.5 h-3.5" /> },
    { id: 'vault', label: 'Billetera Soberana', icon: <Wallet className="w-3.5 h-3.5" /> },
    { id: 'sar', label: 'Despacho SAR', icon: <Send className="w-3.5 h-3.5" />, badge: reprobableCount },
    { id: 'ledger', label: 'Libro Inmutable', icon: <Layers className="w-3.5 h-3.5" /> },
    { id: 'audit', label: 'Bóveda Archivos', icon: <FileSpreadsheet className="w-3.5 h-3.5" /> },
    { id: 'legal', label: 'Contratos CNBV', icon: <Scale className="w-3.5 h-3.5" /> },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur border-b border-slate-800 no-print">
      {/* Strict 3-Zone Top Bar Contract */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        {/* Zone 1: Single text element wordmark and Back Button */}
        <div className="flex items-center gap-2.5 shrink-0">
          {onBack && (
            <button
              onClick={onBack}
              disabled={!canGoBack}
              title={canGoBack ? "Volver a la vista anterior (Alt + ←)" : "No hay vista anterior en el historial"}
              className={`p-1.5 rounded-lg border flex items-center gap-1 text-xs transition-colors cursor-pointer ${
                canGoBack
                  ? 'bg-slate-900 border-slate-700 text-slate-200 hover:text-cyan-300 hover:bg-slate-800 shadow-sm'
                  : 'bg-slate-950 border-slate-800/80 text-slate-600 opacity-40 cursor-not-allowed'
              }`}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline font-medium">Atrás</span>
            </button>
          )}

          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-base">
            A
          </div>
          <div>
            <a 
              href="#home" 
              onClick={(e) => { e.preventDefault(); setActiveTab('engine'); }}
              className="text-base font-bold tracking-tight text-white hover:text-emerald-400 transition-colors"
            >
              AMLanfat
            </a>
            <div className="text-[10px] text-slate-400 hidden lg:block leading-tight font-mono">
              CNBV & Ley Fintech Core
            </div>
          </div>
        </div>

        {/* Zone 2: Navigation Links (Scrollable if narrow) */}
        <nav className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800 overflow-x-auto max-w-[55vw] xl:max-w-none">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                  isActive 
                    ? 'bg-slate-800 text-white shadow-sm border border-slate-700/60 font-semibold' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-mono">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Primary Actions & Security Badges */}
        <div className="flex items-center gap-2">
          {/* Anti-Overlay Status Badge */}
          <div 
            className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-300"
            title="Blindaje contra ataques de superposición, tapjacking y clickjacking activo"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-400">Anti-Overlay:</span>
            <span className="text-emerald-400 font-semibold">BLINDADO</span>
          </div>

          {onTriggerAntiSnooping && (
            <button
              onClick={onTriggerAntiSnooping}
              title="Activar pantalla de protección Anti-Snooping contra fisgoneo"
              className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-300 bg-slate-900 border border-slate-700/80 rounded-lg hover:bg-slate-800 hover:text-cyan-300 transition-colors cursor-pointer"
            >
              <EyeOff className="w-3.5 h-3.5 text-cyan-400" />
              <span>Anti-Snooping</span>
            </button>
          )}

          {onTriggerKeepAlive && (
            <button
              onClick={onTriggerKeepAlive}
              title="Abrir pantalla Centinela Keep-Alive de ejecución de fondo"
              className="hidden lg:flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-300 bg-slate-900 border border-slate-700/80 rounded-lg hover:bg-slate-800 hover:text-emerald-300 transition-colors cursor-pointer"
            >
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>Centinela</span>
            </button>
          )}

          <button
            onClick={onExportExcel}
            title="Descargar libro Excel XLSX de auditoría"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-900 border border-slate-700 rounded-lg hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Exportar Excel</span>
          </button>
          
          <button
            onClick={onPrintAudit}
            title="Imprimir o guardar como PDF el acta oficial de fiscalización"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-950 bg-emerald-400 hover:bg-emerald-300 font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-950" />
            <span>Acta PDF</span>
          </button>

          {onCloseWindow && (
            <button
              onClick={onCloseWindow}
              title="Cerrar ventana / Salir de la terminal"
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-rose-300 bg-rose-950/60 hover:bg-rose-600 hover:text-white border border-rose-800/60 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">Cerrar Ventana</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile navigation tab strip */}
      <div className="md:hidden flex overflow-x-auto px-4 py-2 border-t border-slate-800/80 gap-2 bg-slate-900/60">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md whitespace-nowrap cursor-pointer ${
              activeTab === item.id 
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                : 'text-slate-400'
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </header>
  );
};
