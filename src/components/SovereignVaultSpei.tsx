import React, { useState, useEffect } from 'react';
import { AssetConversionRecord, BiometricVerificationRecord, SpeiTransferRecord, Transaction, VaultBalances, AccountFormatType } from '../types/aml';
import { 
  MEXICAN_BANKS_CATALOG, 
  MexicanBankInfo, 
  validateMexicanCLABE, 
  validateMexicanPAN, 
  validateMexicanDiMo, 
  formatAccountDisplay, 
  validateDestinationAccount,
  FEATURED_PAN_VISA_PRESETS,
  FEATURED_DIMO_PHONE_PRESETS
} from '../utils/mexicanBanks';
import { loadApiKey, saveApiKey, loadConversionHistory, saveConversionHistory } from '../utils/storage';
import { 
  Wallet, 
  Key, 
  ArrowRightLeft, 
  Building2, 
  ShieldCheck, 
  Copy, 
  Check, 
  RefreshCw, 
  FileText, 
  Scale, 
  Coins,
  SendHorizontal,
  ScanFace,
  Search,
  Sparkles,
  CheckCircle2,
  ChevronDown,
  Info,
  DollarSign,
  Lock,
  ExternalLink,
  Percent,
  Gavel,
  HardDrive,
  Database,
  CreditCard,
  Smartphone
} from 'lucide-react';

interface SovereignVaultSpeiProps {
  speiTransfers: SpeiTransferRecord[];
  transactions?: Transaction[];
  vaultBalances: VaultBalances;
  onUpdateVaultBalances: React.Dispatch<React.SetStateAction<VaultBalances>>;
  onExecuteSpeiTransfer: (transfer: Omit<SpeiTransferRecord, 'id' | 'timestamp' | 'status' | 'cepFolio' | 'auditCertificateHash'> & { biometricAuth?: BiometricVerificationRecord }) => void;
  onResetVaultBalances?: () => void;
}

export type SupportedAsset = 'MXN' | 'USDT' | 'USDC' | 'BTC' | 'ETH' | 'SOL' | 'TRX';

export const SovereignVaultSpei: React.FC<SovereignVaultSpeiProps> = ({
  speiTransfers,
  transactions = [],
  vaultBalances,
  onUpdateVaultBalances,
  onExecuteSpeiTransfer,
  onResetVaultBalances
}) => {
  // Vault state & API Key (persisted)
  const [apiKey, setApiKey] = useState(() => loadApiKey());
  const [copiedKey, setCopiedKey] = useState(false);
  const [showKey, setShowKey] = useState(false);

  // Alias for compatibility with existing updater calls
  const setVaultBalances = onUpdateVaultBalances;

  // Real-time fee revenue calculations
  const totalFeesRecaudadas = (transactions || []).reduce(
    (sum, t) => sum + (t.feeBreakdown?.feeAmountMXN || Math.round(t.amountMXN * 0.018)),
    184500
  );
  const fees1_8 = (transactions || []).filter(t => !t.feeBreakdown?.isTemporaryHold && !t.feeBreakdown?.isSeized && (t.feeBreakdown?.feePercentage === 1.8 || !t.feeBreakdown)).reduce((sum, t) => sum + (t.feeBreakdown?.feeAmountMXN || Math.round(t.amountMXN * 0.018)), 45200);
  const fees2_5 = (transactions || []).filter(t => !t.feeBreakdown?.isTemporaryHold && !t.feeBreakdown?.isSeized && t.feeBreakdown?.feePercentage === 2.5).reduce((sum, t) => sum + (t.feeBreakdown?.feeAmountMXN || Math.round(t.amountMXN * 0.025)), 68300);
  const fees8_0 = (transactions || []).filter(t => t.feeBreakdown?.isTemporaryHold || t.feeBreakdown?.feePercentage === 8.0).reduce((sum, t) => sum + (t.feeBreakdown?.feeAmountMXN || Math.round(t.amountMXN * 0.08)), 22000);
  const fees20_0 = (transactions || []).filter(t => t.feeBreakdown?.isSeized || t.feeBreakdown?.feePercentage === 20.0).reduce((sum, t) => sum + (t.feeBreakdown?.feeAmountMXN || Math.round(t.amountMXN * 0.20)), 49000);

  // Exchange rates to MXN (Real-time Mexican Peso FX Oracle)
  const exchangeRates = {
    MXN: 1,
    USDT: 19.85,
    USDC: 19.85,
    BTC: 1850000,
    ETH: 58200,
    SOL: 3450,
    TRX: 4.85
  };

  // Conversion Tool State (persisted conversion history)
  const [convertFromAsset, setConvertFromAsset] = useState<'USDT' | 'USDC' | 'BTC' | 'ETH' | 'SOL' | 'TRX'>('USDT');
  const [convertAmount, setConvertAmount] = useState<string>('5000');
  const [conversionFeedback, setConversionFeedback] = useState<string | null>(null);
  const [autoConvertActive, setAutoConvertActive] = useState<boolean>(true);
  const [conversionHistory, setConversionHistory] = useState<AssetConversionRecord[]>(() => loadConversionHistory());

  // Automatically persist conversion history upon each change
  useEffect(() => {
    saveConversionHistory(conversionHistory);
  }, [conversionHistory]);

  // Form state for SPEI off-ramp
  const [fundSource, setFundSource] = useState<'CRYPTO' | 'MXN_VAULT'>('CRYPTO');
  const [selectedCrypto, setSelectedCrypto] = useState<'USDT' | 'USDC' | 'BTC' | 'ETH' | 'SOL' | 'TRX'>('USDT');
  const [cryptoAmount, setCryptoAmount] = useState<string>('5000');
  const [mxnDirectAmount, setMxnDirectAmount] = useState<string>('65000');
  const [beneficiaryName, setBeneficiaryName] = useState('CORPORATIVO DE COBRO Y FISCALIZACIÓN S.A. DE C.V.');
  const [beneficiaryRFC, setBeneficiaryRFC] = useState('CCF1908239A1');
  const [accountFormat, setAccountFormat] = useState<AccountFormatType>('CLABE_18');
  const [targetAccount, setTargetAccount] = useState('012180001234567890');
  const [targetBank, setTargetBank] = useState('BBVA México (012)');
  const [dimoLinkedBank, setDimoLinkedBank] = useState<string>('166');
  const [accountValidationMsg, setAccountValidationMsg] = useState<{ isValid: boolean; text?: string }>({ 
    isValid: true, 
    text: 'CLABE interbancaria válida en la red SPEI de Banxico.' 
  });
  
  // Bank search & dropdown modal
  const [isBankSelectorOpen, setIsBankSelectorOpen] = useState(false);
  const [bankSearchQuery, setBankSearchQuery] = useState('');
  const [bankFilterType, setBankFilterType] = useState<string>('ALL');

  // Inspection modal for historical SPEI CEP
  const [inspectedTransfer, setInspectedTransfer] = useState<SpeiTransferRecord | null>(null);
  const [transferFeedback, setTransferFeedback] = useState<string | null>(null);

  // Global modal close listener for superposed Back button & Escape key
  useEffect(() => {
    const handleClose = () => {
      setIsBankSelectorOpen(false);
      setInspectedTransfer(null);
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('amlanfat:close_active_modal', handleClose);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('amlanfat:close_active_modal', handleClose);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Consolidated total portfolio valuation in MXN
  const totalPortfolioMXN = 
    vaultBalances.MXN +
    vaultBalances.USDT * exchangeRates.USDT +
    vaultBalances.USDC * exchangeRates.USDC +
    vaultBalances.BTC * exchangeRates.BTC +
    vaultBalances.ETH * exchangeRates.ETH +
    vaultBalances.SOL * exchangeRates.SOL +
    vaultBalances.TRX * exchangeRates.TRX;

  // Live SAT tax calculations for SPEI Off-Ramp
  const isFromCrypto = fundSource === 'CRYPTO';
  const parsedAmount = isFromCrypto ? (parseFloat(cryptoAmount) || 0) : (parseFloat(mxnDirectAmount) || 0);
  const unitRate = isFromCrypto ? exchangeRates[selectedCrypto] : 1;
  const grossLiquidatedMXN = isFromCrypto ? parsedAmount * unitRate : parsedAmount;

  // SAT Tax calculation rules (Miscelánea Fiscal / Art. 126 LISR):
  // When digital assets cease to be crypto and become fiat cash, provisional ISR retention applies
  const retencionISR = isFromCrypto ? Math.round(grossLiquidatedMXN * 0.20) : 0; // 20% provisional retention
  const retencionIVA = isFromCrypto ? Math.round(grossLiquidatedMXN * 0.16) : 0; // 16% IVA base
  const netPaidSPEI = Math.max(0, grossLiquidatedMXN - retencionISR - retencionIVA);

  // Format Switch Handler
  const handleFormatChange = (fmt: AccountFormatType) => {
    setAccountFormat(fmt);
    if (fmt === 'CLABE_18') {
      const val = '012180001234567890';
      setTargetAccount(val);
      setTargetBank('BBVA México (012)');
      setAccountValidationMsg({ isValid: true, text: 'CLABE interbancaria (18 dígitos) válida en la red SPEI de Banxico.' });
    } else if (fmt === 'PAN_16') {
      const val = '4037561234567899'; // Banco del Bienestar Visa Débito
      setTargetAccount(val);
      setTargetBank('Banco del Bienestar · Visa Débito');
      setAccountValidationMsg({ isValid: true, text: 'Tarjeta PAN VISA (16 dígitos) de Banco del Bienestar validada con algoritmo Luhn.' });
    } else if (fmt === 'DIMO_10') {
      const val = '5570164820'; // Banco del Bienestar Celular DiMo
      setTargetAccount(val);
      setDimoLinkedBank('166');
      setTargetBank('Banco del Bienestar · DiMo (CDMX · Padrón Bienestar)');
      setAccountValidationMsg({ isValid: true, text: 'Número celular DiMo (10 dígitos) registrado para abono SPEI en Banco del Bienestar.' });
    }
  };

  // Multi-format Account Input Handling (CLABE 18d, PAN 16d, DiMo 10d)
  const handleAccountInputChange = (val: string) => {
    const cleanDigits = val.replace(/\D/g, '');
    let clean = cleanDigits;
    if (accountFormat === 'CLABE_18') {
      clean = cleanDigits.slice(0, 18);
    } else if (accountFormat === 'PAN_16') {
      clean = cleanDigits.slice(0, 16);
    } else if (accountFormat === 'DIMO_10') {
      clean = cleanDigits.slice(0, 10);
    }
    setTargetAccount(clean);

    if (accountFormat === 'CLABE_18') {
      if (clean.length >= 3) {
        const result = validateMexicanCLABE(clean);
        if (result.bank) {
          setTargetBank(`${result.bank.shortName} (${result.bank.code})`);
        }
        if (clean.length === 18) {
          setAccountValidationMsg({
            isValid: result.isValid,
            text: result.error || 'CLABE interbancaria (18 dígitos) verificada en el catálogo SPEI de Banxico.'
          });
        } else {
          setAccountValidationMsg({
            isValid: false,
            text: `Faltan ${18 - clean.length} dígitos para completar los 18 dígitos reglamentarios de la CLABE.`
          });
        }
      } else {
        setAccountValidationMsg({ isValid: false, text: undefined });
      }
    } else if (accountFormat === 'PAN_16') {
      if (clean.length >= 4) {
        const result = validateMexicanPAN(clean);
        if (result.bank) {
          setTargetBank(`${result.bank.shortName} · ${result.cardNetwork}`);
        } else {
          setTargetBank(`${result.cardNetwork}`);
        }
        if (clean.length === 16) {
          setAccountValidationMsg({
            isValid: result.isValid,
            text: result.error || `Tarjeta PAN 16 dígitos (${result.cardNetwork} - ${result.bank?.shortName || 'Emisor'}) verificada con algoritmo Luhn.`
          });
        } else {
          setAccountValidationMsg({
            isValid: false,
            text: `Faltan ${16 - clean.length} dígitos para completar los 16 dígitos de la tarjeta (PAN).`
          });
        }
      } else {
        setAccountValidationMsg({ isValid: false, text: undefined });
      }
    } else if (accountFormat === 'DIMO_10') {
      const result = validateMexicanDiMo(clean, dimoLinkedBank);
      const bankLabel = result.bank ? result.bank.shortName : 'DiMo Banxico';
      if (clean.length === 10) {
        setTargetBank(`${bankLabel} · DiMo (${result.region || 'Nacional'})`);
        setAccountValidationMsg({
          isValid: result.isValid,
          text: result.error || `Línea móvil DiMo (10 dígitos) validada y vinculada a ${bankLabel} (${result.region}) para recepción SPEI.`
        });
      } else {
        setAccountValidationMsg({
          isValid: false,
          text: `Faltan ${10 - clean.length} dígitos para completar los 10 dígitos del número telefónico celular DiMo.`
        });
      }
    }
  };

  const handleSelectBank = (bank: MexicanBankInfo) => {
    setTargetBank(`${bank.shortName} (${bank.code})`);
    if (accountFormat === 'CLABE_18') {
      if (!targetAccount || targetAccount.length < 3) {
        setTargetAccount(bank.code);
      } else {
        setTargetAccount(bank.code + targetAccount.slice(3));
      }
    }
    setIsBankSelectorOpen(false);
  };

  const handleCopyApiKey = () => {
    navigator.clipboard.writeText(apiKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleRotateApiKey = () => {
    const randomHex = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
    const newKey = `sk_live_amlanfat_${randomHex}`;
    setApiKey(newKey);
    saveApiKey(newKey);
  };

  // Convert Asset to MXN in Sovereign Vault
  const handleExecuteConversionToMXN = () => {
    const amt = parseFloat(convertAmount) || 0;
    const currentBalance = vaultBalances[convertFromAsset];

    if (amt <= 0) return;
    if (amt > currentBalance) {
      setConversionFeedback(`Saldo insuficiente de ${convertFromAsset}. Saldo disponible: ${currentBalance}`);
      setTimeout(() => setConversionFeedback(null), 4000);
      return;
    }

    const rate = exchangeRates[convertFromAsset];
    const grossMXN = amt * rate;
    const txHash = `0x${Math.random().toString(16).substring(2)}${Math.random().toString(16).substring(2)}a1b9`.slice(0, 66);

    // Update balances: deduct crypto, credit MXN
    setVaultBalances((prev) => ({
      ...prev,
      [convertFromAsset]: Math.max(0, +(prev[convertFromAsset] - amt).toFixed(6)),
      MXN: Math.round(prev.MXN + grossMXN)
    }));

    const record: AssetConversionRecord = {
      id: `CNV-2026-${Math.floor(100 + Math.random() * 900)}`,
      timestamp: new Date().toISOString(),
      fromAsset: convertFromAsset,
      fromAmount: amt,
      exchangeRateMXN: rate,
      grossAmountMXN: grossMXN,
      spreadCostMXN: 0,
      netCreditedMXN: grossMXN,
      targetVault: 'BÓVEDA_SOBERANA_MXN',
      txHash
    };

    setConversionHistory((prev) => [record, ...prev]);
    setConversionFeedback(`¡Conversión completada! Se resguardaron $${grossMXN.toLocaleString()} MXN en la Bóveda Soberana.`);
    setTimeout(() => setConversionFeedback(null), 5000);
  };

  // Convert All Non-MXN Assets to MXN with 1-click
  const handleConvertAllToMXN = () => {
    let totalCreditedMXN = 0;
    const assets: Array<'USDT' | 'USDC' | 'BTC' | 'ETH' | 'SOL' | 'TRX'> = ['USDT', 'USDC', 'BTC', 'ETH', 'SOL', 'TRX'];
    
    assets.forEach((sym) => {
      const bal = vaultBalances[sym];
      if (bal > 0) {
        totalCreditedMXN += bal * exchangeRates[sym];
      }
    });

    if (totalCreditedMXN === 0) {
      setConversionFeedback('Todos los activos ya se encuentran resguardados en MXN.');
      setTimeout(() => setConversionFeedback(null), 3000);
      return;
    }

    setVaultBalances((prev) => ({
      ...prev,
      MXN: Math.round(prev.MXN + totalCreditedMXN),
      USDT: 0,
      USDC: 0,
      BTC: 0,
      ETH: 0,
      SOL: 0,
      TRX: 0
    }));

    const record: AssetConversionRecord = {
      id: `CNV-ALL-2026-${Math.floor(100 + Math.random() * 900)}`,
      timestamp: new Date().toISOString(),
      fromAsset: 'USDT',
      fromAmount: 1,
      exchangeRateMXN: 19.85,
      grossAmountMXN: totalCreditedMXN,
      spreadCostMXN: 0,
      netCreditedMXN: totalCreditedMXN,
      targetVault: 'BÓVEDA_SOBERANA_MXN',
      txHash: `0xall_liquidated_${Math.random().toString(16).substring(2)}`
    };

    setConversionHistory((prev) => [record, ...prev]);
    setConversionFeedback(`¡Conversión Global Exitosa! $${totalCreditedMXN.toLocaleString()} MXN resguardados en custodia soberana.`);
    setTimeout(() => setConversionFeedback(null), 5000);
  };

  // Direct SPEI Transfer Execution without biometric authorization requirement
  const handleInitiateSpeiTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedAmount <= 0) return;
    
    if (accountFormat === 'CLABE_18' && targetAccount.length !== 18) {
      alert('La CLABE interbancaria debe contar con exactamente 18 dígitos según el estándar de Banxico.');
      return;
    }
    if (accountFormat === 'PAN_16' && targetAccount.length !== 16) {
      alert('El número de tarjeta PAN debe contar con exactamente 16 dígitos numéricos.');
      return;
    }
    if (accountFormat === 'DIMO_10' && targetAccount.length !== 10) {
      alert('El identificador DiMo de Banxico debe contar con exactamente 10 dígitos numéricos del celular.');
      return;
    }

    // Verify balance
    if (isFromCrypto && parsedAmount > vaultBalances[selectedCrypto]) {
      alert(`Saldo insuficiente en bóveda de ${selectedCrypto}.`);
      return;
    }
    if (!isFromCrypto && parsedAmount > vaultBalances.MXN) {
      alert('Saldo insuficiente en la Reserva Soberana en MXN.');
      return;
    }

    // Deduct balance directly from vault
    if (isFromCrypto) {
      setVaultBalances((prev) => ({
        ...prev,
        [selectedCrypto]: Math.max(0, +(prev[selectedCrypto] - parsedAmount).toFixed(6))
      }));
    } else {
      setVaultBalances((prev) => ({
        ...prev,
        MXN: Math.max(0, prev.MXN - parsedAmount)
      }));
    }

    // Execute transfer directly
    onExecuteSpeiTransfer({
      beneficiaryName,
      beneficiaryRFC,
      accountFormat,
      targetCLABE: targetAccount,
      targetBank,
      grossAmountCrypto: isFromCrypto ? parsedAmount : 0,
      cryptoSymbol: isFromCrypto ? selectedCrypto : 'MXN',
      liquidatedGrossMXN: grossLiquidatedMXN,
      baseGravableMXN: grossLiquidatedMXN,
      retencionISRProvisionalMXN: retencionISR,
      retencionIVAMXN: retencionIVA,
      netPaidSPEIMXN: netPaidSPEI
    });

    setTransferFeedback(`Transferencia SPEI por $${netPaidSPEI.toLocaleString()} MXN procesada y dispersada exitosamente a ${targetBank}.`);
    setTimeout(() => setTransferFeedback(null), 6000);
  };

  // Filtered bank list for bank selector
  const filteredBanks = MEXICAN_BANKS_CATALOG.filter((bank) => {
    const q = bankSearchQuery.toLowerCase().trim();
    const matchesQ = !q || 
      bank.name.toLowerCase().includes(q) ||
      bank.shortName.toLowerCase().includes(q) ||
      bank.code.includes(q);

    if (!matchesQ) return false;
    if (bankFilterType === 'BANCA_MULTIPLE') return bank.type === 'BANCA_MULTIPLE';
    if (bankFilterType === 'FINTECH_IFPE') return bank.type === 'FINTECH_IFPE' || bank.type === 'SOFIPO';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Total Consolidated Valuation Banner in MXN */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/70 border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-950 border border-emerald-500/40 text-emerald-400">
                <Wallet className="w-5 h-5" />
              </span>
              <h1 className="text-base font-bold text-white tracking-tight">
                Billetera de Resguardo Soberana · Conversión a Activos MXN
              </h1>
              <span className="text-[11px] text-emerald-400 bg-emerald-950/80 border border-emerald-700/60 px-2 py-0.5 rounded-full font-mono">
                Cold Custody Multi-Activo (Sin Banco)
              </span>
            </div>

            <div className="flex flex-wrap items-baseline gap-3">
              <span className="text-xs text-slate-400">Patrimonio Total Consolidado en MXN:</span>
              <span className="text-3xl font-extrabold font-mono text-emerald-400 tabular-nums">
                ${totalPortfolioMXN.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-sm font-normal text-emerald-300">MXN</span>
              </span>
            </div>

            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              Custodia descentralizada de ganancias del motor de riesgo. Convierte automáticamente cualquier criptodivisa a pesos mexicanos (MXN) para su resguardo soberano y liquidación fiscal mediante SPEI a cualquier banco mexicano.
            </p>
          </div>

          {/* Right API Key box & Quick Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 flex items-center justify-between gap-3 text-xs font-mono">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-400 block font-sans">API Key Institucional:</span>
                  <span className="text-slate-200 select-all font-mono">
                    {showKey ? apiKey : `${apiKey.slice(0, 16)}••••••••`}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setShowKey(!showKey)}
                  className="text-slate-400 hover:text-white text-[11px] px-1.5 py-0.5 rounded hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  {showKey ? 'Ocultar' : 'Ver'}
                </button>
                <button
                  onClick={handleCopyApiKey}
                  className="p-1 hover:text-white text-slate-400 rounded hover:bg-slate-800 cursor-pointer"
                  title="Copiar API Key"
                >
                  {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={handleRotateApiKey}
                  className="p-1 hover:text-cyan-300 text-slate-400 rounded hover:bg-slate-800 cursor-pointer"
                  title="Regenerar / Rotar API Key"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-2 bg-emerald-950/70 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs font-mono">
                <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Memoria Persistente:</span>
                <span className="font-bold text-white">ACTIVA</span>
              </div>

              <button
                onClick={handleConvertAllToMXN}
                className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 shrink-0"
                title="Convertir todas las criptomonedas a pesos mexicanos para resguardo soberano"
              >
                <ArrowRightLeft className="w-4 h-4" />
                <span>Convertir Todo a MXN</span>
              </button>

              {onResetVaultBalances && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('¿Deseas restablecer los saldos a los valores iniciales predeterminados? Esta acción es solo para fines de demostración.')) {
                      onResetVaultBalances();
                    }
                  }}
                  className="px-3 py-2 bg-slate-950 hover:bg-slate-800 border border-slate-700/80 text-slate-400 hover:text-slate-200 text-xs rounded-xl cursor-pointer transition-colors"
                  title="Restablecer saldos a los valores iniciales de prueba"
                >
                  Restablecer
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Segregated Balances Breakdown */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 pt-5 mt-5 border-t border-slate-800/80">
          {/* MXN Sovereign Reserve */}
          <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-700/50 shadow-sm col-span-2 sm:col-span-1">
            <span className="text-[10px] text-emerald-300 font-semibold uppercase tracking-wider block">Reserva Bóveda MXN</span>
            <div className="mt-1 font-mono">
              <span className="text-xl font-extrabold text-white tabular-nums">
                ${vaultBalances.MXN.toLocaleString()}
              </span>
              <span className="text-[11px] text-emerald-400 ml-1">MXN</span>
            </div>
            <span className="text-[10px] text-emerald-400/80 block mt-0.5">Listo para SPEI / SAT</span>
          </div>

          {/* USDT */}
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-medium">Tether (USDT)</span>
            <div className="mt-0.5 font-mono">
              <span className="text-base font-bold text-white tabular-nums">
                {vaultBalances.USDT.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-400 ml-1">USDT</span>
            </div>
            <span className="text-[10px] text-emerald-400 font-mono block">≈ ${(vaultBalances.USDT * exchangeRates.USDT).toLocaleString()} MXN</span>
          </div>

          {/* USDC */}
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-medium">USD Coin (USDC)</span>
            <div className="mt-0.5 font-mono">
              <span className="text-base font-bold text-white tabular-nums">
                {vaultBalances.USDC.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-400 ml-1">USDC</span>
            </div>
            <span className="text-[10px] text-emerald-400 font-mono block">≈ ${(vaultBalances.USDC * exchangeRates.USDC).toLocaleString()} MXN</span>
          </div>

          {/* BTC */}
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-medium">Bitcoin (BTC)</span>
            <div className="mt-0.5 font-mono">
              <span className="text-base font-bold text-amber-400 tabular-nums">
                {vaultBalances.BTC}
              </span>
              <span className="text-[10px] text-slate-400 ml-1">BTC</span>
            </div>
            <span className="text-[10px] text-emerald-400 font-mono block">≈ ${(vaultBalances.BTC * exchangeRates.BTC).toLocaleString()} MXN</span>
          </div>

          {/* ETH */}
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-medium">Ethereum (ETH)</span>
            <div className="mt-0.5 font-mono">
              <span className="text-base font-bold text-sky-400 tabular-nums">
                {vaultBalances.ETH}
              </span>
              <span className="text-[10px] text-slate-400 ml-1">ETH</span>
            </div>
            <span className="text-[10px] text-emerald-400 font-mono block">≈ ${(vaultBalances.ETH * exchangeRates.ETH).toLocaleString()} MXN</span>
          </div>

          {/* SOL */}
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-medium">Solana (SOL)</span>
            <div className="mt-0.5 font-mono">
              <span className="text-base font-bold text-purple-400 tabular-nums">
                {vaultBalances.SOL}
              </span>
              <span className="text-[10px] text-slate-400 ml-1">SOL</span>
            </div>
            <span className="text-[10px] text-emerald-400 font-mono block">≈ ${(vaultBalances.SOL * exchangeRates.SOL).toLocaleString()} MXN</span>
          </div>

          {/* TRX */}
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-medium">Tron (TRX)</span>
            <div className="mt-0.5 font-mono">
              <span className="text-base font-bold text-rose-400 tabular-nums">
                {vaultBalances.TRX.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-400 ml-1">TRX</span>
            </div>
            <span className="text-[10px] text-emerald-400 font-mono block">≈ ${(vaultBalances.TRX * exchangeRates.TRX).toLocaleString()} MXN</span>
          </div>
        </div>
      </div>

      {/* Recaudación Arancelaria de Comisiones AMLanfat en Bóveda Soberana */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-950 border border-indigo-600/40 text-indigo-400">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Ganancias & Comisiones del Motor AMLanfat Resguardadas en Bóveda</span>
                <span className="text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-700/50 px-2 py-0.2 rounded-full font-mono">
                  Custodia Descentralizada (Sin Banco)
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Estructura arancelaria oficial de recaudación. Los fondos se concentran en la Bóveda Fría Soberana hasta su liquidación SPEI para pago de impuestos.
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[11px] text-slate-400 block">Total Comisiones Recaudadas:</span>
            <span className="text-xl font-bold font-mono text-teal-400 tabular-nums">
              ${totalFeesRecaudadas.toLocaleString()} MXN
            </span>
          </div>
        </div>

        {/* 4 Tariff Tiers Breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* 1.8% Tier */}
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-slate-300 font-semibold">1.8% Transferencia Estándar</span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-1.5 py-0.2 rounded border border-emerald-800/40">Riesgo Bajo</span>
            </div>
            <div className="font-mono text-lg font-bold text-white tabular-nums">
              ${fees1_8.toLocaleString()} <span className="text-xs text-slate-400 font-normal">MXN</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-snug">
              Cargo ordinario por procesamiento nominal de transferencias sin banderas de riesgo.
            </p>
          </div>

          {/* 2.5% Tier */}
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-slate-300 font-semibold">2.5% Riesgo Medio o Alto</span>
              <span className="text-[10px] font-mono text-yellow-400 bg-yellow-950 px-1.5 py-0.2 rounded border border-yellow-800/40">EDD Reforzada</span>
            </div>
            <div className="font-mono text-lg font-bold text-yellow-300 tabular-nums">
              ${fees2_5.toLocaleString()} <span className="text-xs text-slate-400 font-normal">MXN</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-snug">
              Sobretasa aplicada a operaciones con Score de riesgo 300 - 799 sujetas a debida diligencia reforzada.
            </p>
          </div>

          {/* 8.0% Tier */}
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-slate-300 font-semibold">8.0% Retención Preventiva</span>
              <span className="text-[10px] font-mono text-amber-400 bg-amber-950 px-1.5 py-0.2 rounded border border-amber-800/40">Custodia Forense</span>
            </div>
            <div className="font-mono text-lg font-bold text-amber-300 tabular-nums">
              ${fees8_0.toLocaleString()} <span className="text-xs text-slate-400 font-normal">MXN</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-snug">
              Cargo por retención temporal de la liquidación y peritaje analítico por factores de alto riesgo previo a dictamen.
            </p>
          </div>

          {/* 20.0% Tier */}
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-slate-300 font-semibold">20.0% Decomisos Oficiales</span>
              <span className="text-[10px] font-mono text-rose-400 bg-rose-950 px-1.5 py-0.2 rounded border border-rose-800/40">Extinción Dominio</span>
            </div>
            <div className="font-mono text-lg font-bold text-rose-300 tabular-nums">
              ${fees20_0.toLocaleString()} <span className="text-xs text-slate-400 font-normal">MXN</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-snug">
              Honorario legal y pericial por ejecución de decomisos judiciales/regulatorios conforme a Ley Nacional de Extinción de Dominio.
            </p>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Ganancias retenidas en resguardo descentralizado protegido por llave API (<code className="text-slate-300 font-mono">sk_live_...</code>).
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-500 hidden md:block">
            Dispersión vía SPEI con timbrado SAT disponible
          </span>
        </div>
      </div>

      {/* Real-time FX Oracle & Instant Asset-to-MXN Conversion Center */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-teal-950 border border-teal-600/40 text-teal-400">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Oráculo de Conversión y Resguardo de Activos en MXN</span>
                <span className="text-[10px] bg-teal-950 text-teal-300 border border-teal-700/50 px-2 py-0.2 rounded-full font-mono">
                  Spread 0% · Bóveda Cero Comisión
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Convierte cualquier activo virtual a pesos mexicanos en tiempo real para resguardarlo sin necesidad de intermediario bancario.
              </p>
            </div>
          </div>

          {/* Auto-conversion toggle */}
          <div className="flex items-center gap-2.5 text-xs bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
            <span className="text-slate-300 text-[11px]">Auto-convertir ganancias a MXN:</span>
            <button
              onClick={() => setAutoConvertActive(!autoConvertActive)}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                autoConvertActive ? 'bg-emerald-500' : 'bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  autoConvertActive ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {conversionFeedback && (
          <div className="p-3 rounded-xl bg-teal-950/60 border border-teal-800/80 text-xs text-teal-300 flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
            <span>{conversionFeedback}</span>
          </div>
        )}

        {/* Conversion Calculator Bar */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          {/* Asset Selector */}
          <div className="md:col-span-4 space-y-1.5">
            <label className="text-slate-300 text-xs font-medium block">Activo a Convertir:</label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
              {(['USDT', 'USDC', 'BTC', 'ETH', 'SOL', 'TRX'] as const).map((sym) => (
                <button
                  key={sym}
                  type="button"
                  onClick={() => {
                    setConvertFromAsset(sym);
                    setConvertAmount(vaultBalances[sym].toString());
                  }}
                  className={`py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                    convertFromAsset === sym
                      ? 'bg-teal-950 border-teal-500 text-teal-300 shadow-sm'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {sym}
                </button>
              ))}
            </div>
          </div>

          {/* Amount Input */}
          <div className="md:col-span-3 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label className="text-slate-300 font-medium">Monto a Convertir:</label>
              <button
                type="button"
                onClick={() => setConvertAmount(vaultBalances[convertFromAsset].toString())}
                className="text-[10px] text-teal-400 hover:underline cursor-pointer"
              >
                Máx ({vaultBalances[convertFromAsset]} {convertFromAsset})
              </button>
            </div>
            <input
              type="number"
              step="any"
              value={convertAmount}
              onChange={(e) => setConvertAmount(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-teal-500"
              placeholder="0.00"
            />
          </div>

          {/* Live Quote & Result */}
          <div className="md:col-span-3 p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1 text-xs">
            <div className="flex justify-between text-slate-400 text-[11px]">
              <span>T.C. Oráculo Oficial:</span>
              <span className="font-mono text-slate-200">${exchangeRates[convertFromAsset].toLocaleString()} MXN</span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-slate-300 font-medium">Acreditar en Bóveda:</span>
              <span className="font-mono font-bold text-teal-400 text-sm">
                +${((parseFloat(convertAmount) || 0) * exchangeRates[convertFromAsset]).toLocaleString('es-MX', { maximumFractionDigits: 2 })} MXN
              </span>
            </div>
          </div>

          {/* Convert Button */}
          <div className="md:col-span-2">
            <button
              onClick={handleExecuteConversionToMXN}
              className="w-full py-2.5 px-3 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>Convertir a MXN</span>
            </button>
          </div>
        </div>
      </div>

      {/* SPEI Off-Ramp to ALL Mexican Banks with Mandatory Biometric Face Verification */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Transfer form */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-cyan-950 border border-cyan-500/40 text-cyan-400">
                <SendHorizontal className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Puente SPEI Fintech a Todos los Bancos Mexicanos</span>
                  <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-700/50 px-2 py-0.2 rounded-full font-mono">
                    Red Completa Banxico (40+ Bancos)
                  </span>
                </h2>
                <p className="text-[11px] text-slate-400">
                  Transferencias directas vía SPEI hacia cualquier cuenta bancaria nacional con validación criptográfica y dispersión directa.
                </p>
              </div>
            </div>

            {/* Direct Authorization Indicator */}
            <div className="hidden sm:flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-950/60 border border-emerald-700/50 px-2.5 py-1 rounded-lg">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Sin Requisito Biométrico · Autorización Directa</span>
            </div>
          </div>

          {transferFeedback && (
            <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-700 text-xs text-emerald-200 flex items-center gap-2 shadow-lg animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{transferFeedback}</span>
            </div>
          )}

          <form onSubmit={handleInitiateSpeiTransfer} className="space-y-4 text-xs">
            {/* Funding Source Selector: Crypto vs MXN Sovereign Reserve */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <label className="text-slate-300 font-semibold block text-xs">Origen de los Fondos a Dispersar:</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFundSource('CRYPTO')}
                  className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                    fundSource === 'CRYPTO'
                      ? 'bg-slate-850 border-cyan-500 text-white shadow-sm'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="font-semibold text-xs flex items-center gap-1.5 text-cyan-300">
                    <Coins className="w-3.5 h-3.5" />
                    <span>Liquidar Activo Cripto</span>
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Con retención fiscal automática SAT (ISR 20% + IVA 16%)
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setFundSource('MXN_VAULT')}
                  className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                    fundSource === 'MXN_VAULT'
                      ? 'bg-slate-850 border-emerald-500 text-white shadow-sm'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="font-semibold text-xs flex items-center gap-1.5 text-emerald-400">
                    <Wallet className="w-3.5 h-3.5" />
                    <span>Desde Reserva Bóveda MXN</span>
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Disponible: ${vaultBalances.MXN.toLocaleString()} MXN
                  </span>
                </button>
              </div>
            </div>

            {/* Asset Selection when funding from Crypto */}
            {fundSource === 'CRYPTO' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-medium block mb-1">Activo Virtual a Liquidar:</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(['USDT', 'USDC', 'BTC', 'ETH', 'SOL', 'TRX'] as const).map((sym) => (
                      <button
                        key={sym}
                        type="button"
                        onClick={() => setSelectedCrypto(sym)}
                        className={`py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                          selectedCrypto === sym
                            ? 'bg-slate-800 border-cyan-500 text-cyan-300'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {sym}
                      </button>
                    ))}
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-1">
                    Disponible: {vaultBalances[selectedCrypto]} {selectedCrypto}
                  </span>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-slate-300 font-medium">Monto de {selectedCrypto}:</label>
                    <button
                      type="button"
                      onClick={() => setCryptoAmount(vaultBalances[selectedCrypto].toString())}
                      className="text-[10px] text-cyan-400 hover:underline cursor-pointer"
                    >
                      Máximo
                    </button>
                  </div>
                  <input
                    type="number"
                    step="any"
                    value={cryptoAmount}
                    onChange={(e) => setCryptoAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-cyan-500"
                    placeholder="0.00"
                    required
                  />
                  <span className="text-[10px] text-slate-400 block mt-1">
                    ≈ ${grossLiquidatedMXN.toLocaleString()} MXN brutos
                  </span>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-slate-300 font-medium">Monto en Pesos Mexicanos (MXN):</label>
                  <button
                    type="button"
                    onClick={() => setMxnDirectAmount(vaultBalances.MXN.toString())}
                    className="text-[10px] text-emerald-400 hover:underline cursor-pointer"
                  >
                    Máx (${vaultBalances.MXN.toLocaleString()} MXN)
                  </button>
                </div>
                <input
                  type="number"
                  step="any"
                  value={mxnDirectAmount}
                  onChange={(e) => setMxnDirectAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                  placeholder="0.00"
                  required
                />
              </div>
            )}

            {/* Whitelist Soberana Shortcut */}
            <div className="p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-800/60 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-cyan-400 shrink-0" />
                <span className="text-slate-300">
                  Destino Propio Autorizado: <strong className="text-cyan-300 font-mono">TOK_MIA_FINAL</strong>
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setBeneficiaryName('TESORERIA SOBERANA SAPI DE CV');
                  setBeneficiaryRFC('CCF1908239A1');
                  setAccountFormat('CLABE_18');
                  setTargetAccount('012180001234567890');
                  setTargetBank('BBVA México (012)');
                  setAccountValidationMsg({
                    isValid: true,
                    text: 'Cuenta Whitelist Soberana TOK_MIA_FINAL (BBVA ****7890) validada por HSM.'
                  });
                }}
                className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-mono text-[11px] font-bold transition-colors cursor-pointer"
              >
                Cargar Cuenta Soberana
              </button>
            </div>

            {/* Beneficiary Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-slate-300 font-medium block mb-1">Nombre o Razón Social Beneficiario:</label>
                <input
                  type="text"
                  value={beneficiaryName}
                  onChange={(e) => setBeneficiaryName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">RFC del Beneficiario:</label>
                <input
                  type="text"
                  value={beneficiaryRFC}
                  onChange={(e) => setBeneficiaryRFC(e.target.value.toUpperCase())}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono uppercase focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>
            </div>

            {/* Format Selector: CLABE 18 dígitos, PAN 16 dígitos, DiMo 10 dígitos */}
            <div className="space-y-3 p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <label className="text-slate-300 font-medium text-xs flex items-center gap-1.5">
                  <span>Formato de Destino SPEI Autorizado:</span>
                </label>
                <span className="text-[10px] text-cyan-400 font-mono">
                  Estándar Banxico · Catálogo SPEI 2026
                </span>
              </div>

              {/* 3 Formats Tab Bar */}
              <div className="grid grid-cols-3 gap-1.5 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => handleFormatChange('CLABE_18')}
                  className={`py-1.5 px-2 rounded-md font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer text-[11px] ${
                    accountFormat === 'CLABE_18'
                      ? 'bg-cyan-600 text-white font-bold shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5 shrink-0" />
                  <span>CLABE (18d)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleFormatChange('PAN_16')}
                  className={`py-1.5 px-2 rounded-md font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer text-[11px] ${
                    accountFormat === 'PAN_16'
                      ? 'bg-purple-600 text-white font-bold shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5 shrink-0" />
                  <span>Tarjeta PAN (16d)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleFormatChange('DIMO_10')}
                  className={`py-1.5 px-2 rounded-md font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer text-[11px] ${
                    accountFormat === 'DIMO_10'
                      ? 'bg-emerald-600 text-white font-bold shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5 shrink-0" />
                  <span>DiMo Móvil (10d)</span>
                </button>
              </div>

              {/* CLABE Specific Bank Catalog & Chips */}
              {accountFormat === 'CLABE_18' && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Banco Receptor:</span>
                    <button
                      type="button"
                      onClick={() => setIsBankSelectorOpen(true)}
                      className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      <Building2 className="w-3 h-3" />
                      <span>Catálogo Completo Banxico (60+ Bancos / Fintechs)</span>
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {[
                      { name: 'BBVA', code: '012' },
                      { name: 'Banorte', code: '072' },
                      { name: 'Citibanamex', code: '002' },
                      { name: 'Santander', code: '014' },
                      { name: 'HSBC', code: '021' },
                      { name: 'BanCoppel', code: '137' },
                      { name: 'Banco Azteca', code: '127' },
                      { name: 'Bienestar', code: '166' },
                      { name: 'Nu', code: '638' },
                      { name: 'STP', code: '646' },
                      { name: 'Mercado Pago', code: '846' },
                      { name: 'Spin Oxxo', code: '677' }
                    ].map((b) => (
                      <button
                        key={b.code}
                        type="button"
                        onClick={() => {
                          setTargetBank(`${b.name} (${b.code})`);
                          if (!targetAccount || targetAccount.length < 3) {
                            setTargetAccount(b.code);
                          } else {
                            setTargetAccount(b.code + targetAccount.slice(3));
                          }
                        }}
                        className={`px-2 py-0.5 text-[10px] rounded border font-mono transition-colors cursor-pointer ${
                          targetAccount.startsWith(b.code)
                            ? 'bg-cyan-950 border-cyan-500 text-cyan-300 font-semibold'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {b.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* PAN 16 Specific VISA Card Buttons */}
              {accountFormat === 'PAN_16' && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-purple-300 font-medium flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-purple-400" />
                      <span>Emisores VISA (16 Dígitos) Disponibles:</span>
                    </span>
                    <span className="text-purple-400 font-mono text-[10px] bg-purple-950/60 px-1.5 py-0.5 rounded border border-purple-800/60">
                      Luhn ISO 7812 · Red VISA
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                    {FEATURED_PAN_VISA_PRESETS.map((card) => (
                      <button
                        key={card.id}
                        type="button"
                        onClick={() => {
                          handleAccountInputChange(card.pan);
                        }}
                        className={`p-1.5 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between ${
                          targetAccount === card.pan
                            ? 'bg-purple-950/90 border-purple-500 text-purple-100 shadow-md ring-1 ring-purple-500/60'
                            : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-850'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-semibold text-[11px] truncate text-slate-100">{card.shortName}</span>
                          <span className="text-[9px] px-1 py-0.2 rounded bg-purple-900/80 text-purple-200 font-mono font-bold tracking-tight shrink-0">
                            VISA
                          </span>
                        </div>
                        <div className="font-mono text-[10px] text-purple-300/90 font-medium mt-1 tracking-wider">
                          {card.formattedPan}
                        </div>
                        <div className="text-[9px] text-slate-400 truncate mt-0.5">
                          {card.cardLabel}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* DiMo 10 Specific Mobile Phone Registrations */}
              {accountFormat === 'DIMO_10' && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-emerald-300 font-medium flex items-center gap-1.5">
                      <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Teléfonos Celulares Registrados en DiMo Banxico (10 Dígitos):</span>
                    </span>
                    <span className="text-emerald-400 font-mono text-[10px] bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/60">
                      Padrón DiMo SPEI Banxico
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                    {FEATURED_DIMO_PHONE_PRESETS.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          setDimoLinkedBank(m.bankCode);
                          handleAccountInputChange(m.phone);
                        }}
                        className={`p-1.5 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between ${
                          targetAccount === m.phone
                            ? 'bg-emerald-950/90 border-emerald-500 text-emerald-100 shadow-md ring-1 ring-emerald-500/60'
                            : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-850'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-semibold text-[11px] truncate text-slate-100">{m.shortName}</span>
                          <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-900/80 text-emerald-200 font-mono font-bold tracking-tight shrink-0">
                            DiMo
                          </span>
                        </div>
                        <div className="font-mono text-[11px] text-emerald-300 font-bold mt-0.5 tracking-wider">
                          {m.formattedPhone}
                        </div>
                        <div className="text-[9px] text-slate-400 truncate mt-0.5">
                          {m.region}
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Registered Institution selector for DiMo */}
                  <div className="flex items-center justify-between gap-2 pt-1 text-[11px] bg-slate-950/60 p-1.5 rounded border border-slate-800/80">
                    <span className="text-slate-400">Institución Vinculada al Celular en Banxico:</span>
                    <select
                      value={dimoLinkedBank}
                      onChange={(e) => {
                        const newCode = e.target.value;
                        setDimoLinkedBank(newCode);
                        const found = MEXICAN_BANKS_CATALOG.find(b => b.code === newCode);
                        if (found) {
                          setTargetBank(`${found.shortName} · DiMo`);
                          if (targetAccount.length === 10) {
                            setAccountValidationMsg({
                              isValid: true,
                              text: `Línea móvil (${targetAccount}) asociada a ${found.shortName} en DiMo Banxico para abono SPEI.`
                            });
                          }
                        }
                      }}
                      className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded px-2 py-0.5 focus:outline-none focus:border-emerald-500 font-mono"
                    >
                      <option value="166">Banco del Bienestar (166)</option>
                      <option value="677">Spin by Oxxo (677)</option>
                      <option value="137">BanCoppel (137)</option>
                      <option value="846">Mercado Pago W (846)</option>
                      <option value="012">BBVA México (012)</option>
                      <option value="072">Banorte (072)</option>
                      <option value="002">Citibanamex (002)</option>
                      <option value="014">Santander (014)</option>
                      <option value="638">Nu México (638)</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Dynamic Account Input */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] text-slate-400">
                    {accountFormat === 'CLABE_18' && 'Número de CLABE (18 dígitos numéricos):'}
                    {accountFormat === 'PAN_16' && 'Número de Tarjeta PAN (16 dígitos numéricos):'}
                    {accountFormat === 'DIMO_10' && 'Número Telefónico Móvil DiMo (10 dígitos numéricos):'}
                  </span>
                  <span className="text-[11px] font-mono text-cyan-300 font-semibold truncate max-w-[220px]">
                    {targetBank}
                  </span>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    value={targetAccount}
                    onChange={(e) => handleAccountInputChange(e.target.value)}
                    maxLength={accountFormat === 'CLABE_18' ? 18 : (accountFormat === 'PAN_16' ? 16 : 10)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono tracking-wider focus:outline-none focus:border-cyan-500 text-xs pr-28"
                    placeholder={
                      accountFormat === 'CLABE_18'
                        ? '012180001234567890'
                        : (accountFormat === 'PAN_16' ? '4152312345678901' : '5512345678')
                    }
                    required
                  />
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                    {targetAccount.length}/{accountFormat === 'CLABE_18' ? '18' : (accountFormat === 'PAN_16' ? '16' : '10')} dígitos
                  </div>
                </div>

                {/* Formatted Account Preview & Validation */}
                <div className="mt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px]">
                  {accountValidationMsg.text && (
                    <div className={`flex items-center gap-1.5 ${
                      accountValidationMsg.isValid ? 'text-emerald-400' : 'text-amber-400'
                    }`}>
                      {accountValidationMsg.isValid ? (
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      ) : (
                        <Info className="w-3.5 h-3.5 shrink-0" />
                      )}
                      <span>{accountValidationMsg.text}</span>
                    </div>
                  )}

                  <div className="font-mono text-slate-400 text-[10px]">
                    Vista: <span className="text-white font-semibold">{formatAccountDisplay(targetAccount, accountFormat)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Action: Direct SPEI Disbursement without biometric requirement */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3 px-4 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold text-xs rounded-xl shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
              >
                <SendHorizontal className="w-4 h-4 text-slate-950" />
                <span>Dispersar Fondos SPEI (${netPaidSPEI.toLocaleString()} MXN)</span>
              </button>
              <div className="flex items-center justify-center gap-2 mt-2 text-[10px] text-slate-400 text-center">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Dispersión Directa SPEI · Infraestructura STP / Banxico en Tiempo Real</span>
              </div>
            </div>
          </form>
        </div>

        {/* SAT Tax Breakdown & Fiscal Retention Card */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <div className="p-2 rounded-lg bg-amber-950 border border-amber-600/40 text-amber-400">
                <Scale className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">
                  Motor de Retención Fiscal SAT
                </h2>
                <p className="text-[11px] text-slate-400">
                  Cálculo automático de retención cuando el activo deja de ser virtual y pasa a ser dinero fiat en el sistema bancario.
                </p>
              </div>
            </div>

            {/* Detailed tax breakdown */}
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Modo de Operación:</span>
                <span className="font-semibold text-slate-200">
                  {fundSource === 'CRYPTO' ? `Liquidación de ${selectedCrypto}` : 'Dispersión Directa Reserva MXN'}
                </span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Monto Bruto de la Operación:</span>
                <span className="font-mono font-bold text-white tabular-nums">
                  ${grossLiquidatedMXN.toLocaleString()} MXN
                </span>
              </div>

              {fundSource === 'CRYPTO' ? (
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center text-rose-400">
                    <span>(-) Retención Provisional ISR (20%):</span>
                    <span className="font-mono font-semibold tabular-nums">
                      -${retencionISR.toLocaleString()} MXN
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-rose-400">
                    <span>(-) Retención IVA Trasladado (16%):</span>
                    <span className="font-mono font-semibold tabular-nums">
                      -${retencionIVA.toLocaleString()} MXN
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 leading-tight pt-1 border-t border-slate-800/60">
                    Fundamento Legal: Art. 126 Ley del ISR y Resolución Miscelánea Fiscal para Enajenación de Activos Virtuales y Plataformas Tecnológicas.
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400">
                  Operación desde Reserva Soberana en Pesos Mexicanos (previamente liquidada y timbrada). No requiere doble retención.
                </div>
              )}

              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/60 flex justify-between items-center">
                <div>
                  <span className="text-emerald-300 font-semibold block">Neto Liquidado a Enviar vía SPEI:</span>
                  <span className="text-[10px] text-slate-400">Hacia cuenta CLABE de {targetBank}</span>
                </div>
                <span className="text-xl font-bold font-mono text-emerald-400 tabular-nums">
                  ${netPaidSPEI.toLocaleString()} MXN
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Genera comprobante oficial CEP de Banxico con sello digital SAT para declaración mensual y fiscalización.</span>
            </div>

            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>Seguridad directa sin captura biométrica: Autorización y dispersión interbancaria en tiempo real vía SPEI Banxico / STP.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Historical SPEI Liquidations Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden space-y-0">
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-900/90">
          <div>
            <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wide flex items-center gap-2">
              <span>Historial de Liquidaciones SPEI & Comprobantes Fiscales (CEP)</span>
              <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-mono">
                {speiTransfers.length} Transacciones
              </span>
            </h3>
            <span className="text-[11px] text-slate-400">
              Registros procesados con validación electrónica directa, retención timbrada y comprobante electrónico de pago (CEP)
            </span>
          </div>

          <div className="text-xs text-slate-400 font-mono">
            Red SPEI Banxico · Cero Fugas de Capital
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Folio / Fecha</th>
                <th className="py-3 px-4">Beneficiario & RFC</th>
                <th className="py-3 px-4">Banco Receptor / CLABE</th>
                <th className="py-3 px-4 text-right">Monto Bruto</th>
                <th className="py-3 px-4 text-right">Retención SAT</th>
                <th className="py-3 px-4 text-right">Neto SPEI MXN</th>
                <th className="py-3 px-4 text-center">Validación</th>
                <th className="py-3 px-4">Folio CEP Banxico</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {speiTransfers.map((st) => (
                <tr 
                  key={st.id} 
                  onClick={() => setInspectedTransfer(st)}
                  className="hover:bg-slate-800/30 transition-colors cursor-pointer"
                  title="Clic para ver Comprobante Electrónico de Pago y Certificado Biométrico"
                >
                  <td className="py-3 px-4">
                    <span className="font-mono text-slate-200 font-semibold">{st.id}</span>
                    <span className="text-[11px] text-slate-400 block font-mono">
                      {new Date(st.timestamp).toLocaleDateString()} {new Date(st.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-medium text-slate-200 truncate max-w-[180px]">{st.beneficiaryName}</div>
                    <div className="text-[11px] text-slate-400 font-mono">{st.beneficiaryRFC}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-slate-200 font-medium">{st.targetBank}</span>
                      {st.accountFormat === 'PAN_16' ? (
                        <span className="px-1.5 py-0.5 rounded text-[9px] bg-purple-950 text-purple-300 border border-purple-800 font-mono">
                          PAN 16d
                        </span>
                      ) : st.accountFormat === 'DIMO_10' ? (
                        <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono">
                          DiMo 10d
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded text-[9px] bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono">
                          CLABE 18d
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      {formatAccountDisplay(st.targetCLABE, st.accountFormat || 'CLABE_18')}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums">
                    <div className="text-slate-200">
                      {st.grossAmountCrypto > 0 ? `${st.grossAmountCrypto} ${st.cryptoSymbol}` : `$${st.liquidatedGrossMXN.toLocaleString()} MXN`}
                    </div>
                    <div className="text-[11px] text-slate-400">≈ ${st.liquidatedGrossMXN.toLocaleString()} MXN</div>
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-rose-400 tabular-nums">
                    {(st.retencionISRProvisionalMXN + st.retencionIVAMXN) > 0 ? (
                      `-$${(st.retencionISRProvisionalMXN + st.retencionIVAMXN).toLocaleString()} MXN`
                    ) : (
                      <span className="text-slate-500">$0.00 MXN</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400 tabular-nums">
                    ${st.netPaidSPEIMXN.toLocaleString()} MXN
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-950/80 text-emerald-300 border border-emerald-700/60">
                      <ShieldCheck className="w-3 h-3 text-emerald-400" />
                      <span>Directa / SPEI</span>
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-mono text-[11px] text-cyan-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 select-all">
                      {st.cepFolio}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Historical Conversions to MXN Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden space-y-0">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div>
            <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wide flex items-center gap-2">
              <ArrowRightLeft className="w-3.5 h-3.5 text-teal-400" />
              <span>Bitácora de Conversión de Activos a Pesos Mexicanos (MXN)</span>
            </h3>
            <span className="text-[11px] text-slate-400">
              Historial de liquidaciones a la Bóveda Soberana para custodia fuera del sistema bancario tradicional
            </span>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {conversionHistory.length} conversiones registradas
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Folio Conversión</th>
                <th className="py-3 px-4">Fecha / Hora</th>
                <th className="py-3 px-4">Activo Origen</th>
                <th className="py-3 px-4 text-right">T.C. Oráculo</th>
                <th className="py-3 px-4 text-right">Acreditado en Bóveda Soberana</th>
                <th className="py-3 px-4">TxHash Criptográfico</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {conversionHistory.map((ch) => (
                <tr key={ch.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4 text-slate-200 font-semibold">{ch.id}</td>
                  <td className="py-3 px-4 text-slate-400">
                    {new Date(ch.timestamp).toLocaleDateString()} {new Date(ch.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="py-3 px-4 text-slate-200">
                    <strong className="text-teal-400">{ch.fromAmount.toLocaleString()}</strong> {ch.fromAsset}
                  </td>
                  <td className="py-3 px-4 text-right text-slate-300">
                    ${ch.exchangeRateMXN.toLocaleString()} MXN / {ch.fromAsset}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-emerald-400">
                    +${ch.netCreditedMXN.toLocaleString()} MXN
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-[11px] text-slate-400 select-all font-mono">
                      {ch.txHash.slice(0, 18)}...
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bank Selector Modal (Comprehensive Banxico Catalog) */}
      {isBankSelectorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-cyan-400" />
                <div>
                  <h3 className="text-sm font-bold text-white">Catálogo Oficial de Bancos en Red SPEI Banxico</h3>
                  <p className="text-[11px] text-slate-400">Selecciona cualquier institución financiera autorizada en México</p>
                </div>
              </div>
              <button
                onClick={() => setIsBankSelectorOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Search and filters */}
            <div className="p-3 border-b border-slate-800 bg-slate-950/50 flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={bankSearchQuery}
                  onChange={(e) => setBankSearchQuery(e.target.value)}
                  placeholder="Buscar por nombre (ej. BBVA, Nu, Banorte) o código (012, 638)..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex gap-1.5 text-xs">
                <button
                  onClick={() => setBankFilterType('ALL')}
                  className={`px-2.5 py-1 rounded-lg border text-xs cursor-pointer ${
                    bankFilterType === 'ALL'
                      ? 'bg-slate-800 text-white border-cyan-500'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  Todos ({MEXICAN_BANKS_CATALOG.length})
                </button>
                <button
                  onClick={() => setBankFilterType('BANCA_MULTIPLE')}
                  className={`px-2.5 py-1 rounded-lg border text-xs cursor-pointer ${
                    bankFilterType === 'BANCA_MULTIPLE'
                      ? 'bg-slate-800 text-white border-cyan-500'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  Banca Tradicional
                </button>
                <button
                  onClick={() => setBankFilterType('FINTECH_IFPE')}
                  className={`px-2.5 py-1 rounded-lg border text-xs cursor-pointer ${
                    bankFilterType === 'FINTECH_IFPE'
                      ? 'bg-slate-800 text-white border-cyan-500'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  Fintech / Neobancos
                </button>
              </div>
            </div>

            {/* Bank Items List */}
            <div className="overflow-y-auto divide-y divide-slate-800/60 p-2 max-h-[60vh]">
              {filteredBanks.map((bank) => (
                <div
                  key={bank.code}
                  onClick={() => handleSelectBank(bank)}
                  className="p-3 rounded-xl hover:bg-slate-800/60 transition-colors flex items-center justify-between cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center font-mono text-xs font-bold text-cyan-400 group-hover:border-cyan-500/50">
                      {bank.code}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-white text-xs">{bank.shortName}</strong>
                        {bank.popularBadge && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-cyan-950 text-cyan-300 border border-cyan-700/50">
                            {bank.popularBadge}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 block">{bank.name}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 font-mono uppercase block">{bank.type.replace('_', ' ')}</span>
                    <span className="text-xs text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 justify-end">
                      <span>Seleccionar</span>
                      <span>→</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CEP Audit Details Modal */}
      {inspectedTransfer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Comprobante Electrónico de Pago (CEP) Banxico</h3>
              </div>
              <button
                onClick={() => setInspectedTransfer(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              {/* Authorized Transfer Seal Badge */}
              <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-700/60 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-emerald-900/80 text-emerald-400">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-emerald-400 block font-mono">DISPERSIÓN AUTORIZADA SPEI</span>
                    <strong className="text-white text-xs">Liquidación Directa Interbancaria STP / Banxico</strong>
                    <span className="text-[10px] text-slate-300 block">Autorización Directa de Tesorería Soberana</span>
                  </div>
                </div>
                <div className="text-right font-mono text-[10px] text-emerald-400">
                  <span>Estatus: LIQUIDADO</span>
                  <span className="text-slate-400 block">Red: SPEI Mainnet</span>
                </div>
              </div>

              {/* Transfer parameters */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">Folio CEP:</span>
                  <span className="font-mono text-cyan-300 font-semibold">{inspectedTransfer.cepFolio}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Fecha y Hora:</span>
                  <span className="font-mono text-slate-200">{new Date(inspectedTransfer.timestamp).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Beneficiario:</span>
                  <span className="font-medium text-white">{inspectedTransfer.beneficiaryName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">RFC Beneficiario:</span>
                  <span className="font-mono text-slate-200">{inspectedTransfer.beneficiaryRFC}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Banco Receptor:</span>
                  <span className="text-slate-200">{inspectedTransfer.targetBank}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">
                    {inspectedTransfer.accountFormat === 'PAN_16' 
                      ? 'Tarjeta PAN (16d):' 
                      : (inspectedTransfer.accountFormat === 'DIMO_10' ? 'Línea DiMo (10d):' : 'Cuenta CLABE (18d):')}
                  </span>
                  <span className="font-mono text-cyan-300 font-bold">
                    {formatAccountDisplay(inspectedTransfer.targetCLABE, inspectedTransfer.accountFormat || 'CLABE_18')}
                  </span>
                </div>
                <div className="border-t border-slate-800 pt-2 flex justify-between">
                  <span className="text-slate-400">Monto Bruto Liquidado:</span>
                  <span className="font-mono text-slate-200">${inspectedTransfer.liquidatedGrossMXN.toLocaleString()} MXN</span>
                </div>
                <div className="flex justify-between text-rose-400">
                  <span>Retención SAT Total (ISR+IVA):</span>
                  <span className="font-mono">-${(inspectedTransfer.retencionISRProvisionalMXN + inspectedTransfer.retencionIVAMXN).toLocaleString()} MXN</span>
                </div>
                <div className="border-t border-slate-800 pt-2 flex justify-between items-baseline">
                  <span className="text-slate-200 font-bold">Monto Neto Dispersado SPEI:</span>
                  <span className="font-mono font-extrabold text-emerald-400 text-base">
                    ${inspectedTransfer.netPaidSPEIMXN.toLocaleString()} MXN
                  </span>
                </div>
              </div>

              {/* Cryptographic hash */}
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400">Certificado de Autenticidad SHA-256 (Timbre Digital Banxico / SAT):</span>
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-[10px] font-mono text-slate-300 break-all select-all">
                  {inspectedTransfer.auditCertificateHash}
                </div>
              </div>
            </div>

            <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setInspectedTransfer(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Cerrar Comprobante
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
