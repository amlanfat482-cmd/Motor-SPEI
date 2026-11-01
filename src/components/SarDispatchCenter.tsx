import React, { useState } from 'react';
import { Transaction } from '../types/aml';
import { buildUifOfficialJsonPayload } from '../utils/riskEngine';
import { downloadJsonFile } from '../utils/exportUtils';
import { 
  Send, 
  CheckCircle, 
  ShieldAlert, 
  Download, 
  FileCode, 
  Eye, 
  ExternalLink, 
  Building, 
  Globe2, 
  ShieldCheck,
  Hash,
  Archive,
  FolderArchive
} from 'lucide-react';

interface SarDispatchCenterProps {
  transactions: Transaction[];
  onDispatchAllQueued: () => void;
  onDispatchSingle: (txId: string) => void;
  onInspectTransaction: (tx: Transaction) => void;
}

export const SarDispatchCenter: React.FC<SarDispatchCenterProps> = ({
  transactions,
  onDispatchAllQueued,
  onDispatchSingle,
  onInspectTransaction
}) => {
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [storageFilter, setStorageFilter] = useState<'ALL' | 'ACTIVE_HOT' | 'LONG_TERM'>('ALL');

  // Filter all reprobable transactions (score >= 800) or transactions with SAR status
  const sarReports = transactions.filter(
    (t) => t.riskBreakdown.totalScore >= 800 || t.sarStatus === 'AUTO_QUEUED' || t.sarStatus === 'DISPATCHED_UIF'
  );

  const displayedReports = sarReports.filter((t) => {
    if (storageFilter === 'ACTIVE_HOT') return t.storageTier !== 'LONG_TERM_STORAGE';
    if (storageFilter === 'LONG_TERM') return t.storageTier === 'LONG_TERM_STORAGE';
    return true;
  });

  const pendingCount = sarReports.filter((t) => t.sarStatus === 'AUTO_QUEUED' || t.sarStatus === 'NONE').length;
  const dispatchedCount = sarReports.filter((t) => t.sarStatus === 'DISPATCHED_UIF' || t.sarStatus === 'ACKNOWLEDGED').length;
  const longTermArchivedCount = sarReports.filter((t) => t.storageTier === 'LONG_TERM_STORAGE').length;

  const currentPreviewTx = selectedTx || sarReports[0] || null;
  const currentJson = currentPreviewTx ? buildUifOfficialJsonPayload(currentPreviewTx) : null;

  const handleDownloadSingle = (tx: Transaction) => {
    const payload = buildUifOfficialJsonPayload(tx);
    downloadJsonFile(payload, `REPORTE_SAR_${tx.sarFolio || tx.id}_UIF_CENFI.json`);
  };

  const handleDownloadBulkJson = () => {
    const bundle = {
      meta: {
        emisor: 'AMLANFAT OPERADORA FINTECH S.A.P.I. DE C.V.',
        oficialCumplimiento: 'Mtro. Roberto Mendoza Salazar (CNBV-PLD-2024-8492)',
        fechaGeneracion: new Date().toISOString(),
        totalReportes: sarReports.length
      },
      reportes: sarReports.map((t) => buildUifOfficialJsonPayload(t))
    };
    downloadJsonFile(bundle, `PAQUETE_EXPEDIENTE_SAR_UIF_CENFI_GAFI_${new Date().toISOString().slice(0, 10)}.json`);
  };

  return (
    <div className="space-y-6">
      {/* Header and regulatory authority credentials */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-400" />
              <h1 className="text-base font-bold text-white tracking-tight">
                Centro de Despacho Regulatorio Automatizado (SAR / UIF / CenFi / GAFI)
              </h1>
            </div>
            <p className="text-xs text-slate-400 max-w-3xl leading-relaxed">
              Sistema de generación y despacho criptográfico de reportes obligatorios conforme al Art. 58 de la Ley Fintech, Disposiciones de Carácter General CNBV, recomendaciones GAFI 15/16 y directrices del Centro de Inteligencia Financiera (CenFi).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleDownloadBulkJson}
              disabled={sarReports.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 border border-slate-700 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Descargar Lote JSON</span>
            </button>

            <button
              onClick={onDispatchAllQueued}
              disabled={pendingCount === 0}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Despachar Todos los Pendientes ({pendingCount})</span>
            </button>
          </div>
        </div>

        {/* Authorities Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800/80 text-xs">
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-start gap-2.5">
            <Building className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-200 block text-xs">UIF (SHCP México)</strong>
              <span className="text-[11px] text-slate-400 block leading-tight">
                Reporte de Operaciones Inusuales (ROI) conforme al Art. 115 LIC. Sello criptográfico SHA-256 habilitado.
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-200 block text-xs">CenFi Regulatorio</strong>
              <span className="text-[11px] text-slate-400 block leading-tight">
                Canal seguro de intercambio interbancario de alertas y reportes para entidades reguladas Fintech.
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-start gap-2.5">
            <Globe2 className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-200 block text-xs">GAFI / FATF Travel Rule</strong>
              <span className="text-[11px] text-slate-400 block leading-tight">
                Estandarización Inter-VASP para transmisión de datos de originador y beneficiario en criptoactivos.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main split: List of SARs vs Live JSON Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column: SAR Reports queue */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90">
            <div>
              <h2 className="text-xs font-semibold text-slate-200 uppercase tracking-wide">
                Expedientes Reprobables Calificados (Score &gt;= 800)
              </h2>
              <span className="text-[11px] text-slate-400">
                {sarReports.length} operaciones identificadas con riesgo reprobable
              </span>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
              <button
                onClick={() => setStorageFilter('ALL')}
                className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                  storageFilter === 'ALL' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Todos ({sarReports.length})
              </button>
              <button
                onClick={() => setStorageFilter('ACTIVE_HOT')}
                className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                  storageFilter === 'ACTIVE_HOT' ? 'bg-slate-800 text-cyan-300' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Activos Hot ({sarReports.length - longTermArchivedCount})
              </button>
              <button
                onClick={() => setStorageFilter('LONG_TERM')}
                className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                  storageFilter === 'LONG_TERM' ? 'bg-indigo-950 text-indigo-300 border border-indigo-700/40' : 'text-slate-400 hover:text-indigo-300'
                }`}
              >
                Long-Term ({longTermArchivedCount})
              </button>
            </div>
          </div>

          <div className="divide-y divide-slate-800/60 overflow-y-auto max-h-[620px]">
            {displayedReports.length === 0 ? (
              <div className="p-10 text-center text-slate-400 text-xs">
                No hay operaciones en este nivel de almacenamiento.
              </div>
            ) : (
              displayedReports.map((tx) => {
                const isDispatched = tx.sarStatus === 'DISPATCHED_UIF' || tx.sarStatus === 'ACKNOWLEDGED';
                const isSelected = currentPreviewTx?.id === tx.id;
                const isLongTerm = tx.storageTier === 'LONG_TERM_STORAGE';

                return (
                  <div
                    key={tx.id}
                    onClick={() => setSelectedTx(tx)}
                    className={`p-4 transition-colors cursor-pointer ${
                      isSelected ? 'bg-slate-800/60 border-l-2 border-rose-500' : 'hover:bg-slate-800/30'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-xs font-mono font-bold text-white">{tx.sarFolio || `UIF-AUTO-${tx.id}`}</span>
                          <span className="text-slate-600">·</span>
                          <span className="text-[11px] text-rose-400 font-mono font-semibold">
                            Score: {tx.riskBreakdown.totalScore}/1000
                          </span>
                          {isLongTerm && (
                            <span className="text-[10px] font-mono text-indigo-300 bg-indigo-950/80 border border-indigo-700/60 px-1.5 py-0.2 rounded inline-flex items-center gap-1">
                              <Archive className="w-2.5 h-2.5 text-indigo-400" />
                              <span>Long-Term {tx.archiveMetadata?.compressionRatio || '-88%'}</span>
                            </span>
                          )}
                        </div>
                        
                        <div className="text-xs text-slate-300 font-medium">
                          {tx.originator.name} <span className="text-slate-400 font-mono text-[11px]">({tx.originator.taxId})</span>
                        </div>

                        <div className="text-[11px] text-slate-400 flex items-center gap-2">
                          <span>{tx.channel} ({tx.cryptoNetwork || tx.bankName})</span>
                          <span>·</span>
                          <span className="font-mono tabular-nums text-slate-200">
                            ${tx.amountMXN.toLocaleString()} MXN
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        {isDispatched ? (
                          <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Transmitido</span>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDispatchSingle(tx.id);
                            }}
                            className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-md transition-colors cursor-pointer"
                          >
                            <Send className="w-3 h-3" />
                            <span>Despachar</span>
                          </button>
                        )}

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onInspectTransaction(tx);
                          }}
                          className="text-[11px] text-slate-400 hover:text-slate-200 underline cursor-pointer"
                        >
                          Ver Detalles
                        </button>
                      </div>
                    </div>

                    {/* Alert summary snippet */}
                    {tx.riskBreakdown.flags.length > 0 && (
                      <div className="mt-2 text-[11px] text-rose-300/90 bg-rose-950/20 p-2 rounded-lg border border-rose-900/30 line-clamp-1">
                        {tx.riskBreakdown.flags[0]}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right column: JSON Official Payload live viewer */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-emerald-400" />
              <div>
                <h2 className="text-xs font-semibold text-slate-200">
                  Estructura JSON Oficial Transmitida a Autoridades
                </h2>
                <span className="text-[11px] text-slate-400 font-mono">
                  {currentPreviewTx ? currentPreviewTx.sarFolio || currentPreviewTx.id : 'Seleccione un reporte'}
                </span>
              </div>
            </div>

            {currentPreviewTx && (
              <button
                onClick={() => handleDownloadSingle(currentPreviewTx)}
                className="flex items-center gap-1.5 px-3 py-1 text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 hover:bg-emerald-900/60 rounded-md transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Descargar</span>
              </button>
            )}
          </div>

          {currentJson ? (
            <div className="p-4 overflow-y-auto max-h-[620px] space-y-4">
              {/* Receipt stamp banner */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Sello de Recepción Criptográfica:</span>
                  <span className="text-emerald-400 font-semibold font-mono text-[11px]">HMAC-SHA256 VÁLIDO</span>
                </div>
                <div className="text-[11px] font-mono text-slate-300 break-all select-all bg-slate-900/80 p-2 rounded border border-slate-800">
                  {currentPreviewTx?.sarReceiptHash || '0x4920fe849102847a982bfe0182749281a0b3847291840291'}
                </div>
              </div>

              {/* Long term storage archive banner */}
              {currentPreviewTx?.storageTier === 'LONG_TERM_STORAGE' && currentPreviewTx.archiveMetadata && (
                <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-700/50 flex items-start gap-2.5 text-xs text-indigo-300">
                  <Archive className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                  <div className="space-y-1 w-full">
                    <div className="flex justify-between items-center">
                      <strong className="text-white font-medium">Log SAR Comprimido en Long-Term Storage</strong>
                      <span className="font-mono text-[10px] bg-indigo-900/80 text-indigo-200 px-1.5 py-0.5 rounded">
                        {currentPreviewTx.archiveMetadata.compressionRatio} Zstd
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-300 font-mono">
                      Lote: {currentPreviewTx.archiveMetadata.archiveBatchId} · {currentPreviewTx.archiveMetadata.originalSizeBytes} B &rarr; {currentPreviewTx.archiveMetadata.compressedSizeBytes} B
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono break-all select-all">
                      {currentPreviewTx.archiveMetadata.storageVaultPath}
                    </div>
                  </div>
                </div>
              )}

              {/* Raw JSON */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-[11px] text-emerald-300/90 overflow-x-auto leading-relaxed select-all">
                <pre>{JSON.stringify(currentJson, null, 2)}</pre>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-400 text-xs">
              No hay reporte seleccionado para inspeccionar el payload.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
