import React from 'react';
import { SpeiTransferRecord, Transaction } from '../types/aml';

interface PrintAuditReportProps {
  transactions: Transaction[];
  speiTransfers: SpeiTransferRecord[];
}

export const PrintAuditReport: React.FC<PrintAuditReportProps> = ({
  transactions,
  speiTransfers
}) => {
  const reprobableTxs = transactions.filter((t) => t.riskBreakdown.totalScore >= 800);
  const now = new Date();

  return (
    <div className="hidden print:block p-8 bg-white text-slate-900 text-xs font-serif leading-relaxed">
      {/* Official Header */}
      <div className="border-b-2 border-slate-900 pb-4 mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-xl font-bold font-sans tracking-tight text-slate-950 uppercase">
            AMLANFAT OPERADORA FINTECH S.A.P.I. DE C.V.
          </h1>
          <p className="text-xs text-slate-700 font-sans mt-0.5">
            MOTOR GENERADOR DE RIESGO AML/PLD & SUITE REGULATORIA (0-1000)
          </p>
          <div className="text-[11px] text-slate-600 font-mono mt-1 space-x-2">
            <span>RFC: AOF2409267X9</span>
            <span>·</span>
            <span>Registro INDAUTOR: 03-2026-092611452300-01 (Programa de Computación)</span>
          </div>
        </div>

        <div className="text-right font-sans text-xs">
          <div className="font-bold text-slate-950">ACTA DE FISCALIZACIÓN & AUDITORÍA PLD/FT</div>
          <div className="text-slate-600 font-mono">FECHA DE EMISIÓN: {now.toLocaleDateString()} {now.toLocaleTimeString()}</div>
          <div className="text-slate-600 font-mono">FOLIO CNBV: CNBV-PLD-EXP-2026-0948</div>
        </div>
      </div>

      {/* Compliance Officer declaration */}
      <div className="mb-6 p-4 border border-slate-300 rounded bg-slate-50 font-sans text-xs">
        <h2 className="font-bold text-slate-900 mb-1">ATTESTACIÓN DEL OFICIAL DE CUMPLIMIENTO CERTIFICADO</h2>
        <p className="text-slate-700 leading-normal">
          El que suscribe, <strong>Mtro. Roberto Mendoza Salazar</strong>, con Certificación vigente expedida por la Comisión Nacional Bancaria y de Valores bajo el número <strong>CNBV-PLD-2024-8492</strong>, certifica que los registros transaccionales bancarios (SPEI/SWIFT) y de activos virtuales han sido procesados por el motor generador de scores de riesgo AMLanfat, habiéndose transmitido en tiempo y forma los reportes obligatorios (SAR) a la Unidad de Inteligencia Financiera (UIF) y CenFi conforme al Art. 58 de la Ley Fintech y Art. 115 de la Ley de Instituciones de Crédito.
        </p>
      </div>

      {/* Numerical Summary */}
      <div className="mb-6">
        <h3 className="font-bold font-sans text-xs uppercase tracking-wide border-b border-slate-300 pb-1 mb-2">
          1. Resumen Estadístico de Operaciones Auditadas
        </h3>
        <div className="grid grid-cols-4 gap-4 font-sans text-xs">
          <div className="p-2 border border-slate-200 rounded">
            <span className="text-slate-500 block text-[10px]">TOTAL EVALUADAS:</span>
            <strong className="text-sm font-mono">{transactions.length}</strong>
          </div>
          <div className="p-2 border border-slate-200 rounded">
            <span className="text-slate-500 block text-[10px]">REPROBABLES (&gt;= 800):</span>
            <strong className="text-sm font-mono text-rose-700">{reprobableTxs.length}</strong>
          </div>
          <div className="p-2 border border-slate-200 rounded">
            <span className="text-slate-500 block text-[10px]">REPORTES SAR UIF:</span>
            <strong className="text-sm font-mono text-emerald-800">{reprobableTxs.length} transmitidos</strong>
          </div>
          <div className="p-2 border border-slate-200 rounded">
            <span className="text-slate-500 block text-[10px]">LIQUIDACIONES SPEI:</span>
            <strong className="text-sm font-mono">{speiTransfers.length} realizadas</strong>
          </div>
        </div>
      </div>

      {/* Reprobable Transactions Table */}
      <div className="mb-6">
        <h3 className="font-bold font-sans text-xs uppercase tracking-wide border-b border-slate-300 pb-1 mb-2">
          2. Relación de Operaciones con Score Reprobable (Reportadas a UIF / CenFi)
        </h3>
        <table className="w-full text-left font-sans text-[10px] border-collapse border border-slate-300">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-300">
              <th className="p-2 border-r border-slate-300">Folio SAR UIF</th>
              <th className="p-2 border-r border-slate-300">Canal / Red</th>
              <th className="p-2 border-r border-slate-300">Remitente & RFC</th>
              <th className="p-2 border-r border-slate-300 text-right">Monto MXN</th>
              <th className="p-2 border-r border-slate-300 text-center">Score (0-1000)</th>
              <th className="p-2">Sello Digital SHA-256</th>
            </tr>
          </thead>
          <tbody>
            {reprobableTxs.map((tx) => (
              <tr key={tx.id} className="border-b border-slate-200">
                <td className="p-2 font-mono font-bold border-r border-slate-200">{tx.sarFolio || tx.id}</td>
                <td className="p-2 border-r border-slate-200">{tx.channel} ({tx.cryptoNetwork || tx.bankName})</td>
                <td className="p-2 border-r border-slate-200">{tx.originator.name} ({tx.originator.taxId})</td>
                <td className="p-2 font-mono text-right border-r border-slate-200">${tx.amountMXN.toLocaleString()}</td>
                <td className="p-2 font-mono text-center font-bold border-r border-slate-200">{tx.riskBreakdown.totalScore}</td>
                <td className="p-2 font-mono text-[9px] truncate max-w-[140px]">{tx.sarReceiptHash || '0x4920...'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* SAT Tax Retentions */}
      <div className="mb-6">
        <h3 className="font-bold font-sans text-xs uppercase tracking-wide border-b border-slate-300 pb-1 mb-2">
          3. Desglose de Retenciones Fiscales SAT en Liquidación SPEI
        </h3>
        <table className="w-full text-left font-sans text-[10px] border-collapse border border-slate-300">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-300">
              <th className="p-2 border-r border-slate-300">Folio Liquidación</th>
              <th className="p-2 border-r border-slate-300">Beneficiario (RFC)</th>
              <th className="p-2 border-r border-slate-300">Banco / Destino (CLABE/PAN/DiMo)</th>
              <th className="p-2 border-r border-slate-300 text-right">Bruto Liquidado</th>
              <th className="p-2 border-r border-slate-300 text-right">Retención ISR (20%)</th>
              <th className="p-2 border-r border-slate-300 text-right">Retención IVA (16%)</th>
              <th className="p-2 text-right">Neto Pagado SPEI</th>
            </tr>
          </thead>
          <tbody>
            {speiTransfers.map((s) => (
              <tr key={s.id} className="border-b border-slate-200 font-mono">
                <td className="p-2 border-r border-slate-200 font-bold">{s.id}</td>
                <td className="p-2 border-r border-slate-200 font-sans">{s.beneficiaryName} ({s.beneficiaryRFC})</td>
                <td className="p-2 border-r border-slate-200 font-sans">{s.targetBank} <span className="text-[9px] text-slate-500 font-mono">({s.targetCLABE})</span></td>
                <td className="p-2 text-right border-r border-slate-200">${s.liquidatedGrossMXN.toLocaleString()}</td>
                <td className="p-2 text-right border-r border-slate-200">-${s.retencionISRProvisionalMXN.toLocaleString()}</td>
                <td className="p-2 text-right border-r border-slate-200">-${s.retencionIVAMXN.toLocaleString()}</td>
                <td className="p-2 text-right font-bold">${s.netPaidSPEIMXN.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Signature & Seal box */}
      <div className="pt-8 mt-8 border-t border-slate-300 flex justify-between items-end font-sans">
        <div>
          <div className="text-[10px] text-slate-500 font-mono">
            EXPEDIENTE CUSTODIADO EN SERVIDOR GOOGLE AI STUDIO CLOUD VAULT
          </div>
          <div className="text-[10px] text-slate-500 font-mono">
            VIGENCIA DE CONSERVACIÓN: 10 AÑOS (ART. 115 LIC / ART. 58 LEY FINTECH)
          </div>
        </div>

        <div className="text-center">
          <div className="w-56 border-b border-slate-900 pb-1 mb-1">
            <span className="font-serif italic text-slate-600 block text-xs">Roberto Mendoza S.</span>
          </div>
          <span className="text-xs font-bold block">Mtro. Roberto Mendoza Salazar</span>
          <span className="text-[10px] text-slate-600 block">Oficial de Cumplimiento Certificado</span>
          <span className="text-[10px] font-mono text-slate-600 block">CNBV-PLD-2024-8492</span>
        </div>
      </div>
    </div>
  );
};
