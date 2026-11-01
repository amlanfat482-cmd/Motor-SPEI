import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Terminal, 
  Cpu, 
  Server, 
  Lock, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Database, 
  Layers, 
  Key, 
  ArrowRight, 
  Copy, 
  Check, 
  Radio, 
  FileCode, 
  Activity, 
  ScanFace, 
  Zap, 
  Code2, 
  ShieldAlert,
  ChevronRight,
  ExternalLink,
  Package,
  Download
} from 'lucide-react';
import { SPEI_POM_XML, SPEI_APPLICATION_YML } from '../config/speiPomConfig';

type AuditTab = 'overview' | 'spei_pom_config' | 'module1_sync' | 'module2_webhook' | 'fallback_cron' | 'biometrics_liveness' | 'checklist' | 'code_blueprints';

export const SpeiMainnetArchitectureAudit: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AuditTab>('overview');
  const [copiedCodeSnippet, setCopiedCodeSnippet] = useState<string | null>(null);

  // --- Interactive Sandbox: Module 1 (Sync Release & Idempotency) ---
  const [syncClaveRastreo, setSyncClaveRastreo] = useState('202610178492019482');
  const [syncAmount, setSyncAmount] = useState(25000);
  const [simulatedHttpStatus, setSimulatedHttpStatus] = useState<'202_ACCEPTED' | '400_INVALID' | '401_UNAUTHORIZED' | '422_INSUFFICIENT_FUNDS' | 'TIMEOUT_NETWORK'>('202_ACCEPTED');
  const [isSimulatingSync, setIsSimulatingSync] = useState(false);
  const [syncConsoleLog, setSyncConsoleLog] = useState<string[]>([]);
  const [idempotencyLocked, setIdempotencyLocked] = useState(false);

  // --- Interactive Sandbox: Module 2 (Webhook HMAC & Immediate Ack) ---
  const [webhookSecret, setWebhookSecret] = useState('whsec_spei_prod_7f99b1a29c0d48419f8e4e7d9b2');
  const [webhookClaveRastreo, setWebhookClaveRastreo] = useState('202610178492019482');
  const [webhookStatusPayload, setWebhookStatusPayload] = useState<'LIQUIDATED' | 'REJECTED_FONDOS' | 'CANCELLED_BANXICO'>('LIQUIDATED');
  const [webhookSignatureValid, setWebhookSignatureValid] = useState(true);
  const [webhookTimestampOffsetSec, setWebhookTimestampOffsetSec] = useState(12); // seconds ago
  const [webhookLogs, setWebhookLogs] = useState<string[]>([]);
  const [isSimulatingWebhook, setIsSimulatingWebhook] = useState(false);

  // --- Interactive Sandbox: Fallback Polling (Limbo Cron) ---
  const [limboTransactions, setLimboTransactions] = useState([
    { id: 'TX-901', clave_rastreo: '202610170001847120', status: 'SUBMITTED', elapsedMinutes: 7.4, amount: 84000, bank: 'BBVA México (012)' },
    { id: 'TX-902', clave_rastreo: '202610170001847121', status: 'SUBMITTED', elapsedMinutes: 12.1, amount: 150000, bank: 'Banorte (072)' },
    { id: 'TX-903', clave_rastreo: '202610170001847122', status: 'SUBMITTED', elapsedMinutes: 2.1, amount: 35000, bank: 'Banco del Bienestar (166)' } // Not eligible (<5 min)
  ]);
  const [cronLogs, setCronLogs] = useState<string[]>([]);
  const [isPollingRunning, setIsPollingRunning] = useState(false);

  // Copy helper
  const handleCopyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeSnippet(id);
    setTimeout(() => setCopiedCodeSnippet(null), 2000);
  };

  // Download pom.xml helper
  const handleDownloadPom = () => {
    const blob = new Blob([SPEI_POM_XML], { type: 'application/xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'pom.xml';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Run Sync Release Simulation
  const handleRunSyncSimulation = () => {
    setIsSimulatingSync(true);
    const logs: string[] = [];
    const timestamp = new Date().toISOString();

    logs.push(`[${timestamp}] [ACID_TX_START] Iniciando reserva de saldo ($${syncAmount.toLocaleString()} MXN)...`);
    logs.push(`[${timestamp}] [DB_LOCK] SELECT balance_mxn FROM vault_accounts WHERE id='VAULT-01' FOR UPDATE;`);
    logs.push(`[${timestamp}] [DB_UPDATE] Saldo reservado con éxito. Estado local: 'PENDING_DISPATCH'`);

    setTimeout(() => {
      logs.push(`[${timestamp}] [REDIS_IDEMPOTENCY] SET lock:spei:${syncClaveRastreo} "PROCESSING" EX 300 NX`);
      logs.push(`[${timestamp}] [REDIS_OK] Candado distribuido adquirido. Clave de rastreo única garantizada.`);
      
      if (simulatedHttpStatus === '202_ACCEPTED') {
        logs.push(`[${timestamp}] [HTTP_OUTBOUND] POST /v1/spei/disperse -> Enviado al proveedor SPEI`);
        logs.push(`[${timestamp}] [HTTP_RESPONSE] <-- HTTP 202 ACCEPTED (Latency: 284ms)`);
        logs.push(`[${timestamp}] [THREAD_RELEASE] Liberando worker thread HTTP inmediatamente!`);
        logs.push(`[${timestamp}] [STATE_TRANSITION] Transacción marcada como 'SUBMITTED'. Esperando Webhook asíncrono.`);
        setIdempotencyLocked(true);
      } else if (simulatedHttpStatus === 'TIMEOUT_NETWORK') {
        logs.push(`[${timestamp}] [HTTP_OUTBOUND] POST /v1/spei/disperse (Connection Timeout 5000ms)`);
        logs.push(`[${timestamp}] [NETWORK_FAIL] ETIMEDOUT: No se recibió ACK HTTP del proveedor.`);
        logs.push(`[${timestamp}] [SAFE_PROTOCOL] REGLA DE ORO: NO REVERTIR SALDO A CIEGAS. Se marca como 'SUBMITTED_UNKNOWN'.`);
        logs.push(`[${timestamp}] [DELEGATE_FALLBACK] Clave de rastreo delegada al Cron de Reconciliación (GET /transaction).`);
      } else if (simulatedHttpStatus === '400_INVALID') {
        logs.push(`[${timestamp}] [HTTP_RESPONSE] <-- HTTP 400 BAD_REQUEST {"code":"INVALID_CLABE_DIGIT"}`);
        logs.push(`[${timestamp}] [ROLLBACK] Reversión de fondos inmediata: fondos devueltos a saldo disponible.`);
        logs.push(`[${timestamp}] [REDIS_DEL] DEL lock:spei:${syncClaveRastreo}`);
      } else if (simulatedHttpStatus === '401_UNAUTHORIZED') {
        logs.push(`[${timestamp}] [HTTP_RESPONSE] <-- HTTP 401 UNAUTHORIZED {"error":"JWT_EXPIRED"}`);
        logs.push(`[${timestamp}] [CIRCUIT_BREAKER] Activando Circuit Breaker de Auth. Renovando Bearer Token vía OAuth2.`);
        logs.push(`[${timestamp}] [RETRY_QUEUE] Transacción re-encolada en cola de reintentos rápidos de autenticación.`);
      } else if (simulatedHttpStatus === '422_INSUFFICIENT_FUNDS') {
        logs.push(`[${timestamp}] [HTTP_RESPONSE] <-- HTTP 422 UNPROCESSABLE_ENTITY {"code":"PROVIDER_BALANCE_EXHAUSTED"}`);
        logs.push(`[${timestamp}] [ALERT] Alerta P1 disparada a Tesorería: Saldo insuficiente en cuenta concentradora SPEI.`);
        logs.push(`[${timestamp}] [STATE_TRANSITION] Estado: 'HELD_RETRY_PENDING_CONCENTRATION'`);
      }

      setSyncConsoleLog(logs);
      setIsSimulatingSync(false);
    }, 600);
  };

  // Run Webhook Simulation
  const handleRunWebhookSimulation = () => {
    setIsSimulatingWebhook(true);
    const logs: string[] = [];
    const now = Math.floor(Date.now() / 1000);
    const webhookTs = now - webhookTimestampOffsetSec;

    logs.push(`[INGRESS] POST /api/v1/spei/webhooks/settlement`);
    logs.push(`[HEADERS] X-Signature: ${webhookSignatureValid ? 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855' : 'invalid_tampered_signature_9999'}`);
    logs.push(`[HEADERS] X-Timestamp: ${webhookTs} (Offset: ${webhookTimestampOffsetSec}s)`);

    setTimeout(() => {
      // 1. Timestamp drift replay attack check
      if (webhookTimestampOffsetSec > 300) {
        logs.push(`[REPLAY_DETECTED] ❌ RECHAZADO: Timestamp excede ventana de tolerancia de 300s (5m). Posible Replay Attack.`);
        logs.push(`[HTTP_RESPONSE] <-- HTTP 400 Bad Request`);
        setWebhookLogs(logs);
        setIsSimulatingWebhook(false);
        return;
      }
      logs.push(`[TIMESTAMP_OK] ✅ Timestamp dentro de ventana de validez (< 300s).`);

      // 2. HMAC-SHA256 Timing-Safe check
      if (!webhookSignatureValid) {
        logs.push(`[HMAC_FAIL] ❌ Firma HMAC-SHA256 INVÁLIDA. crypto.timingSafeEqual devolvió false.`);
        logs.push(`[HTTP_RESPONSE] <-- HTTP 401 Unauthorized (Firma no auténtica)`);
        setWebhookLogs(logs);
        setIsSimulatingWebhook(false);
        return;
      }
      logs.push(`[HMAC_OK] ✅ Firma HMAC-SHA256 VÁLIDA verificada con crypto.timingSafeEqual().`);

      // 3. Immediate ACK 200
      logs.push(`[IMMEDIATE_ACK] ⚡ Respondiendo HTTP 200 OK en 14ms para liberar al proveedor SPEI.`);
      logs.push(`[MESSAGE_QUEUE] 📦 Payload publicado en Redis BullMQ/RabbitMQ (Stream: 'spei.settlement.events').`);
      logs.push(`[WORKER_ACID] ⚙️ Worker asíncrono toma evento en background:`);
      
      if (webhookStatusPayload === 'LIQUIDATED') {
        logs.push(`[WORKER_DB] Transacción ${webhookClaveRastreo} actualizada: 'SUBMITTED' -> 'LIQUIDATED'.`);
        logs.push(`[WORKER_CEP] CEP Banxico generado y almacenado. Notificación enviada al usuario.`);
      } else {
        logs.push(`[WORKER_DB] Transacción ${webhookClaveRastreo} marcada como 'REJECTED'.`);
        logs.push(`[WORKER_REFUND] Fondos reservados des-retenidos y acreditados nuevamente a cuenta origen.`);
      }

      setWebhookLogs(logs);
      setIsSimulatingWebhook(false);
    }, 500);
  };

  // Run Limbo Cron Simulation
  const handleRunLimboCron = () => {
    setIsPollingRunning(true);
    const logs: string[] = [];
    logs.push(`[CRON_START] [${new Date().toISOString()}] Ejecutando Job: spei_reconciliation_limbo_worker (Cada 60s)`);
    logs.push(`[DB_QUERY] SELECT * FROM spei_outbound WHERE status='SUBMITTED' AND created_at < NOW() - INTERVAL '5 minutes';`);

    setTimeout(() => {
      const eligible = limboTransactions.filter((tx) => tx.elapsedMinutes >= 5 && tx.status === 'SUBMITTED');
      logs.push(`[SCAN_RESULT] Encontradas ${eligible.length} transacciones en limbo (> 5 minutos sin Webhook).`);

      eligible.forEach((tx) => {
        logs.push(`[POLLING] GET /v1/spei/transactions/${tx.clave_rastreo} ...`);
        logs.push(`[PROVIDER_SYNC] Respuesta proveedor: Estado en red Banxico: LIQUIDATED.`);
        logs.push(`[HOMOLOGATED] Transacción ${tx.id} sincronizada a 'LIQUIDATED' forzadamente vía Polling.`);
      });

      // Update state
      setLimboTransactions((prev) =>
        prev.map((tx) =>
          tx.elapsedMinutes >= 5 && tx.status === 'SUBMITTED'
            ? { ...tx, status: 'LIQUIDATED (Via Fallback)' }
            : tx
        )
      );

      logs.push(`[CRON_FINISH] Job finalizado. 0 transacciones duplicadas.`);
      setCronLogs(logs);
      setIsPollingRunning(false);
    }, 600);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner: Senior Software Architect SPEI Audit Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-500/40 font-mono tracking-wider">
                MAINNET ARCHITECTURE AUDIT
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-950 text-cyan-300 border border-cyan-700/50 font-mono">
                SPEI BANXICO · CNBV
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-950 text-amber-300 border border-amber-700/50 font-mono flex items-center gap-1">
                <Package className="w-3 h-3 text-amber-400" />
                <span>spei-disperser-engine:1.0.0-RELEASE (Spring Boot 3.3.4)</span>
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <span>Auditoría de Arquitectura de Backend SPEI</span>
              <span className="text-xs font-normal text-slate-400">| Protocolos Híbridos Síncrono/Asíncrono & e.firma Criptográfica</span>
            </h1>

            <p className="text-xs text-slate-400 max-w-3xl leading-relaxed">
              Dictamen técnico de alta disponibilidad y tolerancia a fallos para dispersión y recepción de fondos en Mainnet. 
              Evaluación estricta de idempotencia, liberación de hilos (HTTP 202), validación HMAC-SHA256, colas de mensajería desacopladas y 
              firma digital e.firma sin almacenamiento de datos biométricos.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-right font-mono">
              <span className="text-[10px] text-slate-400 block">SLA de Liquidación</span>
              <span className="text-xs font-bold text-emerald-400">&lt; 300ms Outbound / 20ms Ack</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 mt-6 border-t border-slate-800/80 pt-4 overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'overview'
                ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 font-semibold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Diagrama & Visión Global</span>
          </button>

          <button
            onClick={() => setActiveTab('spei_pom_config')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'spei_pom_config'
                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/40 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Package className="w-3.5 h-3.5 text-amber-400" />
            <span>pom.xml (Spring Boot 3.3.4)</span>
          </button>

          <button
            onClick={() => setActiveTab('module1_sync')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'module1_sync'
                ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 font-semibold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>1. Protocolo de Liberación (Síncrono)</span>
          </button>

          <button
            onClick={() => setActiveTab('module2_webhook')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'module2_webhook'
                ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 font-semibold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>2. Protocolo de Recepción (Webhooks)</span>
          </button>

          <button
            onClick={() => setActiveTab('fallback_cron')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'fallback_cron'
                ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 font-semibold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>3. Polling de Respaldo (Limbo Cron)</span>
          </button>

          <button
            onClick={() => setActiveTab('biometrics_liveness')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'biometrics_liveness'
                ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 font-semibold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>4. e.firma Criptográfica (Sin Biometría)</span>
          </button>

          <button
            onClick={() => setActiveTab('code_blueprints')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'code_blueprints'
                ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 font-semibold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Blueprints de Producción (Node/TS)</span>
          </button>

          <button
            onClick={() => setActiveTab('checklist')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'checklist'
                ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 font-semibold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Checklist Mainnet (20 Controles)</span>
          </button>
        </div>
      </div>

      {/* TAB: MAVEN POM.XML & SPRING BOOT 3.3.4 SPEI CONFIGURATION */}
      {activeTab === 'spei_pom_config' && (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/40 rounded-xl p-5 shadow-xl relative overflow-hidden">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-950 text-amber-300 border border-amber-500/40 font-mono">
                    MAVEN POM CONFIGURATION
                  </span>
                  <span className="px-2 py-0.5 rounded text-xs font-mono bg-slate-800 text-slate-300 border border-slate-700">
                    Java 21 LTS (Virtual Threads)
                  </span>
                  <span className="px-2 py-0.5 rounded text-xs font-mono bg-emerald-950 text-emerald-300 border border-emerald-800/50">
                    Spring Boot 3.3.4 Parent
                  </span>
                </div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Package className="w-5 h-5 text-amber-400" />
                  <span>Configuración del Motor SPEI: <code className="text-amber-300 font-mono">spei-disperser-engine:1.0.0-RELEASE</code></span>
                </h2>
                <p className="text-xs text-slate-400 max-w-3xl">
                  Configuración Maven POM oficial para el backend corporativo de dispersión SPEI en Mainnet bajo Spring Boot 3.3.4, integrando candados distribuidos de idempotencia (Redisson), criptografía HMAC-SHA256 (Bouncy Castle) y reconciliación resiliente de transacciones en limbo.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap shrink-0">
                <button
                  onClick={() => handleCopyCode('pom_full', SPEI_POM_XML)}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedCodeSnippet === 'pom_full' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-amber-400" />}
                  <span>{copiedCodeSnippet === 'pom_full' ? 'Copiado!' : 'Copiar pom.xml'}</span>
                </button>
                <button
                  onClick={handleDownloadPom}
                  className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-lg shadow-amber-950/40 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-slate-950" />
                  <span>Descargar pom.xml</span>
                </button>
              </div>
            </div>

            {/* Coordinates Grid */}
            <div className="mt-4 pt-4 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="p-2.5 rounded bg-slate-950/70 border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase">Parent Group & Version:</span>
                <span className="text-emerald-400 font-bold">spring-boot-starter-parent:3.3.4</span>
              </div>
              <div className="p-2.5 rounded bg-slate-950/70 border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase">Engine GroupId:</span>
                <span className="text-cyan-300 font-bold">com.fintech.spei</span>
              </div>
              <div className="p-2.5 rounded bg-slate-950/70 border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase">Engine ArtifactId:</span>
                <span className="text-amber-300 font-bold">spei-disperser-engine</span>
              </div>
              <div className="p-2.5 rounded bg-slate-950/70 border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase">Engine Release Version:</span>
                <span className="text-purple-300 font-bold">1.0.0-RELEASE</span>
              </div>
            </div>
          </div>

          {/* Section 1: Required XML Snippet */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white">1. Especificación Solicitada de Configuración Maven POM</h3>
              </div>
              <button
                onClick={() => handleCopyCode('pom_snippet', `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 
         https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.3.4</version>
        <relativePath/>
    </parent>

    <groupId>com.fintech.spei</groupId>
    <artifactId>spei-disperser-engine</artifactId>
    <version>1.0.0-RELEASE</version>`)}
                className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white px-2.5 py-1 bg-slate-800 rounded border border-slate-700 cursor-pointer"
              >
                {copiedCodeSnippet === 'pom_snippet' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCodeSnippet === 'pom_snippet' ? 'Copiado!' : 'Copiar Snippet'}</span>
              </button>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-amber-300/90 leading-relaxed overflow-x-auto">
              <pre>{`<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 
         https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.3.4</version>
        <relativePath/>
    </parent>

    <groupId>com.fintech.spei</groupId>
    <artifactId>spei-disperser-engine</artifactId>
    <version>1.0.0-RELEASE</version>`}</pre>
            </div>
          </div>

          {/* Section 2: Complete pom.xml File Viewer */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-cyan-400" />
                <div>
                  <h3 className="text-sm font-bold text-white">2. Archivo pom.xml Completo de Producción (/pom.xml)</h3>
                  <p className="text-[11px] text-slate-400">Incluye starters de Spring Boot 3.3.4, Bouncy Castle (HMAC), Redisson (Locks de Idempotencia) y Actuator</p>
                </div>
              </div>
              <button
                onClick={() => handleCopyCode('pom_full_view', SPEI_POM_XML)}
                className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white px-2.5 py-1 bg-slate-800 rounded border border-slate-700 cursor-pointer"
              >
                {copiedCodeSnippet === 'pom_full_view' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCodeSnippet === 'pom_full_view' ? 'Copiado!' : 'Copiar Archivo'}</span>
              </button>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-300 leading-relaxed overflow-x-auto max-h-96">
              <pre className="text-cyan-300/90 whitespace-pre">{SPEI_POM_XML}</pre>
            </div>
          </div>

          {/* Section 3: Spring Boot application.yml Configuration */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-emerald-400" />
                <div>
                  <h3 className="text-sm font-bold text-white">3. Configuración de Parámetros de Red SPEI (application.yml)</h3>
                  <p className="text-[11px] text-slate-400">Virtual Threads Java 21, Timeouts HTTP, TTL de Candados Redis y Cron de Reconciliación Limbo</p>
                </div>
              </div>
              <button
                onClick={() => handleCopyCode('yml_config', SPEI_APPLICATION_YML)}
                className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white px-2.5 py-1 bg-slate-800 rounded border border-slate-700 cursor-pointer"
              >
                {copiedCodeSnippet === 'yml_config' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCodeSnippet === 'yml_config' ? 'Copiado!' : 'Copiar YML'}</span>
              </button>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-300 leading-relaxed overflow-x-auto max-h-72">
              <pre className="text-emerald-300/90 whitespace-pre">{SPEI_APPLICATION_YML}</pre>
            </div>
          </div>
        </div>
      )}

      {/* TAB 1: OVERVIEW & SEQUENCE ARCHITECTURE */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Executive Architecture Summary Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Zap className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-white">1. Liberación Síncrona</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Control estricto de Idempotencia mediante clave de rastreo (`SETNX lock:spei:clave`). Respuesta rápida tras HTTP 202 (Accepted) y liberación del hilo en &lt; 300ms.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-2">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Radio className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-white">2. Webhooks Event-Driven</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Autenticación criptográfica con HMAC-SHA256 y comparación timing-safe. Ack inmediato (HTTP 200 en &lt; 25ms) delegando el procesamiento a colas de mensajería (BullMQ/RabbitMQ).
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-2">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <ScanFace className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-white">3. Biometría & Prueba de Vida</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Prueba de vida activa y pasiva bajo estándar ISO/IEC 30107-3 PAD. Generación de atestación criptográfica ligada a la clave de rastreo SPEI y RFC del firmante.
              </p>
            </div>
          </div>

          {/* ASCII / Interactive Architectural Sequence Diagram */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <span>Diagrama de Secuencia de Alta Disponibilidad: Flujo Híbrido SPEI Mainnet</span>
              </h2>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-1 rounded border border-slate-800">
                Fail-Safe & Zero-Double-Spend Guarantee
              </span>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-300 leading-relaxed overflow-x-auto whitespace-pre">
{`+----------------+       +-------------------+       +-----------------+       +--------------------+
|  Client / UI   |       |  Backend Gateway  |       |   Redis / Queue |       | SPEI Provider API  |
+----------------+       +-------------------+       +-----------------+       +--------------------+
       |                           |                          |                          |
       | 1. POST /spei/disperse    |                          |                          |
       |    (Biometric Token +     |                          |                          |
       |     Clave de Rastreo)     |                          |                          |
       |-------------------------->|                          |                          |
       |                           | 2. DB ACID Lock: Retener saldo local                |
       |                           |    Redis SETNX lock:spei:{clave}                    |
       |                           |------------------------->|                          |
       |                           | 3. POST /v1/disperse (Idempotency Key: clave)       |
       |                           |---------------------------------------------------->|
       |                           |                                                     |
       |                           | 4. HTTP 202 ACCEPTED (Status: 'SUBMITTED')          |
       |                           |<----------------------------------------------------|
       |                           |                                                     |
       | 5. HTTP 202 Dispatched    | [LIBERAR HILO HTTP EN <300ms]                       |
       |<--------------------------|                                                     |
       |                           |                                                     |
       |        ... (Tiempo Asíncrono de Liquidación en Red Banxico 1s - 5s) ...        |
       |                           |                                                     |
       |                           | 6. POST /webhooks/spei (HMAC-SHA256 + Nonce)        |
       |                           |<----------------------------------------------------|
       |                           |                                                     |
       |                           | 7. Verificar Firma timingSafeEqual() & Window < 5m  |
       |                           |    Publicar evento en BullMQ/RabbitMQ               |
       |                           |------------------------->|                          |
       |                           | 8. HTTP 200 OK (< 25ms ACK para evitar reintentos)  |
       |                           |---------------------------------------------------->|
       |                           |                                                     |
       |                           |                9. Worker asíncrono extrae evento    |
       |                           |                   Actualiza DB: 'LIQUIDATED'        |
       |                           |                   Genera CEP Banxico                |
       |                           |<-------------------------|                          |
       |                           |                                                     |
       |   [FALLBACK RECONCILER CRON (Cada 60s)]                                         |
       |   Si status='SUBMITTED' > 5 minutos sin Webhook:                                |
       |   Backend Gateway ejecuta GET /v1/transaction/{clave}                           |
       |   y homologa estado contra CEP Oficial de Banxico.                              |
       v                           v                          v                          v`}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MODULE 1 - SYNCHRONOUS RELEASE PROTOCOL */}
      {activeTab === 'module1_sync' && (
        <div className="space-y-6">
          {/* Theory & Architecture Rules */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>1. Estrategia de Idempotencia Estricta</span>
              </h2>
              
              <div className="text-xs text-slate-300 space-y-3 leading-relaxed">
                <p>
                  <strong className="text-white">Regla de Oro en Mainnet:</strong> Una petición HTTP fallida o con timeout (ETIMEDOUT / ECONNRESET) <em>NUNCA</em> debe reintentarse sin reutilizar exactamente la misma <code className="text-emerald-400 bg-slate-950 px-1 py-0.5 rounded">clave_rastreo</code> única de 18 o 30 dígitos.
                </p>
                <ul className="list-disc list-inside space-y-2 text-slate-400">
                  <li>
                    <strong className="text-slate-200">Doble Candado (Redis + RDBMS):</strong> En Redis se adquiere un lock distribuido:
                    <br />
                    <code className="text-cyan-300 bg-slate-950 px-1 py-0.5 rounded text-[11px]">SET lock:spei:&#123;clave_rastreo&#125; "IN_PROGRESS" NX EX 300</code>.
                    En PostgreSQL la tabla <code className="text-cyan-300">spei_transfers</code> contiene un constraint <code className="text-cyan-300">UNIQUE (clave_rastreo)</code>.
                  </li>
                  <li>
                    <strong className="text-slate-200">Anti-Doble Cargo ante Timeout:</strong> Si ocurre un timeout en el POST síncrono, el backend marca la orden como <code className="text-amber-400">SUBMITTED_UNKNOWN</code>. <strong className="text-rose-400">Queda estrictamente prohibido revertir el saldo retenido automáticamente</strong> sin haber consultado previamente el estado en Banxico.
                  </li>
                </ul>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Cpu className="w-4 h-4 text-cyan-400" />
                <span>2. Liberación Inmediata del Hilo (HTTP 202)</span>
              </h2>
              
              <div className="text-xs text-slate-300 space-y-3 leading-relaxed">
                <p>
                  <strong className="text-white">Anti-Congelamiento de Servidor:</strong> En eventos de alta concurrencia (días de quincena o quiebre de volatilidad de mercado), retener el hilo HTTP del backend esperando la liquidación final satura el pool de conexiones (Thread Starvation).
                </p>
                <ul className="list-disc list-inside space-y-2 text-slate-400">
                  <li>
                    <strong className="text-slate-200">HTTP 202 Accepted Contract:</strong> Tan pronto como el proveedor SPEI responde con <code className="text-emerald-400">HTTP 202</code> o código <code className="text-emerald-400">SUBMITTED</code>, el worker HTTP debe responder al cliente en &lt; 300ms.
                  </li>
                  <li>
                    <strong className="text-slate-200">Timeout Síncrono Corto:</strong> Se debe configurar un timeout estricto de socket de <strong>4,000 ms</strong> en el cliente HTTP (ej. Axios/Fetch). Si el proveedor tarda más de 4s, se asume enviado y se delega al proceso asíncrono.
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Exception Handling Protocol Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>3. Protocolo de Acción ante Excepciones Inmediatas (400, 401, 422)</span>
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-800">
                <thead className="bg-slate-950 text-slate-300 font-mono text-[11px] border-b border-slate-800">
                  <tr>
                    <th className="p-3">Código HTTP</th>
                    <th className="p-3">Diagnóstico Mainnet</th>
                    <th className="p-3">Acción Inmediata sobre Fondos</th>
                    <th className="p-3">Acción sobre el Lock & Red</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-slate-300 font-mono text-[11px]">
                  <tr className="hover:bg-slate-800/40">
                    <td className="p-3 font-bold text-rose-400">HTTP 400 Bad Request</td>
                    <td className="p-3">Dígito verificador de CLABE inválido, RFC malformado o concepto no permitido.</td>
                    <td className="p-3 text-emerald-400">Rollback Inmediato: Devolver saldo retenido al balance disponible de la cuenta.</td>
                    <td className="p-3 text-slate-400">Liberar Redis Lock (<code className="text-cyan-300">DEL lock:spei:clave</code>). Marcar registro como <code className="text-rose-400">FAILED_VALIDATION</code>.</td>
                  </tr>
                  <tr className="hover:bg-slate-800/40">
                    <td className="p-3 font-bold text-amber-400">HTTP 401 Unauthorized</td>
                    <td className="p-3">Token OAuth/JWT expirado o firma digital de la API rechazada.</td>
                    <td className="p-3 text-amber-300">Mantener Saldo Retenido (Freeze): No rollback inmediato.</td>
                    <td className="p-3 text-slate-400">
                      Disparar <strong className="text-white">Token Refresh Worker</strong> vía Circuit Breaker. Reintentar con el nuevo token sin regenerar la clave de rastreo.
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-800/40">
                    <td className="p-3 font-bold text-rose-500">HTTP 422 Unprocessable</td>
                    <td className="p-3">Saldo insuficiente en la cuenta concentradora del proveedor SPEI (STP/Banxico).</td>
                    <td className="p-3 text-amber-300">Mantener Saldo Retenido: Transacción en cola de espera de concentración.</td>
                    <td className="p-3 text-slate-400">
                      Disparar alerta P1 a Mesa de Tesorería para fondeo urgente vía SPEI inverso. Encolar en <code className="text-purple-300">retry_after_funding</code>.
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-800/40">
                    <td className="p-3 font-bold text-slate-400">Timeout / 504 Gateway</td>
                    <td className="p-3">Corte de conexión entre backend y proveedor SPEI tras enviar el payload.</td>
                    <td className="p-3 text-rose-400 font-bold">PROHIBIDO REVERTIR FONDOS: Podría estar liquidada en Banxico.</td>
                    <td className="p-3 text-cyan-300">
                      Marcar transacción como <code className="text-amber-400">SUBMITTED_UNKNOWN</code> y transferir al cron de polling de 5 min.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Interactive Sandbox: Sync Dispatcher */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span>Simulador de Protocolo de Liberación Síncrona & Candados de Idempotencia</span>
              </h2>
              <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                Interactive Mainnet Simulator
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1 font-mono">Clave de Rastreo (18 dígitos)</label>
                <input
                  type="text"
                  value={syncClaveRastreo}
                  onChange={(e) => setSyncClaveRastreo(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1 font-mono">Monto a Dispersar (MXN)</label>
                <input
                  type="number"
                  value={syncAmount}
                  onChange={(e) => setSyncAmount(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1 font-mono">Respuesta Simulada del Proveedor</label>
                <select
                  value={simulatedHttpStatus}
                  onChange={(e) => setSimulatedHttpStatus(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs cursor-pointer"
                >
                  <option value="202_ACCEPTED">HTTP 202 Accepted (Flujo Exitoso)</option>
                  <option value="TIMEOUT_NETWORK">Timeout de Red (ETIMEDOUT 5s)</option>
                  <option value="400_INVALID">HTTP 400 Bad Request (CLABE Error)</option>
                  <option value="401_UNAUTHORIZED">HTTP 401 Token Expirado</option>
                  <option value="422_INSUFFICIENT_FUNDS">HTTP 422 Saldo Insuficiente Proveedor</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={handleRunSyncSimulation}
                  disabled={isSimulatingSync}
                  className="w-full h-9 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold rounded-lg text-xs transition-all cursor-pointer shadow-lg"
                >
                  {isSimulatingSync ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                  <span>Ejecutar Dispatch Síncrono</span>
                </button>
              </div>
            </div>

            {/* Console Log output */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-[11px] space-y-1 max-h-48 overflow-y-auto">
              {syncConsoleLog.length === 0 ? (
                <span className="text-slate-600">// Presiona "Ejecutar Dispatch Síncrono" para probar la máquina de estados e idempotencia en Mainnet...</span>
              ) : (
                syncConsoleLog.map((log, idx) => (
                  <div key={idx} className={
                    log.includes('FAIL') || log.includes('REVERS') || log.includes('400') ? 'text-rose-400' :
                    log.includes('WARN') || log.includes('401') || log.includes('422') || log.includes('TIMEOUT') ? 'text-amber-400' :
                    log.includes('OK') || log.includes('202') || log.includes('Éxito') ? 'text-emerald-400' : 'text-slate-300'
                  }>
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: MODULE 2 - ASYNCHRONOUS WEBHOOK PROTOCOL */}
      {activeTab === 'module2_webhook' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Cryptographic Security */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-400" />
                <span>1. Seguridad Criptográfica de Endpoints (HMAC-SHA256)</span>
              </h2>

              <div className="text-xs text-slate-300 space-y-3 leading-relaxed">
                <p>
                  Un atacante que logre forzar o falsear un webhook de estado <code className="text-emerald-400">LIQUIDATED</code> podría acreditar fondos ficticios. Por ello, la verificación de autenticidad debe ser inquebrantable:
                </p>
                <ul className="list-disc list-inside space-y-2 text-slate-400">
                  <li>
                    <strong className="text-slate-200">Raw Body Verification:</strong> La firma HMAC se calcula sobre el <strong>raw buffer sin parsear</strong> (antes de <code className="text-cyan-300">JSON.parse()</code>) para evitar alteraciones por diferencias de serialización de espacios o caracteres Unicode.
                  </li>
                  <li>
                    <strong className="text-slate-200">Mitigación de Timing Attacks:</strong> La comparación de firmas <strong>nunca</strong> debe usar el operador <code className="text-rose-400">===</code> (vulnerable a timing side-channel attacks). Es imperativo usar <code className="text-emerald-400">crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))</code>.
                  </li>
                  <li>
                    <strong className="text-slate-200">Prevención de Replay Attacks:</strong> Todo webhook debe incluir el header <code className="text-cyan-300">X-Timestamp</code>. Si <code className="text-cyan-300">|now - timestamp| &gt; 300 segundos</code> (5 minutos), el webhook se descarta con HTTP 400.
                  </li>
                </ul>
              </div>
            </div>

            {/* Immediate Ack & Event-Driven Decoupling */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <span>2. Confirmación Inmediata (Ack) & Colas de Mensajería</span>
              </h2>

              <div className="text-xs text-slate-300 space-y-3 leading-relaxed">
                <p>
                  <strong className="text-white">Problema Crítico de los Proveedores SPEI:</strong> Si tu endpoint de Webhooks tarda más de 2,000 ms en responder porque ejecuta consultas pesadas a la base de datos relacional (bloqueos de fila, generación de recibos PDF, auditoría), el proveedor asume fallo y <strong>reintentará enviar el mismo webhook de forma agresiva y exponencial</strong>.
                </p>
                <ul className="list-disc list-inside space-y-2 text-slate-400">
                  <li>
                    <strong className="text-slate-200">Respuesta Inmediata en &lt; 25 ms:</strong> Validar HMAC -&gt; Validar Timestamp -&gt; Empujar evento crudo a Redis BullMQ o RabbitMQ -&gt; Retornar inmediatamente <code className="text-emerald-400 font-bold">HTTP 200 OK</code>.
                  </li>
                  <li>
                    <strong className="text-slate-200">Worker Asíncrono Desacoplado:</strong> El worker en segundo plano consume la cola, obtiene el candado de la transacción en la BD, actualiza el estado y genera el Comprobante Electrónico de Pago (CEP).
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Interactive Webhook Simulator */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Radio className="w-4 h-4 text-cyan-400" />
                <span>Simulador de Ingestión de Webhooks & Verificación Criptográfica</span>
              </h2>
              <span className="text-[10px] text-cyan-400 font-mono bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                HMAC-SHA256 & Timing-Safe Inspector
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1 font-mono">Clave de Rastreo</label>
                <input
                  type="text"
                  value={webhookClaveRastreo}
                  onChange={(e) => setWebhookClaveRastreo(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1 font-mono">Estado Reportado en Webhook</label>
                <select
                  value={webhookStatusPayload}
                  onChange={(e) => setWebhookStatusPayload(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs cursor-pointer"
                >
                  <option value="LIQUIDATED">LIQUIDATED (Liquidación Exitosa Banxico)</option>
                  <option value="REJECTED_FONDOS">REJECTED (Devolución por Cuenta Inexistente)</option>
                  <option value="CANCELLED_BANXICO">CANCELLED (Cancelación de Operación)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1 font-mono">Firma Criptográfica HMAC</label>
                <select
                  value={webhookSignatureValid ? 'VALID' : 'TAMPERED'}
                  onChange={(e) => setWebhookSignatureValid(e.target.value === 'VALID')}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs cursor-pointer"
                >
                  <option value="VALID">Firma Válida Auténtica (HMAC-SHA256)</option>
                  <option value="TAMPERED">Firma Adulterada / Hacker (Timing Attack Test)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1 font-mono">Timestamp Replay Drift</label>
                <select
                  value={webhookTimestampOffsetSec}
                  onChange={(e) => setWebhookTimestampOffsetSec(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs cursor-pointer"
                >
                  <option value={12}>12 segundos atrás (Normal &lt; 300s)</option>
                  <option value={450}>450 segundos atrás (Ataque Replay &gt; 5 min)</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleRunWebhookSimulation}
              disabled={isSimulatingWebhook}
              className="w-full h-9 flex items-center justify-center gap-2 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold rounded-lg text-xs transition-all cursor-pointer shadow-lg"
            >
              {isSimulatingWebhook ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Radio className="w-3.5 h-3.5" />}
              <span>Simular Llegada de Webhook Asíncrono</span>
            </button>

            {/* Webhook Console */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-[11px] space-y-1 max-h-48 overflow-y-auto">
              {webhookLogs.length === 0 ? (
                <span className="text-slate-600">// Presiona "Simular Llegada de Webhook" para probar la validación de firma y el encolamiento en &lt; 25ms...</span>
              ) : (
                webhookLogs.map((log, idx) => (
                  <div key={idx} className={
                    log.includes('FAIL') || log.includes('REPLAY') || log.includes('401') ? 'text-rose-400' :
                    log.includes('OK') || log.includes('ACK') || log.includes('LIQUIDATED') ? 'text-emerald-400' : 'text-slate-300'
                  }>
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: FALLBACK CRON - POLLING FOR LIMBO TRANSACTIONS */}
      {activeTab === 'fallback_cron' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-400" />
              <span>Mecanismo de Respaldo: Polling Dirigido para Transacciones en Limbo (SUBMITTED &gt; 5m)</span>
            </h2>

            <div className="text-xs text-slate-300 space-y-3 leading-relaxed">
              <p>
                <strong className="text-white">El Gran Riesgo de Mainnet:</strong> Los Webhooks viajan sobre la Internet pública; un fallo en el balanceador de carga del proveedor, una partición de red o un reinicio del pod de Kubernetes puede provocar que un Webhook de <code className="text-emerald-400">LIQUIDATED</code> nunca llegue.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <h4 className="text-xs font-semibold text-rose-300 mb-1">Lo que NUNCA debes hacer (Anti-Patrón):</h4>
                  <p className="text-[11px] text-slate-400">
                    Hacer polling continuo a todas las transacciones recientes. Esto agota tu límite de tasa (Rate Limit) con el proveedor SPEI y genera bloqueos en tu base de datos.
                  </p>
                </div>
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <h4 className="text-xs font-semibold text-emerald-300 mb-1">El Patrón de Resiliencia Correcto:</h4>
                  <p className="text-[11px] text-slate-400">
                    Un job/cron secundario que corre cada 60 segundos y consulta de forma <strong>proactiva y quirúrgica</strong> <code className="text-cyan-300">GET /transaction/&#123;clave&#125;</code> <em>únicamente</em> para aquellas transacciones que tienen estado <code className="text-amber-400">SUBMITTED</code> y cuya antigüedad es superior a <strong>5 minutos</strong>.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Limbo Queue & Cron Runner */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Transacciones Locales en Estado SUBMITTED</h3>
                <p className="text-xs text-slate-400">El reconciliador solo consultará transacciones con más de 5 minutos en limbo.</p>
              </div>

              <button
                onClick={handleRunLimboCron}
                disabled={isPollingRunning}
                className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold rounded-lg text-xs transition-all cursor-pointer shadow-lg"
              >
                {isPollingRunning ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                <span>Disparar Cron de Reconciliación</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-800">
                <thead className="bg-slate-950 text-slate-300 font-mono text-[11px] border-b border-slate-800">
                  <tr>
                    <th className="p-2.5">ID Interno</th>
                    <th className="p-2.5">Clave de Rastreo</th>
                    <th className="p-2.5">Monto MXN</th>
                    <th className="p-2.5">Banco Destino</th>
                    <th className="p-2.5">Tiempo en Limbo</th>
                    <th className="p-2.5">Estado Actual</th>
                    <th className="p-2.5">Candidato a Polling</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-slate-300 font-mono text-[11px]">
                  {limboTransactions.map((tx) => {
                    const isCandidate = tx.elapsedMinutes >= 5 && tx.status === 'SUBMITTED';
                    return (
                      <tr key={tx.id} className="hover:bg-slate-800/30">
                        <td className="p-2.5 font-bold text-white">{tx.id}</td>
                        <td className="p-2.5 text-cyan-400">{tx.clave_rastreo}</td>
                        <td className="p-2.5">${tx.amount.toLocaleString()} MXN</td>
                        <td className="p-2.5 text-slate-400">{tx.bank}</td>
                        <td className="p-2.5">
                          <span className={tx.elapsedMinutes >= 5 ? 'text-amber-400 font-semibold' : 'text-slate-400'}>
                            {tx.elapsedMinutes.toFixed(1)} min
                          </span>
                        </td>
                        <td className="p-2.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] ${
                            tx.status.includes('LIQUIDATED') ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-amber-950 text-amber-300 border border-amber-800'
                          }`}>
                            {tx.status}
                          </span>
                        </td>
                        <td className="p-2.5">
                          {isCandidate ? (
                            <span className="text-emerald-400 font-semibold">SÍ (&gt; 5m)</span>
                          ) : (
                            <span className="text-slate-500">NO (&lt; 5m)</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Cron Console Output */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-[11px] space-y-1 max-h-48 overflow-y-auto">
              {cronLogs.length === 0 ? (
                <span className="text-slate-600">// Presiona "Disparar Cron de Reconciliación" para simular la resolución de transacciones huérfanas...</span>
              ) : (
                cronLogs.map((log, idx) => (
                  <div key={idx} className={
                    log.includes('LIQUIDATED') || log.includes('0 transacciones duplicadas') ? 'text-emerald-400' :
                    log.includes('POLLING') ? 'text-cyan-400' : 'text-slate-300'
                  }>
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: BIOMETRICS & LIVENESS CONFIRMATION */}
      {activeTab === 'biometrics_liveness' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Autorización Criptográfica e.firma (Arquitectura sin Datos Biométricos)</span>
              </h2>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                NOM-151 / CFF Art. 17-D
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Cumpliendo la directriz de <strong>eliminación de almacenamiento de datos biométricos</strong> y maximización de la privacidad del titular (LFPDPPP), 
              la plataforma prescinde de la captura y retención de vectores faciales invasivos, sustituyéndolos por <strong>atestación criptográfica asimétrica de grado bancario (ECDSA Secp256k1 + e.firma FIEL SAT)</strong> 
              vinculada de forma irrevocable e inmutable a la <code className="text-emerald-400 bg-slate-950 px-1 py-0.5 rounded">clave_rastreo</code> SPEI.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>1. Reto Activo de Parpadeo (EAR)</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Cálculo del <em>Eye Aspect Ratio</em> en tiempo real mediante puntos de referencia de los ojos. Un parpadeo natural genera un descenso abrupto de <code className="text-cyan-300">EAR &gt; 0.28</code> a <code className="text-cyan-300">EAR &lt; 0.16</code> seguido de una recuperación simétrica en 150-350ms.
                </p>
              </div>

              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-cyan-300">
                  <RefreshCw className="w-4 h-4 text-cyan-400" />
                  <span>2. Reto Cefálico 3D (Yaw/Pitch)</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Instrucción dinámica de rotación de cabeza de 15° en un sentido pseudoaleatorio (Yaw ±15°). Destruye ataques basados en fotografías estáticas o videos pregrabados (2D Presentation Attacks).
                </p>
              </div>

              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-300">
                  <ShieldCheck className="w-4 h-4 text-purple-400" />
                  <span>3. Anti-Spoofing Pasivo (PAD ISO 30107)</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Análisis espectral y fotométrico de textura dérmica, detección de bordes de pantallas de cristal, efecto moiré de píxeles y micro-pulsaciones vasculares faciales (rPPG).
                </p>
              </div>
            </div>
          </div>

          {/* Cryptographic Attestation Structure */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Key className="w-4 h-4 text-amber-400" />
              <span>Estructura de la Atestación Criptográfica Ligada al SPEI (Payload JSON)</span>
            </h3>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-300 leading-relaxed overflow-x-auto">
{`{
  "biometric_attestation": {
    "version": "2.4-CNBV",
    "algorithm": "ECDSA_SECP256K1_SHA256",
    "timestamp": "2026-10-17T14:28:12.482Z",
    "nonce": "NONCE-847291B8",
    "signer_rfc": "MESR780312HN5",
    "bound_clave_rastreo": "202610178492019482",
    "liveness_metrics": {
      "method": "HYBRID_DUAL_PASS",
      "eye_aspect_ratio_min": 0.12,
      "head_yaw_degrees": 14.8,
      "anti_spoofing_pad_score": 98.8,
      "screen_reflection_detected": false,
      "iso_30107_compliance": true
    },
    "facial_vector_hash": "0x7a8f941e8c92a10b4290d98412e8b01a234c9f11a8b417c8d90e21a8120b41cd",
    "signature": "3045022100a892b10492810a9c8f1e9481902840192840192840192804190284019284019202203948190248102948102948102948102948102948102948102948102948102948",
    "pki_certificate_serial": "SAT-AC-FID-2026-9041284"
  }
}`}
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: BLUEPRINTS DE PRODUCCIÓN (NODE.JS / EXPRESS / REDIS / POSTGRESQL) */}
      {activeTab === 'code_blueprints' && (
        <div className="space-y-6">
          {/* Blueprint 1: Synchronous Release with Idempotency */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileCode className="w-4 h-4 text-emerald-400" />
                <span>1. Implementación de Liberación Síncrona con Idempotencia (TypeScript / Express)</span>
              </h3>
              <button
                onClick={() => handleCopyCode('sync_code', `// SPEI Synchronous Release Pattern
export async function disperseSpei(req: Request, res: Response) {
  const { clave_rastreo, amount_mxn, target_clabe, beneficiary_name, biometric_attestation } = req.body;
  
  // 1. Validar atestación biométrica y confirmación de vida
  verifyBiometricLivenessAttestation(biometric_attestation, clave_rastreo);

  // 2. Candado Distribuido de Idempotencia en Redis
  const lockKey = \`lock:spei:\${clave_rastreo}\`;
  const acquired = await redis.set(lockKey, 'PROCESSING', 'EX', 300, 'NX');
  if (!acquired) {
    return res.status(409).json({ error: 'Operación en proceso o clave_rastreo duplicada' });
  }

  // 3. Transacción ACID: Reservar fondos en base de datos
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      'SELECT balance_mxn FROM accounts WHERE id = $1 FOR UPDATE', 
      [req.user.accountId]
    );
    if (rows[0].balance_mxn < amount_mxn) {
      await client.query('ROLLBACK');
      await redis.del(lockKey);
      return res.status(422).json({ error: 'Saldo insuficiente' });
    }
    
    await client.query(
      'UPDATE accounts SET balance_mxn = balance_mxn - $1, reserved_mxn = reserved_mxn + $1 WHERE id = $2',
      [amount_mxn, req.user.accountId]
    );
    await client.query(
      'INSERT INTO spei_outbound (clave_rastreo, amount_mxn, target_clabe, status) VALUES ($1, $2, $3, $4)',
      [clave_rastreo, amount_mxn, target_clabe, 'PENDING_SUBMISSION']
    );
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    await redis.del(lockKey);
    throw err;
  } finally {
    client.release();
  }

  // 4. Petición Síncrona al Proveedor con Timeout Corto (4,000ms)
  try {
    const providerResp = await axios.post('https://api.spei-provider.com/v1/disperse', {
      clave_rastreo,
      amount: amount_mxn,
      clabe: target_clabe
    }, { timeout: 4000 });

    if (providerResp.status === 202 || providerResp.data.status === 'SUBMITTED') {
      await pool.query('UPDATE spei_outbound SET status = $1 WHERE clave_rastreo = $2', ['SUBMITTED', clave_rastreo]);
      // LIBERACIÓN INMEDIATA DEL HILO DEL BACKEND (HTTP 202)
      return res.status(202).json({ status: 'SUBMITTED', clave_rastreo });
    }
  } catch (axiosErr) {
    if (axiosErr.code === 'ECONNABORTED' || !axiosErr.response) {
      // Timeout: Marcar como SUBMITTED_UNKNOWN para que el cron de fallback lo resuelva
      await pool.query('UPDATE spei_outbound SET status = $1 WHERE clave_rastreo = $2', ['SUBMITTED_UNKNOWN', clave_rastreo]);
      return res.status(202).json({ status: 'SUBMITTED_UNKNOWN', note: 'En proceso de verificación en red SPEI' });
    }
    // Errores 400 / 422: Ejecutar rollback de fondos
    await rollbackReservedFunds(req.user.accountId, amount_mxn, clave_rastreo);
    await redis.del(lockKey);
    return res.status(axiosErr.response.status).json(axiosErr.response.data);
  }
}`)}
                className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white px-2 py-1 bg-slate-800 rounded border border-slate-700 cursor-pointer"
              >
                {copiedCodeSnippet === 'sync_code' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCodeSnippet === 'sync_code' ? 'Copiado!' : 'Copiar Código'}</span>
              </button>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-300 leading-relaxed overflow-x-auto max-h-72">
{`// 1. Control de Idempotencia y Liberación Síncrona
export async function disperseSpei(req: Request, res: Response) {
  const { clave_rastreo, amount_mxn, target_clabe, biometric_attestation } = req.body;
  
  // Candado de Idempotencia en Redis
  const lockKey = \`lock:spei:\${clave_rastreo}\`;
  const acquired = await redis.set(lockKey, 'PROCESSING', 'EX', 300, 'NX');
  if (!acquired) return res.status(409).json({ error: 'Operación duplicada en proceso' });

  // Reserva ACID en PostgreSQL (SELECT FOR UPDATE)
  // ...
  // Envío síncrono al proveedor con socket timeout de 4000ms
  const providerResp = await axios.post(PROVIDER_URL, payload, { timeout: 4000 });
  
  // LIBERAR HILO INMEDIATAMENTE TRAS HTTP 202
  if (providerResp.status === 202) {
    return res.status(202).json({ status: 'SUBMITTED', clave_rastreo });
  }
}`}
            </div>
          </div>

          {/* Blueprint 2: Webhook HMAC & Message Queue */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Radio className="w-4 h-4 text-cyan-400" />
                <span>2. Receptor de Webhooks HMAC-SHA256 & Desacoplamiento Event-Driven (Express + BullMQ)</span>
              </h3>
              <button
                onClick={() => handleCopyCode('webhook_code', `import crypto from 'crypto';
import { Queue } from 'bullmq';

const settlementQueue = new Queue('spei-settlement-events', { connection: redisConfig });

export async function handleSpeiWebhook(req: Request, res: Response) {
  const signatureHeader = req.headers['x-signature'] as string;
  const timestampHeader = req.headers['x-timestamp'] as string;
  const rawBody = (req as any).rawBody; // Buffer crudo guardado antes de bodyParser

  // 1. Validar ventana de Replay Attack (máximo 300 segundos)
  const currentTimestamp = Math.floor(Date.now() / 1000);
  if (Math.abs(currentTimestamp - Number(timestampHeader)) > 300) {
    return res.status(400).send('Replay attack: Timestamp fuera de tolerancia');
  }

  // 2. Validar firma criptográfica con timingSafeEqual
  const hmac = crypto.createHmac('sha256', process.env.SPEI_WEBHOOK_SECRET!);
  hmac.update(\`\${timestampHeader}.\`);
  hmac.update(rawBody);
  const expectedSignature = hmac.digest('hex');

  const trusted = Buffer.from(expectedSignature, 'utf8');
  const untrusted = Buffer.from(signatureHeader || '', 'utf8');
  if (trusted.length !== untrusted.length || !crypto.timingSafeEqual(trusted, untrusted)) {
    return res.status(401).send('Firma HMAC inválida');
  }

  // 3. RESPUESTA INMEDIATA (ACK HTTP 200 en < 20ms)
  res.status(200).json({ received: true });

  // 4. Delegación a la Cola de Mensajería (Event-Driven)
  await settlementQueue.add('process-settlement', JSON.parse(rawBody.toString()), {
    attempts: 5,
    backoff: { type: 'exponential', delay: 1000 },
    removeOnComplete: true
  });
}`)}
                className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white px-2 py-1 bg-slate-800 rounded border border-slate-700 cursor-pointer"
              >
                {copiedCodeSnippet === 'webhook_code' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCodeSnippet === 'webhook_code' ? 'Copiado!' : 'Copiar Código'}</span>
              </button>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-300 leading-relaxed overflow-x-auto max-h-72">
{`// 2. Webhook Ingestion con HMAC-SHA256 y Ack Inmediato
export async function handleSpeiWebhook(req: Request, res: Response) {
  // Verificación timing-safe
  if (!crypto.timingSafeEqual(trusted, untrusted)) {
    return res.status(401).send('Firma HMAC inválida');
  }

  // RESPONDER HTTP 200 INMEDIATO (< 20ms)
  res.status(200).json({ received: true });

  // Empujar a BullMQ para procesar en segundo plano sin bloquear el ACK
  await settlementQueue.add('process-settlement', req.body);
}`}
            </div>
          </div>

          {/* Blueprint 3: Limbo Cron Worker */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-400" />
                <span>3. Cron de Respaldo: Reconciliación Quirúrgica (SUBMITTED &gt; 5 minutos)</span>
              </h3>
              <button
                onClick={() => handleCopyCode('cron_code', `// Cron de Reconciliación Fallback: Ejecución cada 60s
export async function speiLimboReconciliationCron() {
  const { rows: limboTxList } = await pool.query(\`
    SELECT id, clave_rastreo, amount_mxn, account_id 
    FROM spei_outbound 
    WHERE status IN ('SUBMITTED', 'SUBMITTED_UNKNOWN')
      AND created_at < NOW() - INTERVAL '5 minutes'
    LIMIT 50
  \`);

  for (const tx of limboTxList) {
    try {
      const resp = await axios.get(\`https://api.spei-provider.com/v1/transactions/\${tx.clave_rastreo}\`, {
        headers: { Authorization: \`Bearer \${await getValidAccessToken()}\` }
      });

      if (resp.data.status === 'LIQUIDATED') {
        await executeFinalSettlement(tx.id, resp.data.cep_folio);
      } else if (resp.data.status === 'REJECTED' || resp.data.status === 'CANCELLED') {
        await rollbackReservedFunds(tx.account_id, tx.amount_mxn, tx.clave_rastreo);
      }
    } catch (err) {
      logger.error(\`Fallo en reconciliación de \${tx.clave_rastreo}\`, err);
    }
  }
}`)}
                className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white px-2 py-1 bg-slate-800 rounded border border-slate-700 cursor-pointer"
              >
                {copiedCodeSnippet === 'cron_code' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCodeSnippet === 'cron_code' ? 'Copiado!' : 'Copiar Código'}</span>
              </button>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-300 leading-relaxed overflow-x-auto max-h-72">
{`// 3. Fallback Polling solo para transacciones > 5 min
export async function speiLimboReconciliationCron() {
  const { rows } = await pool.query(
    "SELECT * FROM spei_outbound WHERE status='SUBMITTED' AND created_at < NOW() - INTERVAL '5 minutes'"
  );
  for (const tx of rows) {
    const status = await queryProviderStatus(tx.clave_rastreo);
    if (status === 'LIQUIDATED') await settle(tx);
    else if (status === 'REJECTED') await rollback(tx);
  }
}`}
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: 20-POINT MAINNET SECURITY CHECKLIST */}
      {activeTab === 'checklist' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-2">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Checklist de Seguridad y Auditoría de Producción Mainnet (20 Puntos Críticos)</span>
            </h2>
            <p className="text-xs text-slate-400">
              Matriz de control técnico exigida para despliegue en producción conectada a STP, Banxico o agregadores autorizados.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Group 1: Idempotencia y Liberación Síncrona */}
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3">
              <h3 className="font-bold text-emerald-400 flex items-center gap-1.5 text-xs">
                <Zap className="w-4 h-4" />
                <span>Módulo 1: Liberación Síncrona & Resiliencia</span>
              </h3>
              <ul className="space-y-2 text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-0.5">✓</span>
                  <span><strong>1. Candado Distribuido Atómico:</strong> <code className="text-cyan-300 font-mono">SET lock:spei:&#123;clave&#125; NX EX 300</code> antes de tocar el balance.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-0.5">✓</span>
                  <span><strong>2. Constraint RDBMS:</strong> Columna <code className="text-cyan-300 font-mono">clave_rastreo UNIQUE NOT NULL</code> a nivel base de datos.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-0.5">✓</span>
                  <span><strong>3. Reserva de Saldo previa al Dispatch:</strong> <code className="text-cyan-300 font-mono">SELECT FOR UPDATE</code> evitando sobregiros en saldos concurrentes.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-0.5">✓</span>
                  <span><strong>4. Timeout Síncrono de 4,000ms:</strong> No permitir que un HTTP POST saliente cuelgue el hilo del backend.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-0.5">✓</span>
                  <span><strong>5. Manejo de HTTP 202:</strong> Responder al cliente inmediatamente como <code className="text-emerald-300 font-mono">SUBMITTED</code> en &lt; 300ms.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-0.5">✓</span>
                  <span><strong>6. No-Rollback ante Timeout de Red:</strong> Estado intermedio <code className="text-amber-400 font-mono">SUBMITTED_UNKNOWN</code>; nunca devolver dinero a ciegas.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-0.5">✓</span>
                  <span><strong>7. Circuit Breaker en HTTP 401:</strong> Renovación atómica de tokens OAuth para evitar tormenta de reintentos fallidos.</span>
                </li>
              </ul>
            </div>

            {/* Group 2: Webhooks & Event-Driven */}
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3">
              <h3 className="font-bold text-cyan-400 flex items-center gap-1.5 text-xs">
                <Radio className="w-4 h-4" />
                <span>Módulo 2: Webhooks Asíncronos & Colas</span>
              </h3>
              <ul className="space-y-2 text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 mt-0.5">✓</span>
                  <span><strong>8. Verificación HMAC-SHA256:</strong> Cálculo estricto sobre el buffer crudo (<code className="text-cyan-300 font-mono">rawBody</code>).</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 mt-0.5">✓</span>
                  <span><strong>9. Timing-Safe Comparison:</strong> Uso forzado de <code className="text-cyan-300 font-mono">crypto.timingSafeEqual()</code>.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 mt-0.5">✓</span>
                  <span><strong>10. Ventana Anti-Replay:</strong> Descarte inmediato de webhooks con delta &gt; 300 segundos.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 mt-0.5">✓</span>
                  <span><strong>11. Fast-Path Ack (HTTP 200 &lt; 25ms):</strong> Desacoplamiento total de la escritura en BD.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 mt-0.5">✓</span>
                  <span><strong>12. Message Queue Duradera:</strong> Buffer en Redis BullMQ / RabbitMQ persistente en disco.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 mt-0.5">✓</span>
                  <span><strong>13. Dead Letter Queue (DLQ):</strong> Captura de webhooks malformados o fallidos tras 5 reintentos exponenciales.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 mt-0.5">✓</span>
                  <span><strong>14. Fallback Polling Cron:</strong> Búsqueda quirúrgica de <code className="text-purple-300 font-mono">SUBMITTED &gt; 5m</code> cada 60s.</span>
                </li>
              </ul>
            </div>

            {/* Group 3: Biometría & Compliance CNBV */}
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3 md:col-span-2">
              <h3 className="font-bold text-purple-400 flex items-center gap-1.5 text-xs">
                <ScanFace className="w-4 h-4" />
                <span>Módulo 3: Biometría, Prueba de Vida & Cumplimiento Normativo</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ul className="space-y-2 text-slate-300">
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-0.5">✓</span>
                    <span><strong>15. Detección Activa de Parpadeo (EAR):</strong> Medición de caída temporal simétrica en 150-350ms.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-0.5">✓</span>
                    <span><strong>16. Rotación Cefálica 3D:</strong> Reto dinámico aleatorio de 15° para anular ataques con fotos planas.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-0.5">✓</span>
                    <span><strong>17. Anti-Spoofing PAD ISO/IEC 30107-3:</strong> Detección de máscaras de silicona y bordes de pantallas LED/OLED.</span>
                  </li>
                </ul>
                <ul className="space-y-2 text-slate-300">
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-0.5">✓</span>
                    <span><strong>18. Atestación Criptográfica ECDSA:</strong> Firma digital que amarra vector facial, clave de rastreo y nonce.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-0.5">✓</span>
                    <span><strong>19. Homologación INE/CNBV:</strong> Cotejo con el padrón electoral según Art. 316 Bis de las Disposiciones CNBV.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-0.5">✓</span>
                    <span><strong>20. Pista de Auditoría Inmutable:</strong> Hash SHA-256 del certificado biométrico sellado en el libro contable de 10 años.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
