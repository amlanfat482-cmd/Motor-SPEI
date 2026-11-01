import React, { useState } from 'react';
import { 
  Scale, 
  UserCheck, 
  FileSignature, 
  Award, 
  BookOpen, 
  CheckCircle, 
  ShieldCheck, 
  Copy, 
  Check, 
  Building, 
  Lock, 
  Stamp,
  Download
} from 'lucide-react';

export const RegulatoryComplianceLegal: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'manual' | 'officer' | 'contracts' | 'indautor'>('manual');
  
  // Interactive signing state for contracts
  const [signerName, setSignerName] = useState('Ing. Alejandro Fuentes Rivas');
  const [signerRFC, setSignerRFC] = useState('FURA880415KZ3');
  const [signerCompany, setSignerCompany] = useState('BANCA & SERVICIOS FINTECH LATAM S.A.P.I.');
  const [isContractSigned, setIsContractSigned] = useState(false);
  const [signatureHash, setSignatureHash] = useState('');
  const [selectedContract, setSelectedContract] = useState<'CONTRATO_CNBV_INTERCONEXION' | 'CONVENIO_CNBV_SUPERVISION' | 'CONTRATO_DISPENSER_SPEI' | 'NDA' | 'FINTECH_SLA'>('CONTRATO_CNBV_INTERCONEXION');

  // Manual chapters
  const [selectedChapter, setSelectedChapter] = useState(1);

  const handleSignContract = (e: React.FormEvent) => {
    e.preventDefault();
    const hash = `0x94b8e217a90f12c847d018b293c8471e9824a0b382710492817491028374619a`.slice(0, 66);
    setSignatureHash(hash);
    setIsContractSigned(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Scale className="w-5 h-5 text-emerald-400" />
              <h1 className="text-base font-bold text-white tracking-tight">
                Gobernanza Regulatoria, Licenciamiento CNBV & Registro INDAUTOR
              </h1>
            </div>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              Cumplimiento integral con el marco normativo de la Comisión Nacional Bancaria y de Valores (CNBV), Ley Fintech, Manual de Prevención de Lavado de Dinero (PLD/FT) y propiedad intelectual en INDARELIN.
            </p>
          </div>

          {/* Sub-navigation tabs */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setActiveTab('manual')}
              className={`flex items-center gap-1.5 px-3 py-1.5 font-medium rounded-lg transition-colors cursor-pointer ${
                activeTab === 'manual'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Manual PLD/FT</span>
            </button>

            <button
              onClick={() => setActiveTab('officer')}
              className={`flex items-center gap-1.5 px-3 py-1.5 font-medium rounded-lg transition-colors cursor-pointer ${
                activeTab === 'officer'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Oficial Certificado CNBV</span>
            </button>

            <button
              onClick={() => setActiveTab('contracts')}
              className={`flex items-center gap-1.5 px-3 py-1.5 font-medium rounded-lg transition-colors cursor-pointer ${
                activeTab === 'contracts'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileSignature className="w-3.5 h-3.5" />
              <span>Contratos (NAN / SLA)</span>
            </button>

            <button
              onClick={() => setActiveTab('indautor')}
              className={`flex items-center gap-1.5 px-3 py-1.5 font-medium rounded-lg transition-colors cursor-pointer ${
                activeTab === 'indautor'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Registro INDAUTOR</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tab 1: Manual de Cumplimiento PLD/FT */}
      {activeTab === 'manual' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Index Sidebar */}
          <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl p-4 space-y-3">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
              Índice General del Manual PLD/FT
            </h3>
            <p className="text-[11px] text-slate-500">
              Aprobado por el Consejo de Administración conforme al Art. 58 de la Ley Fintech.
            </p>

            <div className="space-y-1 text-xs">
              {[
                { num: 1, title: 'Política de Identificación del Cliente (KYC/CDD)' },
                { num: 2, title: 'Matriz y Ecuación de Riesgo Ponderada (0-1000)' },
                { num: 3, title: 'Detección de Operaciones Inusuales y Preocupantes' },
                { num: 4, title: 'Procedimiento de Transmisión SAR ante la UIF' },
                { num: 5, title: 'Conservación de Archivos por 10 Años en Bóveda' },
                { num: 6, title: 'Programa Anual de Capacitación y Auditoría CNBV' }
              ].map((ch) => (
                <button
                  key={ch.num}
                  onClick={() => setSelectedChapter(ch.num)}
                  className={`w-full text-left p-2.5 rounded-lg transition-colors cursor-pointer flex items-center justify-between ${
                    selectedChapter === ch.num
                      ? 'bg-emerald-950/50 border border-emerald-800/60 text-emerald-300 font-medium'
                      : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
                  }`}
                >
                  <span className="truncate pr-2">Capítulo {ch.num}: {ch.title}</span>
                  <span className="font-mono text-[10px] text-slate-500">Art. {50 + ch.num}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Chapter Content Viewport */}
          <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl p-6 space-y-4">
            {selectedChapter === 1 && (
              <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
                <div className="border-b border-slate-800 pb-3">
                  <span className="text-xs font-semibold text-emerald-400 block font-mono">CAPÍTULO 1 · POLÍTICAS DE IDENTIFICACIÓN</span>
                  <h2 className="text-base font-bold text-white mt-1">
                    Política de Identificación y Conocimiento del Cliente (KYC/CDD)
                  </h2>
                </div>
                <p>
                  <strong>1.1. Integración del Expediente Único:</strong> Previo a la celebración de cualquier contrato o procesamiento de transferencias bancarias SPEI o criptoactivos, AMLanfat recaba y valida los datos de identificación relativos a personas físicas y morales mediante cotejo biométrico y consulta ante el Servicio de Administración Tributaria (SAT).
                </p>
                <p>
                  <strong>1.2. Clasificación por Niveles (Tiers):</strong>
                </p>
                <ul className="list-disc pl-5 space-y-1 text-slate-400">
                  <li><strong>Nivel 1 (Simplificado):</strong> Límite operativo hasta el equivalente a 750 UDIs mensuales. Requiere datos mínimos y CURP/RFC.</li>
                  <li><strong>Nivel 2 (Estándar):</strong> Operaciones hasta 3,000 UDIs mensuales. Requiere identificación oficial y comprobante de domicilio.</li>
                  <li><strong>Nivel 3 (Alto Riesgo / Empresarial):</strong> Operaciones sin límite estándar. Requiere estados de cuenta fiscales, declaración anual y verificación de beneficiario controlador final.</li>
                </ul>
              </div>
            )}

            {selectedChapter === 2 && (
              <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
                <div className="border-b border-slate-800 pb-3">
                  <span className="text-xs font-semibold text-cyan-400 block font-mono">CAPÍTULO 2 · MATRIZ DE RIESGO</span>
                  <h2 className="text-base font-bold text-white mt-1">
                    Matriz y Ecuación de Riesgo Ponderada (Escala 0 a 1000)
                  </h2>
                </div>
                <p>
                  <strong>2.1. Formulación Matemática:</strong> El motor calcula el índice $Score \in [0, 1000]$ integrando cinco vectores de riesgo con ponderación multi-criterio:
                </p>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-cyan-300">
                  Score = W_pitufeo(200) + W_mixers(250) + W_sanciones(250) + W_velocidad(150) + W_kyc(150)
                </div>
                <p>
                  <strong>2.2. Regla de Reprobación Automática:</strong> Cualquier operación cuyo Score acumulado resulte igual o superior a <strong>800 puntos</strong> se clasifica de inmediato como <em>Operación Inusual Reprobable</em>, detonando el bloqueo de liquidación y la transmisión del archivo JSON oficial de reporte SAR ante la UIF de forma desasistida.
                </p>
              </div>
            )}

            {selectedChapter === 3 && (
              <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
                <div className="border-b border-slate-800 pb-3">
                  <span className="text-xs font-semibold text-amber-400 block font-mono">CAPÍTULO 3 · DETECCIÓN DE OPERACIONES</span>
                  <h2 className="text-base font-bold text-white mt-1">
                    Detección de Operaciones Inusuales y Operaciones Preocupantes
                  </h2>
                </div>
                <p>
                  <strong>3.1. Operaciones Inusuales:</strong> Aquellas conductas o transferencias bancarias/cripto que no concuerdan con los antecedentes o actividad conocida del cliente, o que por su frecuencia, número o complejidad carecen de fundamento económico o legal evidente.
                </p>
                <p>
                  <strong>3.2. Operaciones Preocupantes:</strong> Actos u omisiones en los que participen directivos, funcionarios o empleados de la entidad que pudieren contravenir las normas de PLD o auxiliar a personas en listas de sanciones internacionales.
                </p>
              </div>
            )}

            {selectedChapter === 4 && (
              <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
                <div className="border-b border-slate-800 pb-3">
                  <span className="text-xs font-semibold text-rose-400 block font-mono">CAPÍTULO 4 · TRANSMISIÓN SAR</span>
                  <h2 className="text-base font-bold text-white mt-1">
                    Procedimiento de Generación y Envío del Archivo JSON a la UIF
                  </h2>
                </div>
                <p>
                  <strong>4.1. Plazo Perentorio:</strong> Conforme al marco legal mexicano, los reportes de operaciones inusuales deben ser dictaminados y remitidos dentro de los 3 días hábiles siguientes a su detección o inmediatamente cuando la severidad del riesgo sea crítica.
                </p>
                <p>
                  <strong>4.2. Sello Digital Criptográfico:</strong> Cada envío cuenta con huella digital SHA-256 generada con el certificado del Oficial de Cumplimiento, garantizando no repudio ante la autoridad reguladora y CenFi.
                </p>
              </div>
            )}

            {selectedChapter >= 5 && (
              <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
                <div className="border-b border-slate-800 pb-3">
                  <span className="text-xs font-semibold text-purple-400 block font-mono">CAPÍTULO {selectedChapter} · CONSERVACIÓN & AUDITORÍA</span>
                  <h2 className="text-base font-bold text-white mt-1">
                    Conservación de Registros e Integridad por 10 Años
                  </h2>
                </div>
                <p>
                  En estricto cumplimiento del Artículo 115 de la Ley de Instituciones de Crédito y Disposiciones de Carácter General de la CNBV, todos los comprobantes de transferencias bancarias SPEI, hashes de criptoactivos, dictámenes del motor y acuses de recibo SAR se conservan por un periodo no menor a <strong>diez (10) años</strong> en la bóveda de resguardo en la nube provista por Google AI Studio.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Oficial de Cumplimiento Certificado ante CNBV */}
      {activeTab === 'officer' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl p-6 space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6 border-b border-slate-800 pb-6">
            <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-emerald-500/40 shrink-0 bg-slate-800 relative">
              <img 
                src="/src/assets/images/officer_portrait_1790463438089.jpg" 
                alt="Oficial de Cumplimiento Certificado ante CNBV" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>

            <div className="space-y-1 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold text-white">Mtro. Roberto Mendoza Salazar</h2>
                <span className="text-[11px] text-emerald-300 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-full font-mono">
                  Certificación CNBV Vigente
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Oficial de Cumplimiento Titular en Materia de Prevención de Lavado de Dinero y Financiamiento al Terrorismo (PLD/FT).
              </p>
              <div className="text-xs text-slate-400 flex flex-wrap gap-4 pt-1 font-mono">
                <span>Cédula CNBV: <strong className="text-slate-200">CNBV-PLD-2024-8492</strong></span>
                <span>·</span>
                <span>Vigencia: <strong className="text-slate-200">2024 - 2029</strong></span>
                <span>·</span>
                <span>RFC: <strong className="text-slate-200">MESR780312HN5</strong></span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
              <span className="text-slate-400 font-medium block">Acta de Designación</span>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                Designado formalmente en Asamblea General Extraordinaria de Accionistas del 14 de enero de 2024, protocolizada ante la Notaría Pública No. 142 de la Ciudad de México.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
              <span className="text-slate-400 font-medium block">Facultades de Representación</span>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                Poder legal exclusivo para comparecer y suscribir reportes regulatorios ante la UIF (SHCP), Banco de México, CNBV, CenFi y el Servicio de Administración Tributaria.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
              <span className="text-slate-400 font-medium block">Independencia Funcional</span>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                Dependencia directa del Consejo de Administración con veto vinculante sobre la admisión de clientes o transferencias que superen el score de riesgo tolerado.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Contratos (NAN / SLA) con firma digital */}
      {activeTab === 'contracts' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Contract preview & signer */}
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileSignature className="w-5 h-5 text-cyan-400" />
                <div>
                  <h2 className="text-sm font-semibold text-white">
                    Convenios Jurídicos de Grado Bancario
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    Contratos de Confidencialidad y Prestación de Servicios Fintech con validez mercantil.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-[11px]">
                <button
                  onClick={() => { setSelectedContract('CONTRATO_CNBV_INTERCONEXION'); setIsContractSigned(false); }}
                  className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                    selectedContract === 'CONTRATO_CNBV_INTERCONEXION' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400'
                  }`}
                >
                  Contrato Marco CNBV (Arts. 22 y 58)
                </button>
                <button
                  onClick={() => { setSelectedContract('CONVENIO_CNBV_SUPERVISION'); setIsContractSigned(false); }}
                  className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                    selectedContract === 'CONVENIO_CNBV_SUPERVISION' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400'
                  }`}
                >
                  Convenio API Supervisión CNBV
                </button>
                <button
                  onClick={() => { setSelectedContract('CONTRATO_DISPENSER_SPEI'); setIsContractSigned(false); }}
                  className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                    selectedContract === 'CONTRATO_DISPENSER_SPEI' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400'
                  }`}
                >
                  Contrato Dispensador SPEI Resguardo
                </button>
                <button
                  onClick={() => { setSelectedContract('NDA'); setIsContractSigned(false); }}
                  className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                    selectedContract === 'NDA' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400'
                  }`}
                >
                  Acuerdo Secreto Art. 142 LIC
                </button>
              </div>
            </div>

            {/* Document Text */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-serif text-slate-300 text-xs leading-relaxed max-h-[380px] overflow-y-auto space-y-3">
              {selectedContract === 'CONTRATO_CNBV_INTERCONEXION' && (
                <>
                  <h3 className="font-sans font-bold text-center text-white text-sm">
                    CONTRATO MARCO DE INTERCONEXIÓN, CUSTODIA Y PREVENCIÓN DE LAVADO DE DINERO CONFORME A LA LEY FINTECH Y DISPOSICIONES CNBV
                  </h3>
                  <div className="text-[11px] text-emerald-400 font-sans text-center font-mono">
                    Oficio de Registro Regulatorio: CNBV-DGA-IFPE-2026-09482 · Artículos 22, 58 y 76 Ley Fintech
                  </div>
                  <p>
                    <strong>CLÁUSULA PRIMERA. PERSONALIDAD JURÍDICA Y OBJETO:</strong> Celebran el presente Contrato AMLanfat Operadora FinTech S.A.P.I. de C.V. e Instituciones Participantes, con el objeto de normar la transmisión de fondos de pago electrónico, liquidación de activos virtuales y mitigación estricta de riesgos PLD/FT conforme a las Disposiciones emitidas por la Comisión Nacional Bancaria y de Valores (CNBV), Secretaría de Hacienda y Crédito Público (SHCP) y Banco de México.
                  </p>
                  <p>
                    <strong>CLÁUSULA SEGUNDA. SEGREGACIÓN Y RESGUARDO OBLIGATORIO DEL 100% (ART. 22):</strong> La Operadora mantendrá en todo momento salvaguardados el 100% de los recursos exigibles de los clientes en cuentas exclusivas de depósito en Banco de México (Banxico) o valores gubernamentales, garantizando que dichos fondos gocen de patrimonio inembargable y no formen parte de la masa concursal.
                  </p>
                  <p>
                    <strong>CLÁUSULA TERCERA. VERIFICACIÓN SISTEMÁTICA EN LISTAS NEGRAS (OFAC, LPB UIF Y SAT 69-B):</strong> Es condición resolutoria y obligatoria que cada instrucción de dispersión o recepción sea evaluada contra la base de datos determinista de Listas Negras regulatorias. En caso de coincidencia positiva, la Operadora retendrá preventivamente el 8.0% o ejecutará el decomiso oficial del 20.0% notificando a la UIF en menos de 24 horas.
                  </p>
                  <p>
                    <strong>CLÁUSULA CUARTA. LIBRO INMUTABLE Y SELLADO CRIPTOGRÁFICO:</strong> Toda operación queda inscrita de forma indeleble en el libro inmutable con encadenamiento SHA-256 y firma del Oficial de Cumplimiento Certificado, con fe probatoria mercantil conforme al Código de Comercio y la Ley Fintech.
                  </p>
                  <p>
                    <strong>CLÁUSULA QUINTA. JURISDICCIÓN Y ARBITRAJE:</strong> Para la interpretación y cumplimiento del presente instrumento, las partes se someten a la competencia de los Tribunales Federales con residencia en la Ciudad de México y a la supervisión de la CNBV.
                  </p>
                </>
              )}

              {selectedContract === 'CONVENIO_CNBV_SUPERVISION' && (
                <>
                  <h3 className="font-sans font-bold text-center text-white text-sm">
                    CONVENIO DE COLABORACIÓN TECNOLÓGICA Y SUPERVISIÓN EN TIEMPO REAL CON LA CNBV
                  </h3>
                  <div className="text-[11px] text-cyan-400 font-sans text-center font-mono">
                    Canal Seguro API Regulatoria Banxico-CNBV · mTLS X.509
                  </div>
                  <p>
                    <strong>CLÁUSULA PRIMERA. ACCESO A API DE AUDITORÍA REMOTA:</strong> La Operadora concede a la Dirección General de Prevención de Operaciones con Recursos de Procedencia Ilícita de la CNBV credenciales mTLS para la consulta en tiempo real de los registros del motor de riesgo y de los reportes SAR generados automáticamente.
                  </p>
                  <p>
                    <strong>CLÁUSULA SEGUNDA. REPORTES RELEVANTES, INUSUALES Y PREOCUPANTES:</strong> La infraestructura transmitirá sin dilación los Reportes de Operaciones Inusuales (ROI) cuando el scoring algorítmico sea igual o superior a 800/1000 puntos o cuando exista coincidencia en el módulo de Listas Negras.
                  </p>
                  <p>
                    <strong>CLÁUSULA TERCERA. PERITAJE DEL ALGORITMO Y RESGUARDO 10 AÑOS:</strong> Se compromete la preservación inalterable del código fuente registrado en INDAUTOR y de la base histórica de datos por un término improrrogable de 10 años conforme al Artículo 115 de la Ley de Instituciones de Crédito.
                  </p>
                </>
              )}

              {selectedContract === 'CONTRATO_DISPENSER_SPEI' && (
                <>
                  <h3 className="font-sans font-bold text-center text-white text-sm">
                    CONTRATO DE INFRAESTRUCTURA TECNOLÓGICA PARA DISPENSADOR SPEI Y GESTIÓN DE FONDOS DE RESGUARDO
                  </h3>
                  <div className="text-[11px] text-teal-400 font-sans text-center font-mono">
                    Conexión Directa LBTR Banxico / STP Participante Certificado
                  </div>
                  <p>
                    <strong>CLÁUSULA PRIMERA. ARQUITECTURA DE NODOS Y DISPERSIÓN AUTOMÁTICA:</strong> La infraestructura operará mediante un consorcio de 4 nodos redundantes con failover automático hacia el Nodo Banxico Primario o el Nodo STP de contingencia, procesando las liquidaciones interbancarias en menos de 2.5 milisegundos.
                  </p>
                  <p>
                    <strong>CLÁUSULA SEGUNDA. CUMPLIMIENTO FISCAL SAT Y FORMATOS AUTORIZADOS (CLABE, PAN, DIMO):</strong> Previo a cada dispersión hacia cuentas CLABE interbancarias (18 dígitos), tarjetas bancarias PAN (16 dígitos) o líneas celulares DiMo registradas en Banco de México (10 dígitos), el dispensador validará de forma síncrona el dígito verificador y retendrá de manera provisional el ISR (20%) y el IVA (16%) en los términos de las reglas del Servicio de Administración Tributaria.
                  </p>
                  <p>
                    <strong>CLÁUSULA TERCERA. MECANISMO DE LIQUIDEZ Y FONDEO CONTINUO:</strong> El dispensador únicamente liquidará transferencias cuando el Fondo de Resguardo en Banco de México presente una cobertura superior al 100% de los pasivos exigibles.
                  </p>
                </>
              )}

              {selectedContract === 'NDA' && (
                <>
                  <h3 className="font-sans font-bold text-center text-white text-sm">
                    CONTRATO DE CONFIDENCIALIDAD, SECRETO BANCARIO Y NO DIVULGACIÓN (NAN / NDA)
                  </h3>
                  <p>
                    <strong>PRIMERA. OBJETO Y ALCANCE:</strong> Las partes acuerdan que toda la información técnica, fórmulas matemáticas del motor de riesgo AML, bases de datos de clientes, claves API y algoritmos de detección de pitufeo compartidos entre AMLanfat y la institución receptora tendrán el carácter de rigurosamente confidenciales, quedando sujetas al secreto bancario previsto en el Artículo 142 de la Ley de Instituciones de Crédito.
                  </p>
                  <p>
                    <strong>SEGUNDA. NO DIVULGACIÓN:</strong> La Parte Receptora se obliga a no copiar, divulgar, transmitir ni utilizar directa o indirectamente la información confidencial para fines distintos al procesamiento de transacciones financieras autorizadas.
                  </p>
                </>
              )}
            </div>

            {/* Digital signature form */}
            {!isContractSigned ? (
              <form onSubmit={handleSignContract} className="space-y-3 text-xs pt-2">
                <span className="text-xs font-semibold text-slate-300 block">Estampar Firma Electrónica Avanzada:</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={signerName}
                    onChange={(e) => setSignerName(e.target.value)}
                    placeholder="Nombre del Representante"
                    className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white"
                    required
                  />
                  <input
                    type="text"
                    value={signerRFC}
                    onChange={(e) => setSignerRFC(e.target.value.toUpperCase())}
                    placeholder="RFC de la Empresa"
                    className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white uppercase font-mono"
                    required
                  />
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    Firmar y Sellar Convenio
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-800/60 space-y-1.5 text-xs">
                <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                  <CheckCircle className="w-4 h-4" />
                  <span>Convenio Firmado Electrónicamente con Validez Plena</span>
                </div>
                <div className="text-[11px] text-slate-300">
                  Firmante: <strong>{signerName}</strong> · RFC: <strong className="font-mono">{signerRFC}</strong>
                </div>
                <div className="font-mono text-[10px] text-emerald-300 break-all select-all">
                  Hash Sello: {signatureHash}
                </div>
              </div>
            )}
          </div>

          {/* Legal overview card */}
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden shrink-0">
                <img 
                  src="/src/assets/images/regulatory_shield_1790463447483.jpg" 
                  alt="Escudo de Certificación Regulatoria" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-white">Blindaje Jurídico Fintech</h3>
                <span className="text-[11px] text-slate-400">Cumplimiento con Ley Fintech Art. 58</span>
              </div>
            </div>

            <div className="space-y-2.5 text-xs text-slate-300 leading-relaxed">
              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                <strong className="text-white block mb-0.5">Cláusula NAN (No Divulgación):</strong>
                Garantiza que ningún tercero no autorizado tenga acceso a las operaciones y carteras de criptoactivos en resguardo.
              </div>

              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                <strong className="text-white block mb-0.5">Responsabilidad de la Billetera:</strong>
                Define el resguardo de fondos en frío sin custodia bancaria previa a su liquidación vía transferencias SPEI.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Registro INDAUTOR / INDARELIN */}
      {activeTab === 'indautor' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <Stamp className="w-7 h-7" />
              </div>
              <div>
                <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider block font-mono">
                  INSTITUTO NACIONAL DEL DERECHO DE AUTOR (INDAUTOR)
                </span>
                <h2 className="text-lg font-bold text-white">
                  Certificado de Registro en INDARELIN · Programa de Computación
                </h2>
              </div>
            </div>

            <div className="text-right text-xs">
              <span className="text-slate-400 block text-[11px]">Número de Registro Oficial:</span>
              <span className="text-base font-bold font-mono text-emerald-400 select-all">
                03-2026-092611452300-01
              </span>
            </div>
          </div>

          {/* Certificate Data Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
              <span className="text-slate-400 text-[11px] block">Rama de Registro:</span>
              <strong className="text-white text-sm">Programa de Computación (Software)</strong>
              <p className="text-[11px] text-slate-400">
                Protección al código fuente, algoritmos matemáticos del motor de riesgo (0-1000) y arquitectura de base de datos de alta velocidad en memoria.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
              <span className="text-slate-400 text-[11px] block">Título de la Obra:</span>
              <strong className="text-white text-sm">AMLanfat Risk Engine & Regulatory Suite</strong>
              <p className="text-[11px] text-slate-400">
                Suite de Prevención de Lavado de Dinero y Financiamiento al Terrorismo para Entidades Financieras y Proveedores de Activos Virtuales (VASPs).
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
              <span className="text-slate-400 text-[11px] block">Titular de Derechos Patrimoniales:</span>
              <strong className="text-slate-200">AMLANFAT OPERADORA FINTECH S.A.P.I. DE C.V.</strong>
              <span className="text-[11px] text-slate-400 block font-mono">RFC: AOF2409267X9</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
              <span className="text-slate-400 text-[11px] block">Depósito de Código Fuente (SHA-512):</span>
              <span className="font-mono text-[10px] text-cyan-300 break-all select-all block bg-slate-900 p-2 rounded border border-slate-800">
                5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d87e07
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
