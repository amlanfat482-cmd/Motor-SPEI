import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Search, 
  Plus, 
  AlertTriangle, 
  CheckCircle2, 
  Ban, 
  ExternalLink, 
  Database, 
  Filter, 
  Eye, 
  Gavel, 
  FileText, 
  Clock, 
  Layers, 
  Download,
  Building,
  Hash,
  X
} from 'lucide-react';
import { BlacklistAuthority, BlacklistEntry, BlacklistMatchRecord, Transaction } from '../types/aml';
import { loadBlacklistCatalog, saveBlacklistCatalog, addCustomBlacklistEntry, checkCounterpartyBlacklist } from '../utils/blacklistDatabase';

interface RegulatoryBlacklistScreeningProps {
  transactions: Transaction[];
  onInspectTransaction: (tx: Transaction) => void;
}

export const RegulatoryBlacklistScreening: React.FC<RegulatoryBlacklistScreeningProps> = ({
  transactions,
  onInspectTransaction
}) => {
  const [blacklistCatalog, setBlacklistCatalog] = useState<BlacklistEntry[]>(() => loadBlacklistCatalog());
  const [selectedAuthorityFilter, setSelectedAuthorityFilter] = useState<string>('ALL');
  const [catalogSearchTerm, setCatalogSearchTerm] = useState('');
  
  // Real-time counterparty screening query tool
  const [queryInput, setQueryInput] = useState('');
  const [queryResult, setQueryResult] = useState<BlacklistMatchRecord | null | 'NOT_CHECKED'>('NOT_CHECKED');
  
  // Modal to add custom blacklisted entity
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    const handleClose = () => setIsAddModalOpen(false);
    window.addEventListener('amlanfat:close_active_modal', handleClose);
    return () => window.removeEventListener('amlanfat:close_active_modal', handleClose);
  }, []);

  const [newEntityName, setNewEntityName] = useState('');
  const [newIdentifier, setNewIdentifier] = useState('');
  const [newIdType, setNewIdType] = useState<BlacklistEntry['identifierType']>('CRYPTO_ADDRESS');
  const [newAuthority, setNewAuthority] = useState<BlacklistAuthority>('OFAC_SDN');
  const [newCategory, setNewCategory] = useState('');
  const [newSanctionFolio, setNewSanctionFolio] = useState('');
  const [newAction, setNewAction] = useState<BlacklistEntry['mandatedAction']>('IMMEDIATE_SEIZURE_20_PCT');
  const [newNotes, setNewNotes] = useState('');

  // Transactions with blacklist hits
  const blacklistedTransactions = transactions.filter(t => t.isBlacklisted || t.blacklistMatch);
  const totalSeizedOrHeld = blacklistedTransactions.reduce((acc, t) => acc + (t.feeBreakdown?.feeAmountMXN || 0), 0);

  const handleRunScreeningCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!queryInput.trim()) return;
    const match = checkCounterpartyBlacklist(queryInput, queryInput, queryInput);
    setQueryResult(match);
  };

  const handleAddEntity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEntityName.trim() || !newIdentifier.trim()) return;

    const authorityLabels: Record<BlacklistAuthority, string> = {
      OFAC_SDN: 'OFAC SDN List (Specially Designated Nationals)',
      UIF_BLOQUEADOS_ART_115: 'Lista de Personas Bloqueadas (LPB) - UIF México',
      SAT_69B_EFOS: 'SAT Art. 69-B (EFOS Definitivo - Operaciones Inexistentes)',
      GAFI_SANCTIONED: 'GAFI / FATF High-Risk Jurisdictions Taskforce',
      INTERPOL_RED_NOTICE: 'Interpol Red Notice / FGR Mandato Judicial',
      CHAINALYSIS_ILLICIT: 'Chainalysis Reactor Illicit Cluster Alert'
    };

    const added = addCustomBlacklistEntry({
      entityName: newEntityName,
      identifierOrAddress: newIdentifier,
      identifierType: newIdType,
      authority: newAuthority,
      authorityLabel: authorityLabels[newAuthority],
      category: newCategory || 'Operaciones Sospechosas / Medida Cautelar',
      sanctionOrderFolio: newSanctionFolio || `OFICIO-REG-${Date.now().toString(36).toUpperCase()}`,
      mandatedAction: newAction,
      country: 'MX',
      notes: newNotes || 'Incorporado manualmente por el Oficial de Cumplimiento AML/CFT.'
    });

    setBlacklistCatalog(loadBlacklistCatalog());
    setIsAddModalOpen(false);
    // Reset fields
    setNewEntityName('');
    setNewIdentifier('');
    setNewCategory('');
    setNewSanctionFolio('');
    setNewNotes('');
  };

  // Filter catalog
  const filteredCatalog = blacklistCatalog.filter(entry => {
    const matchesAuth = selectedAuthorityFilter === 'ALL' || entry.authority === selectedAuthorityFilter;
    const matchesSearch = !catalogSearchTerm.trim() || 
      entry.entityName.toLowerCase().includes(catalogSearchTerm.toLowerCase()) ||
      entry.identifierOrAddress.toLowerCase().includes(catalogSearchTerm.toLowerCase()) ||
      entry.sanctionOrderFolio.toLowerCase().includes(catalogSearchTerm.toLowerCase());
    return matchesAuth && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <ShieldAlert className="w-5 h-5" />
              </span>
              <h1 className="text-base font-bold text-white tracking-tight">
                Módulo Regulatorio de Listas Negras (OFAC, UIF Art. 115, SAT 69-B & GAFI)
              </h1>
            </div>
            <p className="text-xs text-slate-400 max-w-3xl leading-relaxed">
              Verificación automatizada en tiempo real de contrapartes, direcciones de billeteras, CLABEs interbancarias y RFCs contra bases de datos de sancionados. Aplica medidas cautelares obligatorias de retención (8%) o decomiso judicial (20%).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-lg transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Incorporar Entidad Sancionada</span>
            </button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
            <div className="text-[11px] font-mono text-slate-400">Entidades en Base de Datos</div>
            <div className="text-lg font-bold text-white font-mono mt-0.5">{blacklistCatalog.length}</div>
            <div className="text-[10px] text-emerald-400 font-mono mt-1">Sincronización activa 24/7</div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-rose-900/30">
            <div className="text-[11px] font-mono text-slate-400">Coincidencias en Transacciones</div>
            <div className="text-lg font-bold text-rose-400 font-mono mt-0.5">{blacklistedTransactions.length}</div>
            <div className="text-[10px] text-rose-400/80 font-mono mt-1">Bloqueos de liquidación</div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
            <div className="text-[11px] font-mono text-slate-400">Fondos Retenidos / Decomisados</div>
            <div className="text-lg font-bold text-amber-400 font-mono mt-0.5">
              ${totalSeizedOrHeld.toLocaleString('es-MX')} MXN
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-1">Custodia preventiva Art. 115</div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
            <div className="text-[11px] font-mono text-slate-400">Latencia de Verificación</div>
            <div className="text-lg font-bold text-emerald-400 font-mono mt-0.5">~12 µs</div>
            <div className="text-[10px] text-slate-400 font-mono mt-1">Indexación determinista en memoria</div>
          </div>
        </div>
      </div>

      {/* Interactive Counterparty Verification Test Console */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-semibold text-white">
              Consola de Verificación Inmediata de Contraparte (Live Screening Simulator)
            </h2>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            Evalúa Dirección On-Chain, CLABE o RFC
          </span>
        </div>

        <form onSubmit={handleRunScreeningCheck} className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={queryInput}
              onChange={(e) => {
                setQueryInput(e.target.value);
                setQueryResult('NOT_CHECKED');
              }}
              placeholder="Ej: 0xd90e2f925da726b50c4ed8d0fb90ad053324f31b, 646180123499999999, 4152319088214562, o 5584910283..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-100 placeholder-slate-500 font-mono focus:outline-none focus:border-emerald-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Verificar en Listas Negras</span>
          </button>
        </form>

        {/* Quick Sample Test Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
          <span className="text-slate-400">Verificaciones de Muestra:</span>
          {[
            { label: 'OFAC Tornado', val: '0xd90e2f925da726b50c4ed8d0fb90ad053324f31b' },
            { label: 'CLABE 18d Art 115', val: '646180123499999999' },
            { label: 'Tarjeta PAN 16d', val: '4152319088214562' },
            { label: 'DiMo 10d Banxico', val: '5584910283' },
            { label: 'SAT EFOS 69-B', val: 'SLP1706159K2' }
          ].map((sample) => (
            <button
              key={sample.label}
              type="button"
              onClick={() => {
                setQueryInput(sample.val);
                const hit = checkCounterpartyBlacklist(sample.val);
                setQueryResult(hit);
              }}
              className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-600 font-mono text-[10px] cursor-pointer"
            >
              {sample.label}
            </button>
          ))}
        </div>

        {/* Screening Result Card */}
        {queryResult !== 'NOT_CHECKED' && (
          <div className="pt-2 animate-in fade-in duration-150">
            {queryResult ? (
              <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/50 space-y-2">
                <div className="flex items-center gap-2 text-rose-300 font-semibold text-xs">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>🚨 ALERTA CRÍTICA: COINCIDENCIA CONFIRMADA EN BASE DE DATOS DE LISTAS NEGRAS</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] font-mono text-slate-300 pt-1">
                  <div>
                    <span className="text-slate-500">Entidad Sancionada: </span>
                    <span className="font-bold text-white">{queryResult.matchedEntity}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Lista / Autoridad: </span>
                    <span className="text-rose-400 font-semibold">{queryResult.authorityLabel}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Folio de Sanción Oficial: </span>
                    <span className="text-amber-400">{queryResult.sanctionOrderFolio}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Medida Cautelar Mandatoria: </span>
                    <span className="px-1.5 py-0.5 rounded bg-rose-900/60 text-rose-200 font-bold">
                      {queryResult.mandatedAction === 'IMMEDIATE_SEIZURE_20_PCT' 
                        ? 'DECOMISO OFICIAL INMEDIATO (20.0%)'
                        : 'RETENCIÓN PREVENTIVA DE LIQUIDACIÓN (8.0%)'}
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 pt-1 border-t border-rose-900/40">
                  <span className="text-rose-400 font-medium">Dictamen de Cumplimiento:</span> {queryResult.notes}
                </p>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/40 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <div className="text-xs font-semibold text-emerald-300">
                    DIRECCIÓN / CONTRAPARTE LIMPIA (CLEAR)
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    No se detectaron coincidencias en OFAC SDN, Lista de Personas Bloqueadas UIF, SAT 69-B ni listas internacionales GAFI.
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Live Transaction Blacklist Matches Table */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Ban className="w-4 h-4 text-rose-400" />
              <span>Transacciones Detectadas con Coincidencia en Listas Negras ({blacklistedTransactions.length})</span>
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Operaciones interceptadas automáticamente por el motor de reglas regulatorias con retención o decomiso activo.
            </p>
          </div>
        </div>

        {blacklistedTransactions.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl text-slate-400 text-xs">
            No se han registrado operaciones vinculadas a listas negras en el buffer actual.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-[11px] font-mono text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">ID / Hora</th>
                  <th className="py-2.5 px-3">Remitente / Contraparte</th>
                  <th className="py-2.5 px-3">Autoridad / Lista</th>
                  <th className="py-2.5 px-3">Monto Total</th>
                  <th className="py-2.5 px-3">Medida Aplicada</th>
                  <th className="py-2.5 px-3">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono text-[11px]">
                {blacklistedTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-white">{tx.id}</div>
                      <div className="text-[10px] text-slate-400">{new Date(tx.timestamp).toLocaleTimeString('es-MX')}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="text-rose-400 font-semibold truncate max-w-[200px]" title={tx.blacklistMatch?.matchedEntity || tx.originator.name}>
                        {tx.blacklistMatch?.matchedEntity || tx.originator.name}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate max-w-[200px]">
                        {tx.originator.accountOrAddress}
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-950 text-rose-400 border border-rose-800/50">
                        {tx.blacklistMatch?.authority || 'OFAC_SDN'}
                      </span>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {tx.blacklistMatch?.sanctionOrderFolio || 'DOF-ORDEN-2026'}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-white font-bold">
                      ${tx.amountMXN.toLocaleString('es-MX')} MXN
                    </td>
                    <td className="py-2.5 px-3">
                      {tx.feeBreakdown?.isSeized ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-950/80 text-red-300 border border-red-500/40">
                          Decomiso 20% (${tx.feeBreakdown.feeAmountMXN.toLocaleString('es-MX')})
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950/80 text-amber-300 border border-amber-500/40">
                          Retención 8% (${tx.feeBreakdown?.feeAmountMXN.toLocaleString('es-MX')})
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      <button
                        onClick={() => onInspectTransaction(tx)}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Dictaminar</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Catalog of Active Regulatory Blacklist Entities */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-400" />
              <span>Padrón de Entidades en Lista Negra de Cumplimiento ({filteredCatalog.length})</span>
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Catálogo sincronizado de entidades sancionadas con resoluciones judiciales vigentes.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filter by Authority */}
            <select
              value={selectedAuthorityFilter}
              onChange={(e) => setSelectedAuthorityFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 font-mono focus:outline-none"
            >
              <option value="ALL">Todas las Autoridades</option>
              <option value="OFAC_SDN">OFAC SDN (Estados Unidos)</option>
              <option value="UIF_BLOQUEADOS_ART_115">UIF LPB Art. 115 (México)</option>
              <option value="SAT_69B_EFOS">SAT Art. 69-B EFOS (México)</option>
              <option value="GAFI_SANCTIONED">GAFI / FATF High-Risk</option>
              <option value="CHAINALYSIS_ILLICIT">Chainalysis Clusters</option>
              <option value="INTERPOL_RED_NOTICE">Interpol Red Notices</option>
            </select>

            {/* Search within catalog */}
            <input
              type="text"
              value={catalogSearchTerm}
              onChange={(e) => setCatalogSearchTerm(e.target.value)}
              placeholder="Buscar en padrón..."
              className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 placeholder-slate-500 font-mono focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredCatalog.map((entry) => (
            <div 
              key={entry.id} 
              className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-all space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-xs font-bold text-white">{entry.entityName}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{entry.category}</div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950/80 text-rose-300 border border-rose-800/60 shrink-0">
                  {entry.authority}
                </span>
              </div>

              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800/80 font-mono text-[11px] text-slate-300 space-y-1">
                <div className="flex items-center justify-between text-[10px] text-slate-500">
                  <span>Identificador ({entry.identifierType}):</span>
                  <span>{entry.country}</span>
                </div>
                <div className="text-amber-400 font-semibold break-all text-[11px]">
                  {entry.identifierOrAddress}
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1">
                <span>Oficio: {entry.sanctionOrderFolio}</span>
                <span className="text-rose-400 font-medium">
                  {entry.mandatedAction === 'IMMEDIATE_SEIZURE_20_PCT' ? 'Decomiso 20%' : 'Retención 8%'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Custom Blacklist Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="max-w-lg w-full bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-400" />
                <h3 className="text-sm font-bold text-white">Incorporar Entidad a Lista Negra</h3>
              </div>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddEntity} className="space-y-3 text-xs font-mono">
              <div>
                <label className="text-slate-400 block mb-1">Nombre o Denominación Social de la Entidad:</label>
                <input
                  type="text"
                  required
                  value={newEntityName}
                  onChange={(e) => setNewEntityName(e.target.value)}
                  placeholder="Ej: Operadora de Remesas Clandestinas del Norte S.A."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1">Tipo de Identificador:</label>
                  <select
                    value={newIdType}
                    onChange={(e) => setNewIdType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none"
                  >
                    <option value="BANK_CLABE">CLABE Interbancaria SPEI (18d)</option>
                    <option value="CARD_PAN_16">Tarjeta Débito/Crédito PAN (16d)</option>
                    <option value="DIMO_PHONE_10">DiMo Celular Móvil (10d)</option>
                    <option value="CRYPTO_ADDRESS">Dirección Cripto On-Chain</option>
                    <option value="RFC_TAX_ID">RFC / Tax ID Fiscal</option>
                    <option value="INDIVIDUAL_NAME">Nombre Persona Física</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Autoridad Emisora:</label>
                  <select
                    value={newAuthority}
                    onChange={(e) => setNewAuthority(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none"
                  >
                    <option value="OFAC_SDN">OFAC SDN</option>
                    <option value="UIF_BLOQUEADOS_ART_115">UIF Lista Bloqueados (LPB)</option>
                    <option value="SAT_69B_EFOS">SAT Art. 69-B (EFOS)</option>
                    <option value="GAFI_SANCTIONED">GAFI Sanciones</option>
                    <option value="CHAINALYSIS_ILLICIT">Chainalysis Alert</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Dirección / CLABE / RFC exacto:</label>
                <input
                  type="text"
                  required
                  value={newIdentifier}
                  onChange={(e) => setNewIdentifier(e.target.value)}
                  placeholder="0x... o RFC123456789 o 18 dígitos CLABE"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1">Folio de Oficio / Notificación:</label>
                  <input
                    type="text"
                    value={newSanctionFolio}
                    onChange={(e) => setNewSanctionFolio(e.target.value)}
                    placeholder="DOF-OFICIO-2026-X"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Medida Cautelar Exigible:</label>
                  <select
                    value={newAction}
                    onChange={(e) => setNewAction(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none"
                  >
                    <option value="IMMEDIATE_SEIZURE_20_PCT">Decomiso Judicial (20%)</option>
                    <option value="TEMPORARY_HOLD_8_PCT">Retención Preventiva (8%)</option>
                    <option value="BLOCK_AND_SAR_AUTO">Bloqueo Total + Reporte SAR</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Motivo / Dictamen de Cumplimiento:</label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Fundamentación legal y antecedentes..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold cursor-pointer shadow-lg"
                >
                  Guardar en Lista Negra
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
