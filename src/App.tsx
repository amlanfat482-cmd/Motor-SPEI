/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ActiveTab, Navigation } from './components/Navigation';
import { RiskEngineDashboard } from './components/RiskEngineDashboard';
import { SarDispatchCenter } from './components/SarDispatchCenter';
import { SovereignVaultSpei } from './components/SovereignVaultSpei';
import { AuditVaultFiles } from './components/AuditVaultFiles';
import { RegulatoryComplianceLegal } from './components/RegulatoryComplianceLegal';
import { TransactionInspectorModal } from './components/TransactionInspectorModal';
import { PrintAuditReport } from './components/PrintAuditReport';
import { SecurityShieldSentinel } from './components/SecurityShieldSentinel';
import { RegulatoryBlacklistScreening } from './components/RegulatoryBlacklistScreening';
import { ImmutableLedgerViewer } from './components/ImmutableLedgerViewer';
import { SpeiNodesAndDispenser } from './components/SpeiNodesAndDispenser';
import { SpeiMainnetArchitectureAudit } from './components/SpeiMainnetArchitectureAudit';
import { GovernmentTaxComplianceManager } from './components/GovernmentTaxComplianceManager';
import { MiCuentaFinalWhitelistManager } from './components/MiCuentaFinalWhitelistManager';
import { AuditFileRecord, EngineStats, ImmutableBlock, SpeiTransferRecord, Transaction, TransactionChannel, VaultBalances } from './types/aml';
import { generateInitialTransactionBatch, generateSingleTransaction } from './utils/generator';
import { exportTransactionsToExcel, triggerPrintAuditSheet } from './utils/exportUtils';
import { calculateTransactionFee, generateCryptoSha256Receipt, generateSarFolio } from './utils/riskEngine';
import { loadImmutableLedger, saveImmutableLedger } from './utils/immutableLedger';
import { 
  loadVaultBalances, 
  saveVaultBalances, 
  loadSpeiTransfers, 
  saveSpeiTransfers, 
  loadTransactions, 
  saveTransactions, 
  loadAuditFiles, 
  saveAuditFiles,
  DEFAULT_VAULT_BALANCES
} from './utils/storage';
import { Archive, X, CheckCircle2 } from 'lucide-react';
import { AdjustableWindowControls } from './components/AdjustableWindowControls';

const TAB_LABELS_MAP: Record<ActiveTab, string> = {
  engine: 'Motor AML',
  whitelist: 'Mi Cuenta Final (HSM)',
  architecture: 'Auditoría Mainnet',
  taxes: 'Impuestos & Permisos',
  blacklist: 'Listas Negras',
  dispenser: 'Dispensador',
  vault: 'Billetera Soberana',
  sar: 'Despacho SAR',
  ledger: 'Libro Inmutable',
  audit: 'Bóveda Archivos',
  legal: 'Contratos CNBV'
};

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('engine');
  const [tabHistory, setTabHistory] = useState<ActiveTab[]>(['engine']);

  const handleSelectTab = (newTab: ActiveTab) => {
    if (newTab !== activeTab) {
      setTabHistory(prev => [...prev, newTab]);
      setActiveTab(newTab);
    }
  };

  const handleBack = () => {
    if (inspectedTransaction) {
      setInspectedTransaction(null);
      return;
    }
    if (tabHistory.length > 1) {
      const nextHistory = [...tabHistory];
      nextHistory.pop(); // remove current tab
      const previous = nextHistory[nextHistory.length - 1];
      setTabHistory(nextHistory);
      setActiveTab(previous);
    } else {
      if (activeTab !== 'engine') {
        setActiveTab('engine');
        setTabHistory(['engine']);
      } else {
        window.history.back();
      }
    }
  };

  const handleResetSession = () => {
    setInspectedTransaction(null);
    setActiveTab('engine');
    setTabHistory(['engine']);
  };
  
  // Persistent State Initializers: balances, transactions, and audit records survive app exits and reboots
  const [vaultBalances, setVaultBalances] = useState<VaultBalances>(() => loadVaultBalances());
  const [transactions, setTransactions] = useState<Transaction[]>(() => loadTransactions());
  const [speiTransfers, setSpeiTransfers] = useState<SpeiTransferRecord[]>(() => loadSpeiTransfers());
  const [vaultFiles, setVaultFiles] = useState<AuditFileRecord[]>(() => loadAuditFiles());
  const [ledgerChain, setLedgerChain] = useState<ImmutableBlock[]>(() => loadImmutableLedger(loadTransactions()));

  const [inspectedTransaction, setInspectedTransaction] = useState<Transaction | null>(null);

  // Background Job notification state
  const [archiveToast, setArchiveToast] = useState<{
    show: boolean;
    message: string;
    batchId?: string;
  } | null>(null);

  // Persistent storage auto-sync hooks
  useEffect(() => {
    saveVaultBalances(vaultBalances);
  }, [vaultBalances]);

  useEffect(() => {
    saveTransactions(transactions);
  }, [transactions]);

  useEffect(() => {
    saveSpeiTransfers(speiTransfers);
  }, [speiTransfers]);

  useEffect(() => {
    saveAuditFiles(vaultFiles);
  }, [vaultFiles]);

  useEffect(() => {
    saveImmutableLedger(ledgerChain);
  }, [ledgerChain]);

  // Engine Statistics & Hardware Acceleration State
  const [engineStats, setEngineStats] = useState<EngineStats>(() => {
    return {
      mode: 'STANDARD',
      parallelThreads: 1,
      processedCount: 26,
      reprobableCount: 4,
      autoDispatchedCount: 4,
      bufferMemoryKB: 218,
      bufferCapacityKB: 1024,
      cleanedBlocksCount: 3,
      avgLatencyUs: 142,
      isRunning: true,
      autoDispatchEnabled: true,
      longTermArchivedCount: 0,
      totalCompressedSavedKB: 0,
      lastArchiveJobRun: undefined,
      simulatedDaysElapsed: 0,
      isArchiveJobRunning: true,
      nextArchiveCycleSeconds: 30,
      realtimeThroughputTps: 12.5,
      isStreamingActive: true,
      streamingSpeedMs: 1800,
      totalFeesCollectedMXN: 184500,
      standardFeesCount: 16,
      riskFeesCount: 6,
      temporaryHoldCount: 1,
      seizureCount: 1,
      totalSeizedAmountMXN: 245000,
      totalHeldAmountMXN: 139500
    };
  });

  // Background Job: Compresses and moves SAR dispatch JSON logs to long-term storage
  const executeArchivalJob = (daysAdvancement: number = 30) => {
    setTransactions((prev) => {
      // 1. Advance simulated age on all dispatched SARs
      const updated = prev.map((tx) => {
        if ((tx.sarStatus === 'DISPATCHED_UIF' || tx.sarStatus === 'ACKNOWLEDGED') && tx.storageTier !== 'LONG_TERM_STORAGE') {
          const newAge = (tx.simulatedAgeDays || 0) + daysAdvancement;
          return { ...tx, simulatedAgeDays: newAge };
        }
        return tx;
      });

      // 2. Identify candidates: dispatched SARs that have reached >= 30 days
      const candidates = updated.filter(
        (tx) => (tx.sarStatus === 'DISPATCHED_UIF' || tx.sarStatus === 'ACKNOWLEDGED') &&
                tx.storageTier !== 'LONG_TERM_STORAGE' &&
                (tx.simulatedAgeDays || 0) >= 30
      );

      if (candidates.length === 0) {
        return updated;
      }

      const batchNum = Math.floor(100 + Math.random() * 900);
      const archiveBatchId = `LTS-COLD-2026-B${batchNum}-${Date.now().toString(36).toUpperCase()}`;
      const uncompressedBytes = candidates.length * 4250;
      const compressedBytes = Math.round(uncompressedBytes * 0.12);
      const savedBytes = uncompressedBytes - compressedBytes;
      const savedKB = Math.round(savedBytes / 1024);

      // 3. Mark candidate transactions as LONG_TERM_STORAGE with compression metadata
      const finalTxs = updated.map((tx) => {
        const isCandidate = candidates.some((c) => c.id === tx.id);
        if (isCandidate) {
          return {
            ...tx,
            storageTier: 'LONG_TERM_STORAGE' as const,
            archiveMetadata: {
              archivedAt: new Date().toISOString(),
              archiveBatchId,
              originalSizeBytes: 4250,
              compressedSizeBytes: 510,
              compressionRatio: '-88.0%',
              compressionAlgorithm: 'Zstandard Dictionary (zstd-v1.5.6)',
              storageVaultPath: `/vault/amlanfat/long_term_storage/2026/${archiveBatchId}.tar.zst`,
              simulatedAgeDays: tx.simulatedAgeDays || 30
            }
          };
        }
        return tx;
      });

      // 4. Register compressed bundle into Audit Vault catalog (with duplicate prevention)
      const newArchiveFile: AuditFileRecord = {
        id: `FILE-${archiveBatchId}`,
        fileName: `SAR_DISPATCH_COLD_ARCHIVE_${archiveBatchId}.tar.zst`,
        fileType: 'COMPRESSED_TAR_ZST',
        timestamp: new Date().toISOString(),
        fileSizeBytes: compressedBytes,
        sha256Hash: `0x${Math.random().toString(16).substring(2)}${Math.random().toString(16).substring(2)}a0b3`.slice(0, 66),
        authorityDestination: 'LONG_TERM_COLD_STORAGE',
        status: 'ARCHIVED_COMPRESSED',
        compressionRatio: '88.0%',
        itemsCount: candidates.length
      };

      setVaultFiles((vf) => {
        if (vf.some((f) => f.id === newArchiveFile.id)) return vf;
        return [newArchiveFile, ...vf];
      });

      // 5. Update engine stats to keep active memory lean
      setEngineStats((es) => {
        const activeTxs = finalTxs.filter((t) => t.storageTier !== 'LONG_TERM_STORAGE');
        const leanBuffer = Math.max(38, Math.min(es.bufferCapacityKB, 45 + activeTxs.length * 4));

        return {
          ...es,
          bufferMemoryKB: leanBuffer,
          longTermArchivedCount: es.longTermArchivedCount + candidates.length,
          totalCompressedSavedKB: es.totalCompressedSavedKB + savedKB,
          lastArchiveJobRun: new Date().toISOString(),
          cleanedBlocksCount: es.cleanedBlocksCount + 1
        };
      });

      // 6. Trigger toast feedback
      setArchiveToast({
        show: true,
        message: `Background Job (Ciclo 30 días): ${candidates.length} expedientes SAR comprimidos al 88% y migrados a 'long-term-storage'. Búfer de memoria aligerado (-${savedKB} KB).`,
        batchId: archiveBatchId
      });

      return finalTxs;
    });
  };

  // Background Job Timer: Runs every second, executing the 30-day epoch cycle every 30 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setEngineStats((prev) => {
        if (prev.nextArchiveCycleSeconds <= 1) {
          // Trigger the 30-day archival cycle
          setTimeout(() => {
            executeArchivalJob(30);
          }, 0);

          return {
            ...prev,
            nextArchiveCycleSeconds: 30,
            simulatedDaysElapsed: prev.simulatedDaysElapsed + 30
          };
        } else {
          return {
            ...prev,
            nextArchiveCycleSeconds: prev.nextArchiveCycleSeconds - 1
          };
        }
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Real-time synchronization loop: continuously processes streaming banking and crypto transactions in real time
  useEffect(() => {
    if (!engineStats.isStreamingActive) return;

    const intervalMs = engineStats.streamingSpeedMs || 1800;
    const streamTimer = setInterval(() => {
      const batchId = `RT-${Date.now().toString(36).toUpperCase()}`;
      // Occasional reprobable transaction (approx 14% chance to simulate real-world spikes)
      const isCritical = Math.random() < 0.14;
      const tx = generateSingleTransaction(batchId, isCritical);

      // Auto-dispatch if enabled and reprobable
      if (engineStats.autoDispatchEnabled && tx.riskBreakdown.totalScore >= 800) {
        tx.sarStatus = 'DISPATCHED_UIF';
        tx.sarFolio = tx.sarFolio || generateSarFolio();
        tx.sarDispatchTimestamp = new Date().toISOString();
        tx.sarReceiptHash = tx.sarReceiptHash || generateCryptoSha256Receipt(tx.id, tx.timestamp, tx.riskBreakdown.totalScore);
      }

      setTransactions((prev) => [tx, ...prev.slice(0, 160)]); // keep active memory optimized

      setEngineStats((prev) => {
        const tps = +(1000 / intervalMs).toFixed(1);
        const newProcessed = prev.processedCount + 1;
        const newReprobable = tx.riskBreakdown.totalScore >= 800 ? prev.reprobableCount + 1 : prev.reprobableCount;
        const newAutoDispatched = (tx.sarStatus === 'DISPATCHED_UIF') ? prev.autoDispatchedCount + 1 : prev.autoDispatchedCount;
        const newBuffer = Math.min(prev.bufferCapacityKB, prev.bufferMemoryKB + 3);

        return {
          ...prev,
          processedCount: newProcessed,
          reprobableCount: newReprobable,
          autoDispatchedCount: newAutoDispatched,
          realtimeThroughputTps: tps,
          bufferMemoryKB: newBuffer > prev.bufferCapacityKB * 0.92 ? 45 : newBuffer,
          cleanedBlocksCount: newBuffer > prev.bufferCapacityKB * 0.92 ? prev.cleanedBlocksCount + 1 : prev.cleanedBlocksCount,
          lastIncomingTxId: tx.id,
          lastIncomingChannel: tx.channel === 'CRYPTO' ? (tx.cryptoNetwork || 'Crypto') : (tx.bankName || tx.channel),
          lastIncomingScore: tx.riskBreakdown.totalScore
        };
      });
    }, intervalMs);

    return () => clearInterval(streamTimer);
  }, [engineStats.isStreamingActive, engineStats.streamingSpeedMs, engineStats.autoDispatchEnabled]);

  // Auto-dismiss toast after 6 seconds
  useEffect(() => {
    if (archiveToast?.show) {
      const timer = setTimeout(() => {
        setArchiveToast((prev) => prev ? { ...prev, show: false } : null);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [archiveToast]);

  const handleTriggerArchiveCycle = () => {
    executeArchivalJob(30);
    setEngineStats((prev) => ({
      ...prev,
      nextArchiveCycleSeconds: 30,
      simulatedDaysElapsed: prev.simulatedDaysElapsed + 30
    }));
  };

  // Keep counts in sync with transactions state
  useEffect(() => {
    const reprobables = transactions.filter((t) => t.riskBreakdown.totalScore >= 800);
    const dispatched = transactions.filter((t) => t.sarStatus === 'DISPATCHED_UIF' || t.sarStatus === 'ACKNOWLEDGED');
    const archived = transactions.filter((t) => t.storageTier === 'LONG_TERM_STORAGE');
    const activeHot = transactions.filter((t) => t.storageTier !== 'LONG_TERM_STORAGE');
    
    const totalFees = transactions.reduce((sum, t) => sum + (t.feeBreakdown?.feeAmountMXN || Math.round(t.amountMXN * 0.018)), 0);
    const count1_8 = transactions.filter((t) => !t.feeBreakdown?.isTemporaryHold && !t.feeBreakdown?.isSeized && (t.feeBreakdown?.feePercentage === 1.8 || !t.feeBreakdown)).length;
    const count2_5 = transactions.filter((t) => !t.feeBreakdown?.isTemporaryHold && !t.feeBreakdown?.isSeized && t.feeBreakdown?.feePercentage === 2.5).length;
    const holdCount = transactions.filter((t) => t.feeBreakdown?.isTemporaryHold || t.feeBreakdown?.feePercentage === 8.0).length;
    const seizeCount = transactions.filter((t) => t.feeBreakdown?.isSeized || t.feeBreakdown?.feePercentage === 20.0).length;
    const totalHeld = transactions.filter((t) => t.feeBreakdown?.isTemporaryHold).reduce((sum, t) => sum + t.amountMXN, 0);
    const totalSeized = transactions.filter((t) => t.feeBreakdown?.isSeized).reduce((sum, t) => sum + t.amountMXN, 0);

    setEngineStats((prev) => ({
      ...prev,
      processedCount: Math.max(prev.processedCount, transactions.length),
      reprobableCount: reprobables.length,
      autoDispatchedCount: dispatched.length,
      longTermArchivedCount: archived.length,
      bufferMemoryKB: Math.max(38, Math.min(prev.bufferCapacityKB, 45 + activeHot.length * 4)),
      totalFeesCollectedMXN: totalFees,
      standardFeesCount: count1_8,
      riskFeesCount: count2_5,
      temporaryHoldCount: holdCount,
      seizureCount: seizeCount,
      totalHeldAmountMXN: totalHeld,
      totalSeizedAmountMXN: totalSeized
    }));
  }, [transactions]);

  const handleUpdateFeeStatus = (txId: string, action: 'HOLD_8' | 'SEIZE_20' | 'STANDARD_1_8') => {
    setTransactions((prev) =>
      prev.map((tx) => {
        if (tx.id === txId) {
          let updatedFee;
          if (action === 'HOLD_8') {
            updatedFee = calculateTransactionFee(tx.amountMXN, tx.riskLevel, {
              isTemporaryHold: true,
              isSeized: false,
              holdReason: 'Retención preventiva de liquidación (8%) por factores de riesgo crítico dictaminada por Oficial de Cumplimiento'
            });
          } else if (action === 'SEIZE_20') {
            updatedFee = calculateTransactionFee(tx.amountMXN, tx.riskLevel, {
              isTemporaryHold: false,
              isSeized: true
            });
          } else {
            updatedFee = calculateTransactionFee(tx.amountMXN, tx.riskLevel, {
              isTemporaryHold: false,
              isSeized: false
            });
          }
          const updatedTx = { ...tx, feeBreakdown: updatedFee };
          if (inspectedTransaction?.id === txId) {
            setInspectedTransaction(updatedTx);
          }
          return updatedTx;
        }
        return tx;
      })
    );
  };

  const handleToggleStreaming = () => {
    setEngineStats((prev) => ({
      ...prev,
      isStreamingActive: !prev.isStreamingActive
    }));
  };

  const handleSetStreamingSpeed = (speedMs: number) => {
    setEngineStats((prev) => ({
      ...prev,
      streamingSpeedMs: speedMs
    }));
  };

  // Change engine mode: Standard vs Accelerator (5x) vs Turbo (20x)
  const handleSetEngineMode = (mode: 'STANDARD' | 'ACCELERATOR' | 'TURBO') => {
    let threads = 1;
    let latency = 165;
    if (mode === 'ACCELERATOR') {
      threads = 4;
      latency = 68;
    } else if (mode === 'TURBO') {
      threads = 16;
      latency = 24;
    }

    setEngineStats((prev) => ({
      ...prev,
      mode,
      parallelThreads: threads,
      avgLatencyUs: latency
    }));
  };

  const handleToggleAutoDispatch = () => {
    setEngineStats((prev) => ({
      ...prev,
      autoDispatchEnabled: !prev.autoDispatchEnabled
    }));
  };

  const handleCleanBufferMemory = () => {
    setEngineStats((prev) => ({
      ...prev,
      bufferMemoryKB: 48,
      cleanedBlocksCount: prev.cleanedBlocksCount + 1
    }));
  };

  // Generate batch of transactions
  const handleGenerateBatch = (channel?: TransactionChannel, forceReprobable: boolean = false) => {
    const batchId = `BLOCK-${Date.now().toString(36).toUpperCase()}`;
    const newItems: Transaction[] = [];
    const count = forceReprobable ? 1 : 6;

    for (let i = 0; i < count; i++) {
      const tx = generateSingleTransaction(batchId, forceReprobable);
      if (channel) {
        tx.channel = channel;
      }
      
      // Auto-dispatch if enabled and reprobable
      if (engineStats.autoDispatchEnabled && tx.riskBreakdown.totalScore >= 800) {
        tx.sarStatus = 'DISPATCHED_UIF';
        tx.sarFolio = tx.sarFolio || generateSarFolio();
        tx.sarDispatchTimestamp = new Date().toISOString();
        tx.sarReceiptHash = tx.sarReceiptHash || generateCryptoSha256Receipt(tx.id, tx.timestamp, tx.riskBreakdown.totalScore);
      }

      newItems.push(tx);
    }

    setTransactions((prev) => [...newItems, ...prev]);
  };

  // Dispatch single SAR to UIF
  const handleDispatchSingleSar = (txId: string) => {
    setTransactions((prev) =>
      prev.map((tx) => {
        if (tx.id === txId) {
          const folio = tx.sarFolio || generateSarFolio();
          const timestamp = new Date().toISOString();
          const receipt = generateCryptoSha256Receipt(tx.id, timestamp, tx.riskBreakdown.totalScore);
          return {
            ...tx,
            sarStatus: 'DISPATCHED_UIF',
            sarFolio: folio,
            sarDispatchTimestamp: timestamp,
            sarReceiptHash: receipt
          };
        }
        return tx;
      })
    );
  };

  // Dispatch all queued SARs
  const handleDispatchAllQueued = () => {
    setTransactions((prev) =>
      prev.map((tx) => {
        if (tx.riskBreakdown.totalScore >= 800 && tx.sarStatus !== 'DISPATCHED_UIF') {
          const folio = tx.sarFolio || generateSarFolio();
          const timestamp = new Date().toISOString();
          const receipt = generateCryptoSha256Receipt(tx.id, timestamp, tx.riskBreakdown.totalScore);
          return {
            ...tx,
            sarStatus: 'DISPATCHED_UIF',
            sarFolio: folio,
            sarDispatchTimestamp: timestamp,
            sarReceiptHash: receipt
          };
        }
        return tx;
      })
    );
  };

  // Execute SPEI Transfer
  const handleExecuteSpeiTransfer = (
    data: Omit<SpeiTransferRecord, 'id' | 'timestamp' | 'status' | 'cepFolio' | 'auditCertificateHash'>
  ) => {
    const id = `SPEI-LIQ-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const cepFolio = `CEP-BANXICO-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000000 + Math.random() * 9000000)}`;
    const auditCertificateHash = `0x${Math.random().toString(16).substring(2)}${Math.random().toString(16).substring(2)}fe49a`.slice(0, 66);

    const newRecord: SpeiTransferRecord = {
      ...data,
      id,
      timestamp: new Date().toISOString(),
      status: 'LIQUIDATED_SETTLED',
      cepFolio,
      auditCertificateHash
    };

    setSpeiTransfers((prev) => [newRecord, ...prev]);
  };

  const handleExportExcel = () => {
    exportTransactionsToExcel(transactions, speiTransfers);
  };

  const handlePrintAudit = () => {
    triggerPrintAuditSheet();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Bar Navigation */}
      <Navigation
        activeTab={activeTab}
        setActiveTab={handleSelectTab}
        reprobableCount={engineStats.reprobableCount}
        autoDispatchedCount={engineStats.autoDispatchedCount}
        blacklistCount={transactions.filter(t => t.isBlacklisted || t.blacklistMatch).length}
        canGoBack={tabHistory.length > 1 || !!inspectedTransaction || activeTab !== 'engine'}
        onBack={handleBack}
        onCloseWindow={() => {
          try {
            window.close();
          } catch {}
          // Dispatch custom event or fallback prompt
          alert('Cierre de ventana: Puedes cerrar esta pestaña en el navegador con Ctrl+W o Cmd+W, o usar el dock ajustable inferior para poner en modo Standby.');
        }}
        onExportExcel={handleExportExcel}
        onPrintAudit={handlePrintAudit}
        onTriggerAntiSnooping={() => window.dispatchEvent(new CustomEvent('amlanfat:trigger_anti_snooping'))}
        onTriggerKeepAlive={() => window.dispatchEvent(new CustomEvent('amlanfat:trigger_keep_alive'))}
      />

      {/* Main Workspace Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 no-print">
        {activeTab === 'engine' && (
          <RiskEngineDashboard
            transactions={transactions}
            engineStats={engineStats}
            onSetEngineMode={handleSetEngineMode}
            onToggleAutoDispatch={handleToggleAutoDispatch}
            onCleanBufferMemory={handleCleanBufferMemory}
            onGenerateBatch={handleGenerateBatch}
            onInspectTransaction={(tx) => setInspectedTransaction(tx)}
            onDispatchSar={handleDispatchSingleSar}
            onTriggerArchiveCycle={handleTriggerArchiveCycle}
            onToggleStreaming={handleToggleStreaming}
            onSetStreamingSpeed={handleSetStreamingSpeed}
            onUpdateFeeStatus={handleUpdateFeeStatus}
          />
        )}

        {activeTab === 'whitelist' && (
          <MiCuentaFinalWhitelistManager
            vaultBalances={vaultBalances}
            onUpdateVaultBalances={setVaultBalances}
          />
        )}

        {activeTab === 'architecture' && (
          <SpeiMainnetArchitectureAudit />
        )}

        {activeTab === 'taxes' && (
          <GovernmentTaxComplianceManager
            vaultBalances={vaultBalances}
            onUpdateVaultBalances={setVaultBalances}
          />
        )}

        {activeTab === 'blacklist' && (
          <RegulatoryBlacklistScreening
            transactions={transactions}
            onInspectTransaction={(tx) => setInspectedTransaction(tx)}
          />
        )}

        {activeTab === 'dispenser' && (
          <SpeiNodesAndDispenser />
        )}

        {activeTab === 'sar' && (
          <SarDispatchCenter
            transactions={transactions}
            onDispatchAllQueued={handleDispatchAllQueued}
            onDispatchSingle={handleDispatchSingleSar}
            onInspectTransaction={(tx) => setInspectedTransaction(tx)}
          />
        )}

        {activeTab === 'vault' && (
          <SovereignVaultSpei
            speiTransfers={speiTransfers}
            transactions={transactions}
            vaultBalances={vaultBalances}
            onUpdateVaultBalances={setVaultBalances}
            onExecuteSpeiTransfer={handleExecuteSpeiTransfer}
            onResetVaultBalances={() => {
              setVaultBalances(DEFAULT_VAULT_BALANCES);
              saveVaultBalances(DEFAULT_VAULT_BALANCES);
            }}
          />
        )}

        {activeTab === 'ledger' && (
          <ImmutableLedgerViewer
            ledgerChain={ledgerChain}
            onUpdateLedgerChain={setLedgerChain}
            transactions={transactions}
          />
        )}

        {activeTab === 'audit' && (
          <AuditVaultFiles
            transactions={transactions}
            speiTransfers={speiTransfers}
            vaultFiles={vaultFiles}
            onPrintAudit={handlePrintAudit}
          />
        )}

        {activeTab === 'legal' && (
          <RegulatoryComplianceLegal />
        )}
      </main>

      {/* Floating Notification for Background Archival Job */}
      {archiveToast?.show && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md bg-slate-900 border border-indigo-500/60 rounded-xl p-4 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-indigo-950 border border-indigo-700/60 text-indigo-400 shrink-0">
              <Archive className="w-5 h-5" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white">Background Job Ejecutado</span>
                <button
                  onClick={() => setArchiveToast(null)}
                  className="p-1 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-xs text-slate-300 leading-snug">{archiveToast.message}</p>
              {archiveToast.batchId && (
                <span className="text-[10px] font-mono text-indigo-300 block">Lote: {archiveToast.batchId}</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-4 px-6 text-xs text-slate-400 no-print">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-300">AMLanfat Suite v3.8</span>
            <span>·</span>
            <span>Motor de Riesgo Bancario & Criptoactivo (0-1000)</span>
            <span>·</span>
            <span>Registro INDAUTOR: 03-2026-092611452300-01</span>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
            <span className="inline-flex items-center gap-1 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Memoria Persistente de Saldos: ACTIVA</span>
            </span>
            <span>·</span>
            <span>Custodia 10 Años Art. 115 LIC</span>
          </div>
        </div>
      </footer>

      {/* Transaction Details & JSON Inspector Modal */}
      {inspectedTransaction && (
        <TransactionInspectorModal
          transaction={inspectedTransaction}
          onClose={() => setInspectedTransaction(null)}
          onDispatchSar={(txId) => {
            handleDispatchSingleSar(txId);
            setInspectedTransaction(null);
          }}
          onUpdateFeeStatus={handleUpdateFeeStatus}
        />
      )}

      {/* Clean Print / PDF Official Audit Sheet (hidden on screen, active on print) */}
      <PrintAuditReport
        transactions={transactions}
        speiTransfers={speiTransfers}
      />

      {/* Anti-Snooping, Anti-Overlay Attack & Sensory Keep-Alive Ambient Sentinel */}
      <SecurityShieldSentinel
        engineStats={engineStats}
        transactions={transactions}
        isStreamingActive={engineStats.isStreamingActive}
      />

      {/* Botón Ajustable de Back y Cerrar Ventana (Draggable, Resizable & Standby) */}
      <AdjustableWindowControls
        currentTab={activeTab}
        tabHistory={tabHistory}
        canGoBack={tabHistory.length > 1 || !!inspectedTransaction || activeTab !== 'engine'}
        isModalActive={Boolean(inspectedTransaction)}
        onBack={handleBack}
        onResetSession={handleResetSession}
        tabLabelsMap={TAB_LABELS_MAP}
      />
    </div>
  );
}
