import React, { useState } from 'react';
import { 
  Layers, 
  ShieldCheck, 
  Lock, 
  Hash, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Download, 
  RefreshCw, 
  FileCheck, 
  Stamp, 
  KeyRound, 
  Cpu, 
  Check, 
  Copy,
  Sparkles
} from 'lucide-react';
import { ImmutableBlock, Transaction } from '../types/aml';
import { verifyLedgerIntegrity, sealNewBlock, saveImmutableLedger } from '../utils/immutableLedger';

interface ImmutableLedgerViewerProps {
  ledgerChain: ImmutableBlock[];
  onUpdateLedgerChain: (chain: ImmutableBlock[]) => void;
  transactions: Transaction[];
}

export const ImmutableLedgerViewer: React.FC<ImmutableLedgerViewerProps> = ({
  ledgerChain,
  onUpdateLedgerChain,
  transactions
}) => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [integrityReport, setIntegrityReport] = useState<{
    isValid: boolean;
    details: string;
    checkedBlocks: number;
    verifiedAt?: string;
  } | null>(null);
  
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [isSealingNewBlock, setIsSealingNewBlock] = useState(false);
  const [sealSuccessNotice, setSealSuccessNotice] = useState<string | null>(null);

  const handleVerifyIntegrity = () => {
    setIsVerifying(true);
    setIntegrityReport(null);

    setTimeout(() => {
      const result = verifyLedgerIntegrity(ledgerChain);
      setIntegrityReport({
        ...result,
        verifiedAt: new Date().toLocaleTimeString('es-MX')
      });
      setIsVerifying(false);
    }, 600);
  };

  const handleSealNewBlock = () => {
    if (ledgerChain.length === 0) return;
    setIsSealingNewBlock(true);

    setTimeout(() => {
      const lastBlock = ledgerChain[ledgerChain.length - 1];
      // Sample recent transactions
      const batchToSeal = transactions.slice(0, Math.min(15, transactions.length));
      const newBlock = sealNewBlock(batchToSeal, lastBlock);
      const updatedChain = [...ledgerChain, newBlock];
      
      onUpdateLedgerChain(updatedChain);
      saveImmutableLedger(updatedChain);
      
      setIsSealingNewBlock(false);
      setSealSuccessNotice(`Bloque #${newBlock.index} sellado con éxito con hash ${newBlock.hash.slice(0, 16)}...`);
      setTimeout(() => setSealSuccessNotice(null), 4000);
    }, 700);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(text);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const handleExportLedgerCertificate = () => {
    const payload = {
      titulo: 'CERTIFICADO DE AUDITORÍA CRIPTOGRÁFICA - LIBRO INMUTABLE AMLANFAT',
      normativa: 'Art. 58 Ley Fintech & Art. 115 LIC - Disposiciones de Carácter General CNBV',
      fechaEmision: new Date().toISOString(),
      bloquesTotales: ledgerChain.length,
      resumenCadena: ledgerChain.map(b => ({
        bloque: b.index,
        timestamp: b.timestamp,
        hash: b.hash,
        previousHash: b.previousHash,
        merkleRoot: b.merkleRoot,
        transacciones: b.transactionCount,
        volumenMXN: b.totalVolumeMXN,
        comisionesMXN: b.totalFeesMXN,
        selloDigitalCNBV: b.cnbvDigitalSeal,
        firmaOficial: b.complianceOfficerSignature
      })),
      verificacionIntegridad: verifyLedgerIntegrity(ledgerChain)
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AMLANFAT_LIBRO_INMUTABLE_CNBV_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalTransactionsSealed = ledgerChain.reduce((acc, b) => acc + b.transactionCount, 0);
  const totalVolumeMXN = ledgerChain.reduce((acc, b) => acc + b.totalVolumeMXN, 0);
  const totalBlacklistHits = ledgerChain.reduce((acc, b) => acc + b.blacklistHitsCount, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Layers className="w-5 h-5" />
              </span>
              <h1 className="text-base font-bold text-white tracking-tight">
                Libro Inmutable de Auditoría Criptográfica (Tamper-Proof Ledger)
              </h1>
            </div>
            <p className="text-xs text-slate-400 max-w-3xl leading-relaxed">
              Registro inalterable con encadenamiento criptográfico SHA-256 (Hash-Chaining) y cálculo de Merkle Roots. Cada bloque preserva la trazabilidad total de operaciones, comisiones aplicadas y medidas cautelares conforme a las Disposiciones CNBV y Ley Fintech.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleVerifyIntegrity}
              disabled={isVerifying}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shadow-lg transition-all cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isVerifying ? 'animate-spin' : ''}`} />
              <span>Verificar Integridad del Libro</span>
            </button>

            <button
              onClick={handleSealNewBlock}
              disabled={isSealingNewBlock}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold shadow-lg transition-all cursor-pointer"
            >
              <Stamp className="w-4 h-4" />
              <span>Sellar Nuevo Bloque</span>
            </button>

            <button
              onClick={handleExportLedgerCertificate}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Exportar Certificado JSON</span>
            </button>
          </div>
        </div>

        {/* Success Notice */}
        {sealSuccessNotice && (
          <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 text-xs font-mono flex items-center gap-2 animate-in fade-in duration-150">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{sealSuccessNotice}</span>
          </div>
        )}

        {/* Integrity Verification Result Banner */}
        {integrityReport && (
          <div className={`p-4 rounded-xl border animate-in fade-in duration-200 ${
            integrityReport.isValid 
              ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300' 
              : 'bg-rose-950/40 border-rose-500/50 text-rose-300'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-xs">
                {integrityReport.isValid ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                )}
                <span>
                  {integrityReport.isValid 
                    ? 'CADENA ÍNTEGRA Y SIN ALTERACIONES - 100% AUDITABLE CNBV' 
                    : 'ALERTA DE SEGURIDAD: DISCREPANCIA EN LIBRO INMUTABLE'}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                Verificado a las {integrityReport.verifiedAt}
              </span>
            </div>
            <p className="text-[11px] font-mono text-slate-300 mt-1">
              {integrityReport.details}
            </p>
          </div>
        )}

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
            <div className="text-[11px] font-mono text-slate-400">Bloques Sellados en Cadena</div>
            <div className="text-lg font-bold text-white font-mono mt-0.5">{ledgerChain.length}</div>
            <div className="text-[10px] text-indigo-400 font-mono mt-1">Génesis #0 a Bloque #{ledgerChain.length - 1}</div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
            <div className="text-[11px] font-mono text-slate-400">Transacciones Custodiadas</div>
            <div className="text-lg font-bold text-emerald-400 font-mono mt-0.5">{totalTransactionsSealed}</div>
            <div className="text-[10px] text-slate-400 font-mono mt-1">Selladas con Merkle Tree</div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
            <div className="text-[11px] font-mono text-slate-400">Volumen Sellado Acumulado</div>
            <div className="text-lg font-bold text-amber-400 font-mono mt-0.5">
              ${totalVolumeMXN.toLocaleString('es-MX')} MXN
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-1">Certeza probatoria mercantil</div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
            <div className="text-[11px] font-mono text-slate-400">Sello Digital Homologado</div>
            <div className="text-lg font-bold text-white font-mono mt-0.5">HMAC-SHA256</div>
            <div className="text-[10px] text-emerald-400 font-mono mt-1">Autorización CNBV Art. 58</div>
          </div>
        </div>
      </div>

      {/* Blocks List Visual Chain */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-indigo-400" />
            <span>Secuencia de Bloques Criptográficos Sellados</span>
          </h2>
          <span className="text-xs text-slate-400 font-mono">
            {ledgerChain.length} Bloques Verificables
          </span>
        </div>

        <div className="space-y-3">
          {ledgerChain.map((block, idx) => (
            <div 
              key={block.index} 
              className={`p-5 rounded-2xl border transition-all ${
                block.index === 0
                  ? 'bg-slate-900/70 border-indigo-500/40 shadow-lg'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Block Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-950 border border-indigo-500/40 flex items-center justify-center text-indigo-400 font-mono font-bold text-sm">
                    #{block.index}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">
                        {block.index === 0 ? 'Bloque Génesis (Origen de Cadena)' : `Bloque Inmutable #${block.index}`}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                        {block.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(block.timestamp).toLocaleString('es-MX')}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs font-mono">
                  <div className="text-right">
                    <div className="text-slate-400 text-[10px]">Transacciones en Bloque</div>
                    <div className="text-white font-bold">{block.transactionCount} txs</div>
                  </div>
                  <div className="text-right">
                    <div className="text-slate-400 text-[10px]">Volumen Total</div>
                    <div className="text-emerald-400 font-bold">${block.totalVolumeMXN.toLocaleString('es-MX')} MXN</div>
                  </div>
                </div>
              </div>

              {/* Cryptographic Hashes & Tree */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 text-xs font-mono">
                {/* Block Hash */}
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span className="flex items-center gap-1 font-semibold text-indigo-300">
                      <Hash className="w-3 h-3" />
                      <span>Hash del Bloque (SHA-256):</span>
                    </span>
                    <button
                      onClick={() => handleCopy(block.hash)}
                      className="text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                    >
                      {copiedHash === block.hash ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                      <span>Copiar</span>
                    </button>
                  </div>
                  <div className="text-indigo-400 font-semibold break-all text-[11px]">
                    {block.hash}
                  </div>
                </div>

                {/* Previous Hash */}
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span className="flex items-center gap-1 font-semibold text-slate-400">
                      <Lock className="w-3 h-3" />
                      <span>Hash Previo (Enlace de Cadena):</span>
                    </span>
                    <button
                      onClick={() => handleCopy(block.previousHash)}
                      className="text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                    >
                      {copiedHash === block.previousHash ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                      <span>Copiar</span>
                    </button>
                  </div>
                  <div className="text-slate-300 break-all text-[11px]">
                    {block.previousHash}
                  </div>
                </div>

                {/* Merkle Root */}
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                  <div className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                    <KeyRound className="w-3 h-3 text-emerald-400" />
                    <span>Merkle Root de Transacciones:</span>
                  </div>
                  <div className="text-emerald-400 font-semibold break-all text-[11px]">
                    {block.merkleRoot}
                  </div>
                </div>

                {/* CNBV Seal & Officer Signature */}
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                  <div className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                    <Stamp className="w-3 h-3 text-amber-400" />
                    <span>Sello Digital Regulatorio CNBV:</span>
                  </div>
                  <div className="text-amber-300 font-semibold break-all text-[11px]">
                    {block.cnbvDigitalSeal}
                  </div>
                </div>
              </div>

              {/* Block Footer Seal Info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-3 mt-3 border-t border-slate-800 text-[10px] font-mono text-slate-400">
                <div>
                  <span className="text-slate-500">Oficial Certificador: </span>
                  <span className="text-slate-300">{block.complianceOfficerSignature}</span>
                </div>
                <div>
                  <span className="text-slate-500">Coincidencias en Listas Negras: </span>
                  <span className={block.blacklistHitsCount > 0 ? 'text-rose-400 font-bold' : 'text-slate-400'}>
                    {block.blacklistHitsCount} detectadas
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
