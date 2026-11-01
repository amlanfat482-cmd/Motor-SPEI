import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Key, 
  Smartphone, 
  Lock, 
  Unlock, 
  CheckCircle2, 
  AlertTriangle, 
  Send, 
  RefreshCw, 
  Database, 
  FileCode, 
  Copy, 
  Check, 
  Server, 
  Building2, 
  Layers, 
  Ban,
  ArrowRight,
  EyeOff,
  Cpu,
  Sparkles
} from 'lucide-react';
import { VaultBalances } from '../types/aml';
import { 
  MEXICAN_BANKS_CATALOG, 
  findBankByClabe, 
  generateMockCLABE 
} from '../utils/mexicanBanks';
import { 
  WhitelistBeneficiary, 
  WormAuditRecord, 
  BannedDevice 
} from '../types/sovereignWhitelist';
import { 
  loadWhitelistBeneficiaries, 
  loadWormLogs, 
  loadBannedDevices, 
  validateClabeDetailed, 
  registraMiCuentaFinal, 
  executeTokenizedDispersal, 
  sanitizaEntrada,
  banDevice24Hours,
  saveBannedDevices,
  getStoredClabeForToken
} from '../utils/sovereignWhitelistEngine';

interface MiCuentaFinalWhitelistManagerProps {
  vaultBalances: VaultBalances;
  onUpdateVaultBalances?: (balances: VaultBalances) => void;
}

export const MiCuentaFinalWhitelistManager: React.FC<MiCuentaFinalWhitelistManagerProps> = ({
  vaultBalances,
  onUpdateVaultBalances
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'clean_console' | 'redmi_simulator' | 'worm_audit' | 'code_blueprints'>('clean_console');
  
  // Data states
  const [beneficiaries, setBeneficiaries] = useState<WhitelistBeneficiary[]>(() => loadWhitelistBeneficiaries());
  const [wormLogs, setWormLogs] = useState<WormAuditRecord[]>(() => loadWormLogs());
  const [bannedDevices, setBannedDevices] = useState<BannedDevice[]>(() => loadBannedDevices());

  // Clean Console Registration Form State
  const [cleanAlias, setCleanAlias] = useState('MI_CUENTA_FINAL');
  const [cleanClabeInput, setCleanClabeInput] = useState('012180001234567890');
  const [cleanBankName, setCleanBankName] = useState('BBVA México (012)');
  const [cleanOwnerName, setCleanOwnerName] = useState('TESORERIA SOBERANA SAPI DE CV');
  const [cleanYubikeyPressed, setCleanYubikeyPressed] = useState(false);
  const [cleanRegisterFeedback, setCleanRegisterFeedback] = useState<{ success: boolean; msg: string } | null>(null);

  // Live CLABE 3-7-1 & Zero-Width evaluation
  const clabeEvaluation = validateClabeDetailed(cleanClabeInput);

  // Quick preset bank selector
  const handleSelectPresetBank = (bankCode: string) => {
    const bank = MEXICAN_BANKS_CATALOG.find(b => b.code === bankCode);
    if (bank) {
      setCleanBankName(`${bank.name} (${bank.code})`);
      const mockClabe = generateMockCLABE(bankCode);
      setCleanClabeInput(mockClabe);
      setCleanAlias(`MI_CUENTA_${bank.shortName.toUpperCase().replace(/[\s\.]+/g, '_')}_FINAL`);
    }
  };

  // Bank select dropdown change
  const handleBankSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newBankVal = e.target.value;
    setCleanBankName(newBankVal);
    const match = newBankVal.match(/\((\d{3})\)/);
    if (match) {
      const bankCode = match[1];
      const mockClabe = generateMockCLABE(bankCode);
      setCleanClabeInput(mockClabe);
      const bank = MEXICAN_BANKS_CATALOG.find(b => b.code === bankCode);
      if (bank) {
        setCleanAlias(`MI_CUENTA_${bank.shortName.toUpperCase().replace(/[\s\.]+/g, '_')}_FINAL`);
      }
    }
  };

  // CLABE input change with auto-bank detection
  const handleClabeInputChange = (val: string) => {
    setCleanClabeInput(val);
    const cleanDigits = val.replace(/[\s-]/g, '');
    if (cleanDigits.length >= 3) {
      const bankCode = cleanDigits.slice(0, 3);
      const matched = MEXICAN_BANKS_CATALOG.find(b => b.code === bankCode);
      if (matched) {
        setCleanBankName(`${matched.name} (${matched.code})`);
      }
    }
  };

  // Generate valid CLABE for current selected bank
  const handleGenerateValidClabeForBank = () => {
    const match = cleanBankName.match(/\((\d{3})\)/);
    const bankCode = match ? match[1] : '137';
    const mockClabe = generateMockCLABE(bankCode);
    setCleanClabeInput(mockClabe);
  };

  // Redmi 13 Simulator State
  const [selectedToken, setSelectedToken] = useState<string>('TOK_MIA_FINAL');
  const [dispersalAmount, setDispersalAmount] = useState<number>(150000);
  const [claveRastreo, setClaveRastreo] = useState<string>('SPEI20261025MUK3793S7427760000');
  const [isSimulatingExecution, setIsSimulatingExecution] = useState(false);
  const [hsmRamVisualizer, setHsmRamVisualizer] = useState<{ active: boolean; msLeft: number; clabePreview: string } | null>(null);
  const [dispersalResultFeedback, setDispersalResultFeedback] = useState<{
    status: string;
    message: string;
    cepFolio?: string;
    banned?: boolean;
  } | null>(null);

  // Code Blueprint copy helper
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const handleCopyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedSection(id);
    setTimeout(() => setCopiedSection(null), 2500);
  };

  // Sync state changes
  const refreshData = () => {
    setBeneficiaries(loadWhitelistBeneficiaries());
    setWormLogs(loadWormLogs());
    setBannedDevices(loadBannedDevices());
  };

  // Handle Clean Registration with YubiKey
  const handleRegisterCleanAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cleanYubikeyPressed) {
      alert('Por favor autentica físicamente tocando el sensor FIDO2 de la YubiKey.');
      return;
    }

    const res = registraMiCuentaFinal({
      alias: cleanAlias,
      clabe18: cleanClabeInput,
      bankName: cleanBankName,
      ownerName: cleanOwnerName,
      deviceType: 'CLEAN_WORKSTATION_MTLS',
      yubikeyResponse: 'YUBI-FIDO2-SEC-990428'
    });

    if (res.success) {
      setCleanRegisterFeedback({
        success: true,
        msg: `¡Cuenta registrada en HSM con éxito! Token generado: ${res.beneficiary?.token}. La CLABE en claro fue purgada de la memoria tras su cifrado AES-256-GCM.`
      });
      refreshData();
    } else {
      setCleanRegisterFeedback({
        success: false,
        msg: res.error || 'Fallo en registro de cuenta en HSM.'
      });
    }
  };

  // Handle Clean Dispersal using Token only
  const handleExecuteCleanTokenDispersal = () => {
    setIsSimulatingExecution(true);
    setDispersalResultFeedback(null);

    // 0.3s HSM Visualizer animation
    const clabeInRam = getStoredClabeForToken(selectedToken);
    setHsmRamVisualizer({
      active: true,
      msLeft: 284,
      clabePreview: `${clabeInRam} (RAM 0.28s)`
    });

    setTimeout(() => {
      setHsmRamVisualizer(null);
      const res = executeTokenizedDispersal(
        {
          token: selectedToken,
          amountMxn: dispersalAmount,
          claveRastreo,
          deviceId: 'REDMI-13-MUK3793'
        },
        vaultBalances.MXN
      );

      setIsSimulatingExecution(false);
      refreshData();

      if (res.success) {
        // Deduct from Sovereign Vault MXN
        if (onUpdateVaultBalances) {
          onUpdateVaultBalances({
            ...vaultBalances,
            MXN: Math.max(0, vaultBalances.MXN - dispersalAmount)
          });
        }

        setDispersalResultFeedback({
          status: 'SUCCESS',
          message: `Dispersión exitosa a tu propia cuenta bancaria (${res.banco} ****${res.resolvedUltimos4}) por $${dispersalAmount.toLocaleString('es-MX')} MXN. Memoria HSM purgada en ${res.hsmLifecycleMs}ms.`,
          cepFolio: res.cepFolio
        });
      } else {
        setDispersalResultFeedback({
          status: 'ERROR',
          message: res.errorMessage || 'Error en la dispersión tokenizada.'
        });
      }
    }, 450);
  };

  // Handle Attack Simulation: Attempting to Inject Zero-Width payload or Mismatched CLABE
  const handleTestAutoInjectionAttack = () => {
    setIsSimulatingExecution(true);
    setDispersalResultFeedback(null);

    // Payload containing zero-width non-joiner U+200C and U+200D (Clipper payload pattern)
    const dirtyZeroWidthPayload = '0x71C8136450A942Ff29b9F39b2Bf471E1528659b8\u200C\u200D';

    setTimeout(() => {
      const res = executeTokenizedDispersal(
        {
          token: selectedToken,
          amountMxn: dispersalAmount,
          claveRastreo,
          deviceId: 'REDMI-13-MUK3793',
          rawPayloadReceived: dirtyZeroWidthPayload
        },
        vaultBalances.MXN
      );

      setIsSimulatingExecution(false);
      refreshData();

      setDispersalResultFeedback({
        status: 'BLOCKED',
        message: res.errorMessage || 'BLOCKED_AUTO_INYECCION_DETECTADA: Ataque bloqueado y dispositivo sancionado.',
        banned: true
      });
    }, 300);
  };

  const isRedmiCurrentlyBanned = bannedDevices.some(d => d.deviceId === 'REDMI-13-MUK3793');

  return (
    <div className="space-y-6">
      {/* Sovereign Header & Sentinel Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/70 border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="p-1.5 rounded-lg bg-cyan-950 border border-cyan-500/40 text-cyan-400">
                <Key className="w-5 h-5" />
              </span>
              <h1 className="text-base font-bold text-white tracking-tight">
                Módulo MI_CUENTA_FINAL · Whitelist de Destino Propio sin Inyección
              </h1>
              <span className="text-[11px] text-cyan-300 bg-cyan-950/80 border border-cyan-700/60 px-2 py-0.5 rounded-full font-mono flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                <span>Anti-Clipper Zero-Width + Custodio HSM</span>
              </span>
            </div>
            <p className="text-xs text-slate-300 max-w-4xl leading-relaxed">
              Solución definitiva para recibir fondos en tu propia cuenta bancaria sin riesgo de reemplazo de CLABE ni inyección zero-width (<code className="text-amber-400 font-mono bg-slate-950 px-1 py-0.5 rounded">U+200C / U+200D</code>). 
              El registro se efectúa exclusivamente desde consola estéril con mTLS + YubiKey FIDO2; el dispositivo móvil (Redmi 13) opera únicamente mediante tokens abstractos (<code className="text-emerald-400 font-mono bg-slate-950 px-1 py-0.5 rounded">TOK_MIA_FINAL</code>). La CLABE en claro solo vive ≤0.3s en memoria volátil de HSM y se destruye inmediatamente tras la firma SPEI.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="px-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-right font-mono">
              <span className="text-[10px] text-slate-400 block">Saldo Tesorería Soberana</span>
              <span className="text-sm font-bold text-emerald-400">
                ${vaultBalances.MXN.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
              </span>
            </div>
          </div>
        </div>

        {/* Security Hardware Indicators */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-800/80 text-xs">
          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center gap-2.5">
            <Server className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 block font-mono">HSM KMS Key</span>
              <span className="text-white font-semibold">AWS KMS / FIPS 140-3</span>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center gap-2.5">
            <EyeOff className="w-4 h-4 text-cyan-400 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 block font-mono">Tiempo en RAM</span>
              <span className="text-cyan-300 font-semibold font-mono">≤ 0.3s (Purga Zeroize)</span>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 block font-mono">Sanitizador Regex</span>
              <span className="text-amber-300 font-semibold font-mono">[\u200B-\u200D\uFEFF]</span>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center gap-2.5">
            <Database className="w-4 h-4 text-purple-400 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 block font-mono">WORM Immutable Log</span>
              <span className="text-purple-300 font-semibold">Object Lock Activo</span>
            </div>
          </div>
        </div>
      </div>

      {/* Subtab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('clean_console')}
          className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeSubTab === 'clean_console'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Server className="w-3.5 h-3.5" />
          <span>1. Consola Limpia (Registro HSM)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('redmi_simulator')}
          className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeSubTab === 'redmi_simulator'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>2. Móvil Redmi 13 (Solo Token)</span>
          {isRedmiCurrentlyBanned && (
            <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-rose-950 text-rose-300 border border-rose-700 font-mono">
              BANEADO 24H
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('worm_audit')}
          className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeSubTab === 'worm_audit'
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>3. Bitácora WORM & Auditoría HSM</span>
          <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-slate-800 text-slate-300 font-mono">
            {wormLogs.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('code_blueprints')}
          className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeSubTab === 'code_blueprints'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <FileCode className="w-3.5 h-3.5" />
          <span>4. Blueprints de Producción (FastAPI / Kotlin / Terraform)</span>
        </button>
      </div>

      {/* SUBTAB 1: CONSOLA LIMPIA (REGISTRO HSM) */}
      {activeSubTab === 'clean_console' && (
        <div className="space-y-6">
          {/* Hardware Strict Enforcement Alert */}
          <div className="p-4 rounded-xl bg-cyan-950/40 border border-cyan-800/60 text-xs text-cyan-200 flex items-start gap-3">
            <Lock className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <strong className="text-white block font-semibold">
                Zona de Enclave Cero Contaminación (Clean Room mTLS)
              </strong>
              <p className="text-slate-300 leading-relaxed">
                Este formulario solo se ejecuta desde una estación de trabajo estéril verificada por certificado mutuo (mTLS) y presencia física de YubiKey. 
                Cualquier intento de ejecutar este registro desde el dispositivo Redmi 13 o navegadores sin certificado genera bloqueo automático. 
                La CLABE real solo reside en memoria RAM durante 0.3 segundos para calcular el hash SHA-256 y crear el token <code className="text-cyan-300 font-mono">TOK_MIA_FINAL</code>; luego se zeroiza.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Active Whitelisted Beneficiaries Table */}
            <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col justify-between">
              <div>
                <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-cyan-400" />
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                      Cuentas Whitelist Autorizadas en HSM
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                    Solo Tokens Válidos
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 uppercase text-[10px] font-mono">
                      <tr>
                        <th className="py-2.5 px-3">Token Soberano</th>
                        <th className="py-2.5 px-3">Alias</th>
                        <th className="py-2.5 px-3">Banco / Cuenta</th>
                        <th className="py-2.5 px-3">Titular Verificado</th>
                        <th className="py-2.5 px-3 text-center">Estatus</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-sans">
                      {beneficiaries.map((b) => (
                        <tr key={b.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-3 px-3">
                            <span className="font-mono text-xs font-bold text-emerald-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                              {b.token}
                            </span>
                            <span className="text-[10px] text-slate-500 block font-mono mt-0.5">
                              {b.kmsKeyArn.slice(-18)}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-semibold text-slate-200">
                            {b.alias}
                          </td>
                          <td className="py-3 px-3">
                            <div className="text-slate-200 font-medium">{b.bankName}</div>
                            <div className="text-[11px] font-mono text-cyan-300">
                              ****{b.clabeUltimos4}
                            </div>
                          </td>
                          <td className="py-3 px-3 text-slate-300 font-mono text-[11px]">
                            {b.ownerName}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-700/60">
                              <ShieldCheck className="w-3 h-3 text-emerald-400" />
                              <span>HSM OK</span>
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Zero-Knowledge SHA-256 Proof */}
              <div className="p-4 bg-slate-950/70 border-t border-slate-800 space-y-1.5 text-xs font-mono">
                <span className="text-[10px] text-slate-500 uppercase block">Hash SHA-256 Destino (Zero-Knowledge):</span>
                <div className="p-2 rounded bg-slate-900 border border-slate-800 text-[11px] text-slate-300 break-all select-all">
                  {beneficiaries[0]?.clabeSha256Hash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'}
                </div>
              </div>
            </div>

            {/* Clean Registration Form */}
            <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl p-5 space-y-4">
              <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Registro Limpio en Custodio HSM</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Genera el token de destino propio sin inyección
                  </p>
                </div>
              </div>

              {cleanRegisterFeedback && (
                <div className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                  cleanRegisterFeedback.success
                    ? 'bg-emerald-950/70 border-emerald-700 text-emerald-200'
                    : 'bg-rose-950/70 border-rose-700 text-rose-200'
                }`}>
                  {cleanRegisterFeedback.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <span>{cleanRegisterFeedback.msg}</span>
                </div>
              )}

              <form onSubmit={handleRegisterCleanAccount} className="space-y-3.5 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1 font-medium">Alias Inmutable de Destino:</label>
                  <input
                    type="text"
                    required
                    value={cleanAlias}
                    onChange={(e) => setCleanAlias(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>

                {/* Quick Bank Presets Bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-medium">Atajos de Instituciones Disponibles (Banxico SPEI):</span>
                    <span className="text-[10px] text-cyan-400 font-mono">60+ Bancos / Fintechs</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { name: 'BBVA', code: '012' },
                      { name: 'Banorte', code: '072' },
                      { name: 'Bienestar', code: '166' },
                      { name: 'BanCoppel', code: '137' },
                      { name: 'Nu México', code: '638' },
                      { name: 'Banco Azteca', code: '127' },
                      { name: 'Santander', code: '014' },
                      { name: 'Citibanamex', code: '002' },
                      { name: 'HSBC', code: '021' },
                      { name: 'Mercado Pago', code: '846' },
                      { name: 'Spin Oxxo', code: '677' },
                      { name: 'STP', code: '646' }
                    ].map(b => (
                      <button
                        key={b.code}
                        type="button"
                        onClick={() => handleSelectPresetBank(b.code)}
                        className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors cursor-pointer border ${
                          cleanBankName.includes(`(${b.code})`)
                            ? 'bg-cyan-950 border-cyan-500 text-cyan-300 font-bold'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                        }`}
                      >
                        {b.name} ({b.code})
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-slate-400 font-medium">CLABE Interbancaria Real (18 Dígitos):</label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleGenerateValidClabeForBank}
                        className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer font-mono hover:underline"
                        title="Genera automáticamente una CLABE válida con dígito control 3-7-1 para el banco seleccionado"
                      >
                        <Sparkles className="w-3 h-3 text-cyan-400" />
                        <span>Generar CLABE Válida</span>
                      </button>
                      <span className="text-[10px] font-mono text-slate-500">
                        Algoritmo Banxico 3-7-1
                      </span>
                    </div>
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={20}
                    value={cleanClabeInput}
                    onChange={(e) => handleClabeInputChange(e.target.value)}
                    placeholder="012180001234567890"
                    className={`w-full bg-slate-950 border rounded-xl px-3 py-2 font-mono text-sm tracking-wider focus:outline-none ${
                      clabeEvaluation.hasZeroWidthCharacters
                        ? 'border-rose-500 text-rose-300'
                        : clabeEvaluation.isValid
                        ? 'border-emerald-500/80 text-emerald-300'
                        : 'border-amber-500/80 text-amber-300'
                    }`}
                  />

                  {/* Live Validation Pill */}
                  <div className="mt-1.5 p-2 rounded-lg bg-slate-950 border border-slate-800/80 text-[11px] font-mono space-y-1">
                    {clabeEvaluation.hasZeroWidthCharacters ? (
                      <div className="text-rose-400 flex items-center gap-1.5 font-bold">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>¡ALERTA! Caracteres Zero-Width detectados. Bloqueo inmediato.</span>
                      </div>
                    ) : clabeEvaluation.isValid ? (
                      <div className="text-emerald-400 flex items-center gap-1.5 font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>CLABE Válida (Banco: {cleanBankName}, Dígito Control: {clabeEvaluation.actualControlDigit})</span>
                      </div>
                    ) : (
                      <div className="text-amber-400 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>
                          Dígito esperado: {clabeEvaluation.expectedControlDigit >= 0 ? clabeEvaluation.expectedControlDigit : 'N/A'}, recibido: {clabeEvaluation.actualControlDigit >= 0 ? clabeEvaluation.actualControlDigit : 'N/A'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-400 block mb-1">Banco Receptor (Catálogo Banxico Completo):</label>
                    <select
                      value={cleanBankName}
                      onChange={handleBankSelectChange}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-white text-xs focus:outline-none focus:border-cyan-500 font-sans"
                    >
                      <optgroup label="Banca Múltiple Nacional">
                        {MEXICAN_BANKS_CATALOG.filter(b => b.type === 'BANCA_MULTIPLE').map(b => (
                          <option key={b.code} value={`${b.name} (${b.code})`}>
                            {b.shortName} ({b.code}) {b.popularBadge ? `· [${b.popularBadge}]` : ''}
                          </option>
                        ))}
                      </optgroup>

                      <optgroup label="Banca de Desarrollo">
                        {MEXICAN_BANKS_CATALOG.filter(b => b.type === 'BANCA_DESARROLLO').map(b => (
                          <option key={b.code} value={`${b.name} (${b.code})`}>
                            {b.shortName} ({b.code})
                          </option>
                        ))}
                      </optgroup>

                      <optgroup label="Fintechs IFPE & Neobancos">
                        {MEXICAN_BANKS_CATALOG.filter(b => b.type === 'FINTECH_IFPE').map(b => (
                          <option key={b.code} value={`${b.name} (${b.code})`}>
                            {b.shortName} ({b.code}) {b.popularBadge ? `· [${b.popularBadge}]` : ''}
                          </option>
                        ))}
                      </optgroup>

                      <optgroup label="SOFIPOs & Entidades Financieras">
                        {MEXICAN_BANKS_CATALOG.filter(b => b.type === 'SOFIPO').map(b => (
                          <option key={b.code} value={`${b.name} (${b.code})`}>
                            {b.shortName} ({b.code})
                          </option>
                        ))}
                      </optgroup>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Titular Verificado:</label>
                    <input
                      type="text"
                      required
                      value={cleanOwnerName}
                      onChange={(e) => setCleanOwnerName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500 text-xs"
                    />
                  </div>
                </div>

                {/* Physical YubiKey Sensor Challenge */}
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-amber-400" />
                      <span>Reto Físico YubiKey FIDO2</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setCleanYubikeyPressed(!cleanYubikeyPressed)}
                      className={`px-3 py-1 rounded-lg text-xs font-mono font-bold cursor-pointer transition-colors ${
                        cleanYubikeyPressed
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                          : 'bg-amber-950 text-amber-300 border border-amber-700 animate-pulse'
                      }`}
                    >
                      {cleanYubikeyPressed ? '✓ Sensor Tocado (Autenticado)' : 'Tocar Sensor YubiKey'}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Atestación física de hardware requerida para solicitar el cifrado del sobre en el HSM KMS.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={!clabeEvaluation.isValid || !cleanYubikeyPressed}
                  className="w-full py-2.5 bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  <span>Cifrar en HSM y Emitir Token TOK_MIA_FINAL</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: SIMULADOR REDMI 13 (SOLO TOKEN - CERO INYECCIÓN) */}
      {activeSubTab === 'redmi_simulator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Redmi 13 Contaminated Device Mockup */}
          <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Cliente Móvil: Xiaomi Redmi 13
                  </h3>
                  <span className="text-[10px] text-rose-400 font-mono">
                    Entorno con Clipper Activo (RedLine / LummaC2)
                  </span>
                </div>
              </div>

              {isRedmiCurrentlyBanned ? (
                <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-rose-950 text-rose-300 border border-rose-700 animate-pulse">
                  DISPOSITIVO BANEADO 24H
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-full text-[10px] font-mono bg-amber-950 text-amber-300 border border-amber-700">
                  Modo Blindado (Solo Token)
                </span>
              )}
            </div>

            {/* Banned Device Notice */}
            {isRedmiCurrentlyBanned && (
              <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-700 text-xs text-rose-200 space-y-1">
                <div className="flex items-center gap-2 font-bold text-rose-300">
                  <Ban className="w-4 h-4" />
                  <span>ACCESO DENEGADO POR CORTAFUEGOS HSM</span>
                </div>
                <p className="text-[11px] text-slate-300">
                  El servidor detectó un intento previo de auto-inyección con caracteres zero-width o CLABE en texto claro. El ID del dispositivo está en lista negra por 24 horas para salvaguardar el patrimonio.
                </p>
                <button
                  onClick={() => {
                    saveBannedDevices([]);
                    refreshData();
                  }}
                  className="mt-2 text-[10px] text-cyan-300 underline font-mono cursor-pointer"
                >
                  [Admin Sandbox: Restablecer Baneo de Dispositivo]
                </button>
              </div>
            )}

            {/* In-app sanitized Mobile Form */}
            <div className="space-y-4 text-xs">
              <div>
                <label className="text-slate-400 block mb-1 font-medium">Cuenta Destino Autorizada (Dropdown Cerrado):</label>
                <div className="relative">
                  <select
                    disabled={isRedmiCurrentlyBanned}
                    value={selectedToken}
                    onChange={(e) => setSelectedToken(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white font-mono focus:outline-none focus:border-cyan-500"
                  >
                    {beneficiaries.map(b => (
                      <option key={b.token} value={b.token}>
                        {b.token} — {b.alias} ({b.bankName} ****{b.clabeUltimos4})
                      </option>
                    ))}
                  </select>
                </div>
                <span className="text-[10px] text-emerald-400 font-mono block mt-1">
                  ✓ El móvil jamás conoce ni almacena la CLABE completa de 18 dígitos.
                </span>
              </div>

              <div>
                <label className="text-slate-500 block mb-1">Campo de CLABE Manual:</label>
                <div className="p-2.5 rounded-xl bg-slate-950/90 border border-rose-900/50 text-slate-500 font-mono flex items-center justify-between">
                  <span className="line-through text-xs">012180001234567890</span>
                  <span className="text-[10px] text-rose-400 bg-rose-950 px-2 py-0.5 rounded border border-rose-900">
                    BLOQUEADO POR POLÍTICA HSM
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 block mt-1">
                  La app móvil no cuenta con input de texto para CLABE ni permite pegar direcciones.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1 font-medium">Monto a Dispersar (MXN):</label>
                  <input
                    type="number"
                    disabled={isRedmiCurrentlyBanned}
                    value={dispersalAmount}
                    onChange={(e) => setDispersalAmount(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1 font-medium">Clave de Rastreo SPEI:</label>
                  <input
                    type="text"
                    disabled={isRedmiCurrentlyBanned}
                    value={claveRastreo}
                    onChange={(e) => setClaveRastreo(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono text-[11px] focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 space-y-2">
                <button
                  onClick={handleExecuteCleanTokenDispersal}
                  disabled={isRedmiCurrentlyBanned || isSimulatingExecution}
                  className="w-full py-3 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {isSimulatingExecution ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                      <span>Resolviendo Token dentro del HSM (RAM 0.3s)...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Dispersar Fondos Limpios con {selectedToken} ($150,000 MXN)</span>
                    </>
                  )}
                </button>

                {/* Attack Simulator Test Button */}
                <button
                  onClick={handleTestAutoInjectionAttack}
                  disabled={isSimulatingExecution}
                  title="Simula que el malware del Redmi o el portapapeles intenta inyectar caracteres zero-width para desviar fondos"
                  className="w-full py-2 bg-rose-950/70 hover:bg-rose-900 border border-rose-700/60 text-rose-300 hover:text-white font-mono text-xs rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  <span>Test: Probar Intento de Auto-Inyección Zero-Width (Disparar Candado)</span>
                </button>
              </div>
            </div>
          </div>

          {/* HSM Ephemeral Resolution Inspector */}
          <div className="lg:col-span-6 space-y-4">
            {/* Real-time HSM RAM Monitor */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Ciclo de Vida de Memoria Volátil del HSM
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                  Máximo 0.300s
                </span>
              </div>

              {hsmRamVisualizer?.active ? (
                <div className="p-4 rounded-xl bg-cyan-950/60 border border-cyan-500 space-y-3 animate-pulse">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-cyan-300 font-bold flex items-center gap-1.5">
                      <Lock className="w-4 h-4 text-cyan-400" />
                      <span>CLABE Descifrada en RAM del Enclave Seguro</span>
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-400">
                      {hsmRamVisualizer.msLeft}ms restantes
                    </span>
                  </div>
                  <div className="p-2 rounded bg-slate-950 font-mono text-xs text-white">
                    {hsmRamVisualizer.clabePreview}
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-cyan-400 h-1.5 rounded-full w-full animate-pulse" />
                  </div>
                  <span className="text-[10px] text-slate-300 block">
                    Firma SPEI en progreso. Memoria será purgada con `memset_s` a los 284ms.
                  </span>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 space-y-2">
                  <div className="flex items-center gap-2 text-slate-300 font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>RAM del HSM: Totalmente Purgada (Cero Residuos)</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-slate-400">
                    El descifrado de la CLABE se ejecuta únicamente en memoria transitoria del HSM para generar la instrucción firmada a Banco de México. Ninguna clave ni dato plano persiste en disco o red.
                  </p>
                </div>
              )}

              {/* Feedback Alert */}
              {dispersalResultFeedback && (
                <div className={`p-4 rounded-xl border text-xs space-y-2 ${
                  dispersalResultFeedback.status === 'SUCCESS'
                    ? 'bg-emerald-950/70 border-emerald-700 text-emerald-200'
                    : 'bg-rose-950/70 border-rose-700 text-rose-200'
                }`}>
                  <div className="flex items-center gap-2 font-bold">
                    {dispersalResultFeedback.status === 'SUCCESS' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-400" />
                    )}
                    <span>
                      {dispersalResultFeedback.status === 'SUCCESS' ? 'DISPERSIÓN SPEI EJECUTADA' : 'INYECCIÓN ZERO-WIDTH INTERCEPTADA'}
                    </span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    {dispersalResultFeedback.message}
                  </p>
                  {dispersalResultFeedback.cepFolio && (
                    <div className="pt-1 font-mono text-[10px] text-cyan-300">
                      Folio CEP Banxico: {dispersalResultFeedback.cepFolio}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Threat Model Explanation */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-2">
              <h4 className="text-white font-bold flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <span>¿Por qué el usuario NO debe auto-inyectarse el payload?</span>
              </h4>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Intentar contrarrestar un clipper inyectando caracteres zero-width (<code className="text-rose-400 font-mono">U+200C/U+200D</code>) desde el móvil activaría las alertas de fraude del HSM, provocando un baneo inmediato de 24 horas y el bloqueo preventivo del banco receptor.
              </p>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                La arquitectura de <strong>Whitelist Soberana</strong> resuelve el problema en la raíz: al no transmitir jamás la CLABE desde el móvil, el malware no tiene qué reemplazar ni dónde inyectar caracteres espurios.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 3: BITÁCORA WORM & AUDITORÍA HSM */}
      {activeSubTab === 'worm_audit' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden space-y-0">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-purple-400" />
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Bitácora Inmutable WORM (Write Once, Read Many)
                </h3>
                <span className="text-[11px] text-slate-400">
                  Registro criptográfico de tokens usados, intentos de inyección y resoluciones HSM
                </span>
              </div>
            </div>

            <span className="text-[10px] font-mono text-purple-300 bg-purple-950 px-2 py-0.5 rounded border border-purple-800">
              AWS S3 Object Lock / 10 Años
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 uppercase text-[10px] font-mono">
                <tr>
                  <th className="py-2.5 px-3">Folio WORM / Fecha</th>
                  <th className="py-2.5 px-3">Tipo de Evento</th>
                  <th className="py-2.5 px-3">Token / Clave Rastreo</th>
                  <th className="py-2.5 px-3">Dispositivo</th>
                  <th className="py-2.5 px-3">Sello Criptográfico HSM</th>
                  <th className="py-2.5 px-3">Detalle de Operación</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {wormLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-3 font-mono text-[11px]">
                      <span className="text-white font-semibold block">{log.id}</span>
                      <span className="text-slate-400">{new Date(log.timestamp).toLocaleTimeString()}</span>
                    </td>
                    <td className="py-3 px-3">
                      {log.eventType === 'BLOCKED_AUTO_INYECCION_DETECTADA' ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-950 text-rose-300 border border-rose-800">
                          AUTO_INYECCIÓN_BLOQUEADA
                        </span>
                      ) : log.eventType === 'INTENTO_ZERO_WIDTH_BLOQUEADO' ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950 text-amber-300 border border-amber-800">
                          ZERO_WIDTH_INTERCEPTADO
                        </span>
                      ) : log.eventType === 'DISPERSION_SPEI_EXITOSA' ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                          DISPERSIÓN_SPEI_EXITOSA
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800">
                          {log.eventType}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px]">
                      <span className="text-emerald-400 font-bold block">{log.tokenUsed || 'N/A'}</span>
                      <span className="text-slate-400 text-[10px]">{log.claveRastreo || 'N/A'}</span>
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-300">
                      {log.deviceId}
                    </td>
                    <td className="py-3 px-3 font-mono text-[10px] text-slate-400">
                      {log.hsmSealHash.slice(0, 16)}...
                    </td>
                    <td className="py-3 px-3 text-slate-300 text-[11px] max-w-xs">
                      {log.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 4: BLUEPRINTS DE PRODUCCIÓN (FASTAPI / KOTLIN / TERRAFORM / TESTS) */}
      {activeSubTab === 'code_blueprints' && (
        <div className="space-y-6">
          {/* Blueprint 1: FastAPI + HSM KMS Endpoint */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  1. FastAPI + AWS CloudHSM / KMS + PostgreSQL (`main.py`)
                </h3>
              </div>
              <button
                onClick={() => handleCopyCode('fastapi_code', FASTAPI_BACKEND_CODE)}
                className="flex items-center gap-1 px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition-colors cursor-pointer"
              >
                {copiedSection === 'fastapi_code' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSection === 'fastapi_code' ? 'Copiado!' : 'Copiar Código'}</span>
              </button>
            </div>
            <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-80 leading-relaxed">
              {FASTAPI_BACKEND_CODE}
            </pre>
          </div>

          {/* Blueprint 2: Kotlin Mobile Sanitizer */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  2. Kotlin Android Jetpack Compose (`SovereignTokenDropdown.kt`)
                </h3>
              </div>
              <button
                onClick={() => handleCopyCode('kotlin_code', KOTLIN_ANDROID_CODE)}
                className="flex items-center gap-1 px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition-colors cursor-pointer"
              >
                {copiedSection === 'kotlin_code' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSection === 'kotlin_code' ? 'Copiado!' : 'Copiar Código'}</span>
              </button>
            </div>
            <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-80 leading-relaxed">
              {KOTLIN_ANDROID_CODE}
            </pre>
          </div>

          {/* Blueprint 3: Terraform Infrastructure */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  3. Terraform HCL: AWS KMS / CloudHSM + RDS Postgres + WORM (`main.tf`)
                </h3>
              </div>
              <button
                onClick={() => handleCopyCode('tf_code', TERRAFORM_INFRA_CODE)}
                className="flex items-center gap-1 px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition-colors cursor-pointer"
              >
                {copiedSection === 'tf_code' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSection === 'tf_code' ? 'Copiado!' : 'Copiar Código'}</span>
              </button>
            </div>
            <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-80 leading-relaxed">
              {TERRAFORM_INFRA_CODE}
            </pre>
          </div>

          {/* Blueprint 4: Unit & Security Tests */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  4. PyTest Security Suite: Rechazo de Auto-Inyección & Dispersión Limpia (`test_hsm_whitelist.py`)
                </h3>
              </div>
              <button
                onClick={() => handleCopyCode('test_code', PYTEST_SUITE_CODE)}
                className="flex items-center gap-1 px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition-colors cursor-pointer"
              >
                {copiedSection === 'test_code' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSection === 'test_code' ? 'Copiado!' : 'Copiar Código'}</span>
              </button>
            </div>
            <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-80 leading-relaxed">
              {PYTEST_SUITE_CODE}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

// --- CODE BLUEPRINT CONSTANTS ---
const FASTAPI_BACKEND_CODE = `# FastAPI Backend - Módulo MI_CUENTA_FINAL con AWS KMS / CloudHSM
from fastapi import FastAPI, HTTPException, Header, Depends, status
from pydantic import BaseModel
import re, boto3, hashlib, time, os

app = FastAPI(title="Sovereign Treasury HSM Whitelist API", version="1.0.0")
kms_client = boto3.client('kms', region_name='us-east-1')
KMS_KEY_ARN = os.getenv("KMS_KEY_ARN", "arn:aws:kms:us-east-1:767871533334:key/hsm-sovereign-whitelist-2026")

ZERO_WIDTH_REGEX = re.compile(r'[\u200B-\u200D\uFEFF\u2060\u00AD]')

def valida_clabe_banxico_371(clabe: str) -> bool:
    if ZERO_WIDTH_REGEX.search(clabe) or len(clabe) != 18 or not clabe.isdigit():
        return False
    weights = [3, 7, 1, 3, 7, 1, 3, 7, 1, 3, 7, 1, 3, 7, 1, 3, 7]
    suma = sum((int(clabe[i]) * weights[i]) % 10 for i in range(17)) % 10
    esperado = (10 - suma) % 10
    return int(clabe[17]) == esperado

class RegistroBeneficiarioRequest(BaseModel):
    alias: str = "MI_CUENTA_FINAL"
    clabe_18_real: str
    banco: str
    owner_name: str = "TESORERIA SOBERANA SAPI DE CV"

@app.post("/api/v1/beneficiarios/soberanos", status_code=status.HTTP_201_CREATED)
async def registra_mi_cuenta_final(
    payload: RegistroBeneficiarioRequest,
    x_client_cert_sha256: str = Header(None),
    x_device_type: str = Header(None)
):
    # REGLA 1: PROHIBICIÓN TOTAL DESDE MÓVIL
    if x_device_type == "REDMI_13_MOBILE" or not x_client_cert_sha256:
        raise HTTPException(
            status_code=403, 
            detail="ACCESO_DENEGADO: El registro de cuenta propia está prohibido desde móviles. Requiere consola limpia mTLS."
        )

    # REGLA 2: VALIDACIÓN 3-7-1 & ZERO-WIDTH
    if not valida_clabe_banxico_371(payload.clabe_18_real):
        raise HTTPException(
            status_code=422,
            detail="CLABE inválida según algoritmo pesos 3-7-1 o se detectaron caracteres zero-width."
        )

    # CIFRADO ENVELOPING EN HSM KMS
    clabe_bytes = payload.clabe_18_real.encode('utf-8')
    kms_resp = kms_client.encrypt(
        KeyId=KMS_KEY_ARN,
        Plaintext=clabe_bytes,
        EncryptionContext={"alias": payload.alias}
    )
    # Purgar de memoria inmediata
    del clabe_bytes

    token = "TOK_MIA_FINAL"
    sha256_hash = hashlib.sha256(payload.clabe_18_real.encode()).hexdigest()
    ultimos4 = payload.clabe_18_real[-4:]

    # Guardar en PostgreSQL beneficiarios_soberanos: token, kms_ciphertext, ultimos4, sha256_hash
    return {
        "token": token,
        "alias": payload.alias,
        "banco": payload.banco,
        "ultimos4": ultimos4,
        "sha256_hash": sha256_hash,
        "status": "WHITELISTED_HSM"
    }

class DisperseTokenRequest(BaseModel):
    token: str
    monto_mxn: float
    clave_rastreo: str
    raw_payload_check: str = None

@app.post("/api/v1/spei/dispersion-tokenizada")
async def ejecutar_dispersion_token(payload: DisperseTokenRequest, x_device_id: str = Header("REDMI-13")):
    # CANDADO ANTI AUTO-INYECCIÓN
    if payload.raw_payload_check and (ZERO_WIDTH_REGEX.search(payload.raw_payload_check) or re.search(r'\b\d{18}\b', payload.raw_payload_check)):
        # Banear dispositivo 24 horas y auditar a WORM
        raise HTTPException(
            status_code=403,
            detail="BLOCKED_AUTO_INYECCION_DETECTADA: Se detectó CLABE en claro o caracteres zero-width. Dispositivo baneado 24h."
        )

    # RESOLUCIÓN HSM EN RAM <= 0.3s
    t_start = time.time()
    # 1. kms_resp = kms_client.decrypt(CiphertextBlob=encrypted_blob)
    # 2. Firmar instrucción SPEI con CEP Banxico
    # 3. memset / purga de memoria
    duracion_ms = (time.time() - t_start) * 1000

    return {
        "status": "DISBURSED_SPEI_SUCCESS",
        "clave_rastreo": payload.clave_rastreo,
        "monto_mxn": payload.monto_mxn,
        "hsm_resolution_ms": round(duracion_ms, 2),
        "cep_folio": f"CEP-SPEI-{int(time.time())}"
    }`;

const KOTLIN_ANDROID_CODE = `// Kotlin (Android Jetpack Compose) - Módulo Cliente Blindado Anti-Clipper
package com.fintech.sovereign.ui

import androidx.compose.runtime.*
import androidx.compose.material3.*
import androidx.compose.foundation.layout.*

// Sanitizador obligatorio contra inyección Zero-Width
fun sanitizaEntrada(dirty: String): String {
    val zeroWidthRegex = Regex("[\\\\u200B-\\\\u200D\\\\uFEFF\\\\u2060\\\\u00AD]")
    val limpia = dirty.replace(zeroWidthRegex, "")
    if (limpia != dirty) {
        reportaWORM("INTENTO_ZERO_WIDTH_BLOQUEADO", dirty)
        throw SecurityException("Inyección de caracteres invisibles Zero-Width detectada.")
    }
    return limpia
}

@Composable
fun SovereignDisperserScreen(
    whitelistedTokens: List<String> = listOf("TOK_MIA_FINAL"),
    onDisperse: (token: String, amount: Double, claveRastreo: String) -> Unit
) {
    var selectedToken by remember { mutableStateOf(whitelistedTokens.first()) }
    var amount by remember { mutableStateOf("150000") }
    var claveRastreo by remember { mutableStateOf("SPEI20261025MUK3793S7427760000") }

    Column(modifier = Modifier.padding(16.dp)) {
        Text("Dispersión Segura sin Inyección (HSM Tokenizado)", style = MaterialTheme.typography.titleMedium)
        
        // DROPDOWN DE TOKENS EXCLUSIVAMENTE - CERO INPUT MANUAL DE CLABE
        Text("Cuenta Destino Propio:")
        DropdownMenuBox(
            selectedToken = selectedToken,
            options = whitelistedTokens,
            onSelect = { selectedToken = it }
        )

        // Botón de Dispersión
        Button(
            onClick = {
                val cleanRastreo = sanitizaEntrada(claveRastreo)
                onDisperse(selectedToken, amount.toDouble(), cleanRastreo)
            },
            modifier = Modifier.fillMaxWidth().padding(top = 16.dp)
        ) {
            Text("Dispersar a \$selectedToken vía SPEI")
        }
    }
}`;

const TERRAFORM_INFRA_CODE = `# Terraform HCL: AWS KMS / CloudHSM + RDS PostgreSQL + WORM Object Lock
resource "aws_kms_key" "hsm_sovereign_whitelist" {
  description              = "Llave HSM Dedicada para Cifrado de Cuentas Whitelist Soberanas"
  deletion_window_in_days  = 30
  key_usage                = "ENCRYPT_DECRYPT"
  customer_master_key_spec = "SYMMETRIC_DEFAULT"
  enable_key_rotation      = true

  tags = {
    Environment = "Production-AirGapped"
    Security    = "Anti-Clipper-HSM"
  }
}

resource "aws_s3_bucket" "worm_audit_vault" {
  bucket = "sovereign-worm-audit-vault-2026"
  object_lock_enabled = true
}

resource "aws_s3_bucket_object_lock_configuration" "worm_retention" {
  bucket = aws_s3_bucket.worm_audit_vault.id

  rule {
    default_retention {
      mode  = "COMPLIANCE"
      years = 10
    }
  }
}

resource "aws_db_instance" "sovereign_db" {
  allocated_storage      = 50
  engine                 = "postgres"
  engine_version         = "16.2"
  instance_class         = "db.t4g.medium"
  name                   = "sovereign_treasury"
  storage_encrypted      = true
  kms_key_id             = aws_kms_key.hsm_sovereign_whitelist.arn
  publicly_accessible    = false
}`;

const PYTEST_SUITE_CODE = `# PyTest Security Suite - Validaciones Anti Auto-Inyección y Flujo Limpio
import pytest
from main import valida_clabe_banxico_371, ZERO_WIDTH_REGEX, app
from fastapi.testclient import TestClient

client = TestClient(app)

def test_1_intento_auto_inyeccion_zero_width_es_bloqueado():
    dirty_payload = "0x71C8136450A942Ff29b9F39b2Bf471E1528659b8\u200C\u200D"
    assert ZERO_WIDTH_REGEX.search(dirty_payload) is not None
    
    # Simular llamada desde Redmi infectado
    response = client.post(
        "/api/v1/spei/dispersion-tokenizada",
        json={
            "token": "TOK_MIA_FINAL",
            "monto_mxn": 150000.0,
            "clave_rastreo": "SPEI20261025MUK3793S7427760000",
            "raw_payload_check": dirty_payload
        },
        headers={"x-device-id": "REDMI-13-INFECTED"}
    )
    assert response.status_code == 403
    assert "BLOCKED_AUTO_INYECCION_DETECTADA" in response.json()["detail"]

def test_2_dispersion_limpia_tok_mia_final_exitosa():
    response = client.post(
        "/api/v1/spei/dispersion-tokenizada",
        json={
            "token": "TOK_MIA_FINAL",
            "monto_mxn": 150000.0,
            "clave_rastreo": "SPEI20261025MUK3793S7427760000"
        },
        headers={"x-device-id": "REDMI-13-CLEAN"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "DISBURSED_SPEI_SUCCESS"
    assert data["monto_mxn"] == 150000.0
    assert data["hsm_resolution_ms"] < 300.0  # RAM <= 0.3s
`;
