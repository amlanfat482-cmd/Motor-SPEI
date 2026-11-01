import React, { useState, useEffect } from 'react';
import { 
  Network, 
  Server, 
  ShieldCheck, 
  ArrowRightLeft, 
  CheckCircle2, 
  Clock, 
  Activity, 
  Building, 
  Lock, 
  Cpu, 
  RefreshCw, 
  Plus, 
  DollarSign, 
  Check, 
  FileCheck, 
  AlertTriangle, 
  SendHorizontal,
  ChevronRight,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { SpeiNetworkNode, DispenserQueueItem, ReserveFundStats } from '../types/aml';
import { formatAccountDisplay } from '../utils/mexicanBanks';
import { 
  loadSpeiNodes, 
  saveSpeiNodes, 
  loadDispenserQueue, 
  saveDispenserQueue, 
  loadReserveFunds, 
  saveReserveFunds 
} from '../utils/speiNodesNetwork';

export const SpeiNodesAndDispenser: React.FC = () => {
  const [nodes, setNodes] = useState<SpeiNetworkNode[]>(() => loadSpeiNodes());
  const [dispenserQueue, setDispenserQueue] = useState<DispenserQueueItem[]>(() => loadDispenserQueue());
  const [reserveStats, setReserveStats] = useState<ReserveFundStats>(() => loadReserveFunds());
  
  const [isPingingNodes, setIsPingingNodes] = useState(false);
  const [isDispensing, setIsDispensing] = useState(false);
  const [dispenseSuccessNotice, setDispenseSuccessNotice] = useState<string | null>(null);

  // Modal / Form state for depositing into reserve funds
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);

  useEffect(() => {
    const handleClose = () => setIsDepositModalOpen(false);
    window.addEventListener('amlanfat:close_active_modal', handleClose);
    return () => window.removeEventListener('amlanfat:close_active_modal', handleClose);
  }, []);

  const [depositAmount, setDepositAmount] = useState('1000000');
  const [selectedReserveAccount, setSelectedReserveAccount] = useState('BANXICO-RESGUARDO-ART22-09482');

  // Trigger manual failover of primary node
  const handleTogglePrimaryNode = (nodeId: string) => {
    const updated = nodes.map(n => {
      if (n.id === nodeId) {
        return {
          ...n,
          isPrimaryActive: true,
          status: 'ONLINE_PRIMARY' as const
        };
      }
      return {
        ...n,
        isPrimaryActive: false,
        status: (n.status === 'ONLINE_PRIMARY' ? 'ONLINE_HOT_STANDBY' : n.status) as any
      };
    });
    setNodes(updated);
    saveSpeiNodes(updated);
  };

  // Ping all nodes to simulate latency update
  const handlePingNodes = () => {
    setIsPingingNodes(true);
    setTimeout(() => {
      const updated = nodes.map(n => ({
        ...n,
        latencyMs: +(Math.max(0.3, n.latencyMs + (Math.random() * 0.6 - 0.3))).toFixed(2)
      }));
      setNodes(updated);
      saveSpeiNodes(updated);
      setIsPingingNodes(false);
    }, 500);
  };

  // Dispense queued SPEI transfers
  const handleDispensePending = () => {
    const pendingItems = dispenserQueue.filter(item => item.status === 'QUEUED');
    if (pendingItems.length === 0) return;

    setIsDispensing(true);
    setTimeout(() => {
      const activePrimaryNode = nodes.find(n => n.isPrimaryActive) || nodes[0];
      const totalAmountToDispense = pendingItems.reduce((acc, i) => acc + i.amountMXN, 0);

      const updatedQueue = dispenserQueue.map(item => {
        if (item.status === 'QUEUED') {
          return {
            ...item,
            status: 'DISPENSED_SETTLED' as const,
            cepFolio: `CEP-BANXICO-${Date.now().toString(36).toUpperCase()}`,
            allocatedNodeId: activePrimaryNode.id,
            reserveFundDeducted: true
          };
        }
        return item;
      });

      // Update node dispatched stats
      const updatedNodes = nodes.map(n => {
        if (n.id === activePrimaryNode.id) {
          return {
            ...n,
            totalDispatchedTxs: n.totalDispatchedTxs + pendingItems.length,
            volumeDispatchedMXN: n.volumeDispatchedMXN + totalAmountToDispense
          };
        }
        return n;
      });

      setDispenserQueue(updatedQueue);
      saveDispenserQueue(updatedQueue);
      setNodes(updatedNodes);
      saveSpeiNodes(updatedNodes);

      setIsDispensing(false);
      setDispenseSuccessNotice(`Se dispersaron exitosamente ${pendingItems.length} órdenes SPEI por $${totalAmountToDispense.toLocaleString('es-MX')} MXN a través de ${activePrimaryNode.name}.`);
      setTimeout(() => setDispenseSuccessNotice(null), 5000);
    }, 800);
  };

  // Deposit funds to Reserve Fund
  const handleDepositReserve = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(depositAmount);
    if (!amount || amount <= 0) return;

    const newTotal = reserveStats.totalReserveFundMXN + amount;
    const newRatio = +( (newTotal / reserveStats.liquidDemandLiabilitiesMXN) * 100 ).toFixed(1);

    const updatedAccounts = reserveStats.safeguardedAccounts.map(acc => {
      if (acc.accountNumber === selectedReserveAccount) {
        return {
          ...acc,
          balanceMXN: acc.balanceMXN + amount
        };
      }
      return acc;
    });

    const updatedStats: ReserveFundStats = {
      ...reserveStats,
      totalReserveFundMXN: newTotal,
      currentCoverageRatio: newRatio,
      safeguardedAccounts: updatedAccounts
    };

    setReserveStats(updatedStats);
    saveReserveFunds(updatedStats);
    setIsDepositModalOpen(false);
  };

  const pendingCount = dispenserQueue.filter(i => i.status === 'QUEUED').length;
  const activeNode = nodes.find(n => n.isPrimaryActive) || nodes[0];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">
                <Network className="w-5 h-5" />
              </span>
              <h1 className="text-base font-bold text-white tracking-tight">
                Nodos de Red SPEI & Dispensador con Fondos de Resguardo
              </h1>
            </div>
            <p className="text-xs text-slate-400 max-w-3xl leading-relaxed">
              Infraestructura de dispersión interbancaria en tiempo real con respaldo integral en Banco de México. Monitorea los nodos del consorcio SPEI (Banxico Directo, STP y Cecoban) y salvaguarda el 100% de fondos de resguardo en cuentas de custodia conforme al Artículo 22 de la Ley Fintech.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handlePingNodes}
              disabled={isPingingNodes}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 text-xs font-semibold transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isPingingNodes ? 'animate-spin' : ''}`} />
              <span>Ping Telemetría Nodos</span>
            </button>

            <button
              onClick={() => setIsDepositModalOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Aportar Fondos de Resguardo</span>
            </button>

            <button
              onClick={handleDispensePending}
              disabled={isDispensing || pendingCount === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg transition-all cursor-pointer"
            >
              <SendHorizontal className={`w-4 h-4 ${isDispensing ? 'animate-bounce' : ''}`} />
              <span>Dispersar Lote Pendiente ({pendingCount})</span>
            </button>
          </div>
        </div>

        {/* Success Notice */}
        {dispenseSuccessNotice && (
          <div className="p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-500/50 text-emerald-300 text-xs font-mono flex items-center gap-2 animate-in fade-in duration-150">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{dispenseSuccessNotice}</span>
          </div>
        )}

        {/* Reserve Fund Regulatory Overview Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-teal-500/30">
            <div className="text-[11px] font-mono text-slate-400">Fondos de Resguardo Custodiados</div>
            <div className="text-lg font-bold text-teal-300 font-mono mt-0.5">
              ${reserveStats.totalReserveFundMXN.toLocaleString('es-MX')} MXN
            </div>
            <div className="text-[10px] text-teal-400 font-mono mt-1">Art. 22 Ley Fintech (Segregado)</div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
            <div className="text-[11px] font-mono text-slate-400">Ratio de Cobertura de Reserva</div>
            <div className="text-lg font-bold text-emerald-400 font-mono mt-0.5">
              {reserveStats.currentCoverageRatio}%
            </div>
            <div className="text-[10px] text-emerald-400 font-mono mt-1">
              Supera requisito regulatorio (100% min)
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
            <div className="text-[11px] font-mono text-slate-400">Nodo Primario Activo</div>
            <div className="text-sm font-bold text-white font-mono mt-0.5 truncate" title={activeNode.name}>
              {activeNode.name}
            </div>
            <div className="text-[10px] text-indigo-400 font-mono mt-1">
              Latencia: {activeNode.latencyMs} ms · LBTR Banxico
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
            <div className="text-[11px] font-mono text-slate-400">Cola del Dispensador</div>
            <div className="text-lg font-bold text-amber-400 font-mono mt-0.5">
              {pendingCount} pendientes
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-1">
              {dispenserQueue.length} registradas en historial
            </div>
          </div>
        </div>
      </div>

      {/* Section 1: SPEI Network Nodes Cluster */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Server className="w-4 h-4 text-teal-400" />
              <span>Cluster de Nodos de Red SPEI (Interconexión Financiera Banxico)</span>
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Nodos de liquidación bruta en tiempo real con conmutación por error (Failover) redundante.
            </p>
          </div>
          <span className="text-xs text-emerald-400 font-mono flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>4 Nodos Sincronizados</span>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {nodes.map(node => (
            <div 
              key={node.id} 
              className={`p-4 rounded-xl border transition-all space-y-3 ${
                node.isPrimaryActive 
                  ? 'bg-slate-950/80 border-teal-500/50 shadow-md' 
                  : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{node.name}</span>
                    {node.isPrimaryActive && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-teal-950 text-teal-300 border border-teal-500/40">
                        ACTIVO PRIMARIO
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5 font-mono">{node.operator}</div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-900 border border-slate-700 text-slate-300">
                    {node.latencyMs} ms
                  </span>
                  {!node.isPrimaryActive && (
                    <button
                      onClick={() => handleTogglePrimaryNode(node.id)}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-teal-400 text-[10px] font-mono font-semibold transition-colors cursor-pointer"
                      title="Activar como nodo primario"
                    >
                      Conmutar
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-[10px] font-mono p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                <div>
                  <div className="text-slate-500">Disponibilidad</div>
                  <div className="text-emerald-400 font-bold">{node.uptimePercentage}%</div>
                </div>
                <div>
                  <div className="text-slate-500">Puerto / Proto</div>
                  <div className="text-slate-200">{node.port} (mTLS)</div>
                </div>
                <div>
                  <div className="text-slate-500">Vigencia Cert.</div>
                  <div className="text-slate-300">{node.certificateExpiry.slice(0, 7)}</div>
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-800/80">
                <span>Dispersiones: {node.totalDispatchedTxs.toLocaleString('es-MX')} txs</span>
                <span className="text-teal-400 font-semibold">
                  Volumen: ${node.volumeDispatchedMXN.toLocaleString('es-MX')} MXN
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 2: Safeguarded Reserve Fund Accounts (Fondos de Resguardo Art. 22 Ley Fintech) */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Cuentas de Custodia Segregadas (Fondos de Resguardo en Banco de México)</span>
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Patrimonio inembargable y segregado 100% de fondos de los usuarios conforme al Artículo 22 de la Ley para Regular las Instituciones de Tecnología Financiera.
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-xl bg-emerald-950/80 text-emerald-400 text-xs font-mono font-bold border border-emerald-500/40">
            AUDITORÍA BANXICO CONFORME
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {reserveStats.safeguardedAccounts.map((acc, index) => (
            <div 
              key={index}
              className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2 font-mono text-xs"
            >
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-teal-400" />
                  <span>{acc.institution}</span>
                </span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              </div>

              <div className="text-lg font-bold text-teal-300">
                ${acc.balanceMXN.toLocaleString('es-MX')} MXN
              </div>

              <div className="text-[10px] text-slate-400 break-all">
                Cuenta: {acc.accountNumber}
              </div>

              <div className="text-[9px] text-slate-500 pt-1 border-t border-slate-800">
                {acc.custodyType}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 3: Dispenser Live Settlement Queue */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4 text-teal-400" />
              <span>Cola y Registro del Dispensador de Fondos SPEI ({dispenserQueue.length})</span>
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Órdenes de dispersión ejecutadas automáticamente con comprobante electrónico de pago (CEP) y débito de fondos de resguardo.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-[11px] font-mono text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Folio / Fecha</th>
                <th className="py-2.5 px-3">Beneficiario / Banco</th>
                <th className="py-2.5 px-3">Destino SPEI (CLABE / PAN / DiMo)</th>
                <th className="py-2.5 px-3">Monto Dispersado</th>
                <th className="py-2.5 px-3">Nodo de Red</th>
                <th className="py-2.5 px-3">Folio CEP / Rastreo</th>
                <th className="py-2.5 px-3">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-mono text-[11px]">
              {dispenserQueue.map(item => (
                <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-2.5 px-3">
                    <div className="font-bold text-white">{item.id}</div>
                    <div className="text-[10px] text-slate-400">{new Date(item.timestamp).toLocaleTimeString('es-MX')}</div>
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="text-slate-200 font-semibold truncate max-w-[200px]">{item.beneficiaryName}</div>
                    <div className="text-[10px] text-slate-400">{item.targetBank}</div>
                  </td>
                  <td className="py-2.5 px-3 text-slate-300">
                    <div className="flex items-center gap-1 mb-0.5">
                      {item.accountFormat === 'PAN_16' ? (
                        <span className="px-1.5 py-0.2 rounded text-[9px] bg-purple-950 text-purple-300 border border-purple-800 font-mono">
                          PAN 16d
                        </span>
                      ) : item.accountFormat === 'DIMO_10' ? (
                        <span className="px-1.5 py-0.2 rounded text-[9px] bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono">
                          DiMo 10d
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.2 rounded text-[9px] bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono">
                          CLABE 18d
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-200 font-mono">
                      {formatAccountDisplay(item.targetCLABE, item.accountFormat || 'CLABE_18')}
                    </div>
                  </td>
                  <td className="py-2.5 px-3 font-bold text-teal-300">
                    ${item.amountMXN.toLocaleString('es-MX')} MXN
                  </td>
                  <td className="py-2.5 px-3 text-[10px] text-slate-400">
                    {item.allocatedNodeId}
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="text-emerald-400 font-semibold">{item.cepFolio}</div>
                    <div className="text-[10px] text-slate-500 truncate max-w-[150px]">{item.trackingKey}</div>
                  </td>
                  <td className="py-2.5 px-3">
                    {item.status === 'DISPENSED_SETTLED' ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                        DISPERSADO (CEP)
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-500/30 animate-pulse">
                        EN COLA SPEI
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Deposit to Reserve Fund Modal */}
      {isDepositModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="max-w-md w-full bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-teal-400" />
                <h3 className="text-sm font-bold text-white">Aportar a Fondos de Resguardo</h3>
              </div>
              <button 
                onClick={() => setIsDepositModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleDepositReserve} className="space-y-3 text-xs font-mono">
              <div>
                <label className="text-slate-400 block mb-1">Monto a Segregar (MXN):</label>
                <input
                  type="number"
                  required
                  min="10000"
                  step="5000"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Cuenta de Destino Custodia:</label>
                <select
                  value={selectedReserveAccount}
                  onChange={(e) => setSelectedReserveAccount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none"
                >
                  {reserveStats.safeguardedAccounts.map(acc => (
                    <option key={acc.accountNumber} value={acc.accountNumber}>
                      {acc.institution} ({acc.accountNumber})
                    </option>
                  ))}
                </select>
              </div>

              <p className="text-[10px] text-slate-400 p-2.5 rounded-lg bg-slate-950 border border-slate-800 leading-relaxed">
                <span className="text-teal-400 font-bold">Mandato Legal Art. 22:</span> Los recursos aportados ingresan con carácter inembargable y de salvaguarda irrevocable a favor de los usuarios receptores de pagos interbancarios.
              </p>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsDepositModalOpen(false)}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold cursor-pointer shadow-lg"
                >
                  Confirmar Aportación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
