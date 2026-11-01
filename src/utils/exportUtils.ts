import * as XLSX from 'xlsx';
import { SpeiTransferRecord, Transaction } from '../types/aml';

export function exportTransactionsToExcel(
  transactions: Transaction[],
  speiTransfers: SpeiTransferRecord[],
  fileName: string = 'AMLanfat_Expediente_Fiscalizacion_CNBV_UIF.xlsx'
) {
  const wb = XLSX.utils.book_new();

  // Tab 1: Monitoreo Integral AML
  const txRows = transactions.map((t) => ({
    'ID Transacción': t.id,
    'Fecha / Hora': t.timestamp,
    'Canal': t.channel,
    'Red Cripto / Banco': t.cryptoNetwork || t.bankName || 'N/A',
    'Remitente': t.originator.name,
    'RFC / Tax ID': t.originator.taxId,
    'Nivel KYC': t.originator.kycTier,
    'País': t.originator.jurisdiction,
    'Es PEP': t.originator.isPEP ? 'SÍ' : 'NO',
    'Monto Original': t.amount,
    'Moneda': t.currency,
    'Monto en MXN': t.amountMXN,
    'Score Total (0-1000)': t.riskBreakdown.totalScore,
    'Nivel de Riesgo': t.riskLevel,
    'Comisión AML (%)': `${t.feeBreakdown?.feePercentage || 1.8}%`,
    'Categoría Arancelaria': t.feeBreakdown?.feeCategoryLabel || 'Procesamiento Estándar (1.8%)',
    'Comisión Cobrada MXN': t.feeBreakdown?.feeAmountMXN || Math.round(t.amountMXN * 0.018),
    'Neto Liquidado MXN': t.feeBreakdown?.netDisbursedMXN || Math.round(t.amountMXN * 0.982),
    'Retención Preventiva (8%)': t.feeBreakdown?.isTemporaryHold ? 'SÍ (8%)' : 'NO',
    'Decomiso Oficial (20%)': t.feeBreakdown?.isSeized ? 'SÍ (20%)' : 'NO',
    'Pitufeo (Max 200)': t.riskBreakdown.structuringScore,
    'Mixers / Taint (Max 250)': t.riskBreakdown.mixerDarknetScore,
    'Sanciones / OFAC (Max 250)': t.riskBreakdown.sanctionsScore,
    'Velocidad (Max 150)': t.riskBreakdown.velocityScore,
    'Incongruencia KYC (Max 150)': t.riskBreakdown.kycDiscrepancyScore,
    'Estatus SAR': t.sarStatus,
    'Folio SAR UIF': t.sarFolio || 'N/A',
    'Clave Rastreo / TxHash': t.trackingKey,
    'Alertas Detectadas': t.riskBreakdown.flags.join(' | ')
  }));
  const wsTx = XLSX.utils.json_to_sheet(txRows);
  XLSX.utils.book_append_sheet(wb, wsTx, 'Monitoreo AML (0-1000)');

  // Tab 2: Reportes SAR UIF / CenFi / GAFI
  const sarTxs = transactions.filter((t) => t.riskBreakdown.totalScore >= 800 || t.sarStatus !== 'NONE');
  const sarRows = sarTxs.map((t) => ({
    'Folio Oficial SAR': t.sarFolio || `UIF-PEND-${t.id}`,
    'ID Transacción': t.id,
    'Score Riesgo Reprobable': t.riskBreakdown.totalScore,
    'Estatus Transmisión': t.sarStatus,
    'Fecha Despacho': t.sarDispatchTimestamp || t.timestamp,
    'Sujeto Obligado': 'AMLANFAT OPERADORA FINTECH S.A.P.I.',
    'Oficial Certificado': 'Mtro. Roberto Mendoza Salazar (CNBV-PLD-2024-8492)',
    'Canal': t.channel,
    'Monto MXN': t.amountMXN,
    'Remitente': t.originator.name,
    'RFC': t.originator.taxId,
    'Sello Criptográfico SHA-256': t.sarReceiptHash || '0x4982fae109849281a0b3',
    'Motivo de Reprobación': t.riskBreakdown.flags.join('; ')
  }));
  const wsSar = XLSX.utils.json_to_sheet(sarRows.length ? sarRows : [{ 'Aviso': 'Sin operaciones reprobables registradas' }]);
  XLSX.utils.book_append_sheet(wb, wsSar, 'Reportes SAR (UIF-CenFi-GAFI)');

  // Tab 3: Liquidaciones SPEI y Retenciones SAT
  const speiRows = speiTransfers.map((s) => ({
    'Folio Liquidación': s.id,
    'Fecha / Hora': s.timestamp,
    'Beneficiario': s.beneficiaryName,
    'RFC': s.beneficiaryRFC,
    'Banco Receptor': s.targetBank,
    'Formato Destino SPEI': s.accountFormat === 'PAN_16' ? 'Tarjeta PAN (16 dígitos)' : (s.accountFormat === 'DIMO_10' ? 'DiMo Banxico Celular (10 dígitos)' : 'CLABE Interbancaria (18 dígitos)'),
    'Cuenta / Identificador Destino': s.targetCLABE,
    'Activo Virtual Liquidado': `${s.grossAmountCrypto} ${s.cryptoSymbol}`,
    'Monto Bruto Liquidado MXN': s.liquidatedGrossMXN,
    'Base Gravable SAT MXN': s.baseGravableMXN,
    'Retención Provisional ISR (20%)': s.retencionISRProvisionalMXN,
    'Retención IVA (16%)': s.retencionIVAMXN,
    'Monto Neto Transferido SPEI': s.netPaidSPEIMXN,
    'Folio CEP Banxico': s.cepFolio,
    'Certificado Auditoría SHA': s.auditCertificateHash
  }));
  const wsSpei = XLSX.utils.json_to_sheet(speiRows.length ? speiRows : [{ 'Aviso': 'Sin liquidaciones SPEI procesadas' }]);
  XLSX.utils.book_append_sheet(wb, wsSpei, 'Liquidación SPEI y Retención SAT');

  // Tab 4: Aranceles, Retenciones Temporales (8%) y Decomisos (20%)
  const feeRows = transactions.map((t) => ({
    'ID Transacción': t.id,
    'Fecha': t.timestamp,
    'Canal': t.channel,
    'Monto Operación MXN': t.amountMXN,
    'Score Riesgo': t.riskBreakdown.totalScore,
    'Nivel Riesgo': t.riskLevel,
    'Tarifa Aplicada (%)': `${t.feeBreakdown?.feePercentage || 1.8}%`,
    'Categoría': t.feeBreakdown?.feeCategoryLabel || 'Procesamiento Estándar',
    'Comisión Retenida MXN': t.feeBreakdown?.feeAmountMXN || Math.round(t.amountMXN * 0.018),
    'Neto Entregado MXN': t.feeBreakdown?.netDisbursedMXN || Math.round(t.amountMXN * 0.982),
    'Estatus Retención': t.feeBreakdown?.isTemporaryHold ? 'RETENCIÓN TEMPORAL (8%)' : (t.feeBreakdown?.isSeized ? 'DECOMISO EJECUTADO (20%)' : 'DISPERSADO'),
    'Causa o Folio Legal': t.feeBreakdown?.holdReason || t.feeBreakdown?.seizureNoticeFolio || 'Operación regular aprobada'
  }));
  const wsFees = XLSX.utils.json_to_sheet(feeRows);
  XLSX.utils.book_append_sheet(wb, wsFees, 'Aranceles, Retenciones y Decomisos');

  XLSX.writeFile(wb, fileName);
}

export function downloadJsonFile(data: object, filename: string) {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function triggerPrintAuditSheet() {
  window.print();
}
