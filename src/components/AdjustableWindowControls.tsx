import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  X, 
  Move, 
  Maximize2, 
  Minimize2, 
  Sliders, 
  RotateCcw, 
  ShieldAlert, 
  Lock, 
  LogOut, 
  Compass,
  Check,
  ChevronRight,
  Eye,
  GripHorizontal
} from 'lucide-react';
import { ActiveTab } from './Navigation';

export type DockCorner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'custom';
export type ControlSize = 'compact' | 'normal' | 'large';

interface AdjustableWindowControlsProps {
  currentTab: ActiveTab;
  tabHistory: ActiveTab[];
  onBack: () => void;
  canGoBack: boolean;
  isModalActive?: boolean;
  onCloseWindow?: () => void;
  onResetSession?: () => void;
  tabLabelsMap?: Record<ActiveTab, string>;
}

const STORAGE_KEYS = {
  POSITION: 'amlanfat_window_controls_pos_v1',
  CONFIG: 'amlanfat_window_controls_cfg_v1'
};

export const AdjustableWindowControls: React.FC<AdjustableWindowControlsProps> = ({
  currentTab,
  tabHistory,
  onBack,
  canGoBack,
  isModalActive = false,
  onCloseWindow,
  onResetSession,
  tabLabelsMap
}) => {
  // Detection for active modal anywhere in the DOM
  const [hasActiveModal, setHasActiveModal] = useState<boolean>(false);

  useEffect(() => {
    const detectOpenModals = () => {
      const found = document.querySelectorAll('.fixed.inset-0:not(#app-standby-overlay):not(#app-close-modal)');
      const hasOther = Array.from(found).some(el => {
        return !el.closest('aside') && (el.classList.contains('z-50') || el.hasAttribute('role') || el.classList.contains('backdrop-blur-sm') || el.classList.contains('backdrop-blur-md'));
      });
      setHasActiveModal(Boolean(isModalActive || hasOther));
    };

    const interval = setInterval(detectOpenModals, 200);
    detectOpenModals();
    return () => clearInterval(interval);
  }, [isModalActive]);

  // Modal / overlay states for window controls
  const [showSettings, setShowSettings] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [isLockedStandby, setIsLockedStandby] = useState(false);

  const effectiveCanGoBack = canGoBack || hasActiveModal || Boolean(isModalActive) || showCloseModal || isLockedStandby;

  const handleBackClick = () => {
    if (showCloseModal) {
      setShowCloseModal(false);
      return;
    }
    if (isLockedStandby) {
      setIsLockedStandby(false);
      return;
    }
    if (showSettings) {
      setShowSettings(false);
      return;
    }

    if (hasActiveModal || isModalActive) {
      window.dispatchEvent(new CustomEvent('amlanfat:close_active_modal'));
      const escEvent = new KeyboardEvent('keydown', { 
        key: 'Escape', 
        code: 'Escape', 
        keyCode: 27, 
        which: 27, 
        bubbles: true, 
        cancelable: true 
      });
      document.dispatchEvent(escEvent);
      window.dispatchEvent(escEvent);
    }
    onBack();
  };
  // Config state
  const [size, setSize] = useState<ControlSize>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CONFIG);
      if (saved) return JSON.parse(saved).size || 'normal';
    } catch {}
    return 'normal';
  });

  const [corner, setCorner] = useState<DockCorner>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CONFIG);
      if (saved) return JSON.parse(saved).corner || 'bottom-right';
    } catch {}
    return 'bottom-right';
  });

  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CONFIG);
      if (saved) return JSON.parse(saved).isCollapsed || false;
    } catch {}
    return false;
  });

  // Position state (for custom dragging)
  const [pos, setPos] = useState<{ x: number; y: number }>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.POSITION);
      if (saved) return JSON.parse(saved);
    } catch {}
    return { x: window.innerWidth - 220, y: window.innerHeight - 80 };
  });

  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number }>({
    startX: 0,
    startY: 0,
    initialX: 0,
    initialY: 0
  });

  // Save config
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify({ size, corner, isCollapsed }));
    } catch {}
  }, [size, corner, isCollapsed]);

  // Save custom pos
  useEffect(() => {
    if (corner === 'custom') {
      try {
        localStorage.setItem(STORAGE_KEYS.POSITION, JSON.stringify(pos));
      } catch {}
    }
  }, [pos, corner]);

  // Keyboard shortcut listener: Alt + Left Arrow for Back, Esc for Close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key === 'ArrowLeft') {
        if (canGoBack) {
          e.preventDefault();
          onBack();
        }
      } else if (e.key === 'Escape' && showCloseModal) {
        setShowCloseModal(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canGoBack, onBack, showCloseModal]);

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return; // Don't drag if clicking a button
    setIsDragging(true);
    setCorner('custom');
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: pos.x,
      initialY: pos.y
    };
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    const touch = e.touches[0];
    setIsDragging(true);
    setCorner('custom');
    dragStartRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      initialX: pos.x,
      initialY: pos.y
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - dragStartRef.current.startX;
      const dy = e.clientY - dragStartRef.current.startY;
      const newX = Math.max(10, Math.min(window.innerWidth - 180, dragStartRef.current.initialX + dx));
      const newY = Math.max(10, Math.min(window.innerHeight - 70, dragStartRef.current.initialY + dy));
      setPos({ x: newX, y: newY });
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) return;
      const touch = e.touches[0];
      const dx = touch.clientX - dragStartRef.current.startX;
      const dy = touch.clientY - dragStartRef.current.startY;
      const newX = Math.max(10, Math.min(window.innerWidth - 180, dragStartRef.current.initialX + dx));
      const newY = Math.max(10, Math.min(window.innerHeight - 70, dragStartRef.current.initialY + dy));
      setPos({ x: newX, y: newY });
    };

    const handleMouseUp = () => setIsDragging(false);

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging]);

  // Snap to preset corner
  const snapToCorner = (targetCorner: DockCorner) => {
    setCorner(targetCorner);
    setShowSettings(false);
  };

  // Close window handler
  const handleRequestClose = () => {
    try {
      window.close();
    } catch {}
    // If not closed by script restriction, open confirmation modal
    setShowCloseModal(true);
  };

  // Determine container positioning styles based on corner
  const getPositionClasses = () => {
    if (corner === 'custom') {
      return '';
    }
    switch (corner) {
      case 'top-left':
        return 'top-20 left-4';
      case 'top-right':
        return 'top-20 right-4';
      case 'bottom-left':
        return 'bottom-5 left-4';
      case 'bottom-right':
      default:
        return 'bottom-5 right-4';
    }
  };

  const previousTab = tabHistory.length > 1 ? tabHistory[tabHistory.length - 2] : null;
  const previousTabLabel = previousTab && tabLabelsMap ? tabLabelsMap[previousTab] : previousTab;

  return (
    <>
      {/* Standby Lock Screen Overlay */}
      {isLockedStandby && (
        <div id="app-standby-overlay" className="fixed inset-0 z-[2147483640] bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in fade-in">
          <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-700/80 flex items-center justify-center text-emerald-400 mb-4 shadow-2xl shadow-emerald-950/50">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-100 mb-1">Terminal en Modo Standby Seguro</h2>
          <p className="text-xs text-slate-400 max-w-sm mb-6">
            La sesión se encuentra pausada para proteger los datos de cumplimiento fiscal y transacciones SPEI.
          </p>
          <button
            onClick={() => setIsLockedStandby(false)}
            className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-950/40 transition-all cursor-pointer flex items-center gap-2"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Desbloquear y Reanudar Terminal</span>
          </button>
        </div>
      )}

      {/* Close Window Confirmation Modal */}
      {showCloseModal && (
        <div id="app-close-modal" className="fixed inset-0 z-[2147483641] bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-rose-400">
                <LogOut className="w-5 h-5" />
                <h3 className="text-base font-bold text-slate-100">Cerrar Ventana / Salir del Sistema</h3>
              </div>
              <button
                onClick={() => setShowCloseModal(false)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              ¿Deseas cerrar la ventana de la terminal de pagos o pausar la sesión de auditoría? El navegador puede restringir el cierre directo de pestañas no abiertas por script.
            </p>

            <div className="space-y-2 pt-2">
              <button
                onClick={() => {
                  try {
                    window.close();
                  } catch {}
                  // If still open, inform user
                  alert('Para cerrar la pestaña en este navegador, puedes utilizar el atajo Ctrl+W (o Cmd+W en Mac) o cerrar la pestaña superior.');
                  setShowCloseModal(false);
                }}
                className="w-full py-2.5 px-3 bg-rose-600/90 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
                <span>Intentar Cerrar Pestaña / Ventana</span>
              </button>

              <button
                onClick={() => {
                  setShowCloseModal(false);
                  setIsLockedStandby(true);
                }}
                className="w-full py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium flex items-center justify-center gap-2 border border-slate-700 transition-colors cursor-pointer"
              >
                <Lock className="w-4 h-4 text-amber-400" />
                <span>Bloquear Terminal (Modo Standby Seguro)</span>
              </button>

              {onResetSession && (
                <button
                  onClick={() => {
                    setShowCloseModal(false);
                    onResetSession();
                  }}
                  className="w-full py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium flex items-center justify-center gap-2 border border-slate-700 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4 text-cyan-400" />
                  <span>Volver a la Vista Principal (Engine)</span>
                </button>
              )}
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setShowCloseModal(false)}
                className="text-xs text-slate-400 hover:text-slate-200 underline font-mono"
              >
                Cancelar y Permanecer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Adjustable Window Controls Dock - Superimposed over all modals and popups */}
      <aside
        aria-label="Controles ajustables de ventana sobrepuestos"
        onMouseDown={corner === 'custom' ? handleMouseDown : undefined}
        onTouchStart={corner === 'custom' ? handleTouchStart : undefined}
        style={{
          ...(corner === 'custom' ? { left: `${pos.x}px`, top: `${pos.y}px` } : {}),
          position: 'fixed',
          zIndex: 2147483647
        }}
        className={`${corner !== 'custom' ? `fixed ${getPositionClasses()}` : ''} z-[2147483647] select-none transition-shadow ${
          isDragging ? 'cursor-grabbing opacity-95 scale-105' : ''
        }`}
      >
        <div className="bg-slate-900/98 backdrop-blur-xl border border-cyan-500/50 rounded-2xl p-1.5 shadow-[0_12px_45px_rgba(0,0,0,0.95)] ring-2 ring-cyan-500/30 flex items-center gap-1.5 transition-all">
          {/* Drag Handle / Gripper */}
          <div 
            title="Arrastrar para mover este panel sobre cualquier ventana o modal de la aplicación"
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            className="p-1 text-slate-500 hover:text-cyan-300 cursor-grab active:cursor-grabbing rounded hover:bg-slate-800/60"
          >
            <GripHorizontal className="w-3.5 h-3.5" />
          </div>

          {/* Collapsed Pill Mode */}
          {isCollapsed ? (
            <div className="flex items-center gap-1">
              <button
                onClick={handleBackClick}
                disabled={!effectiveCanGoBack}
                title={hasActiveModal ? 'Cerrar ventana emergente activa' : previousTabLabel ? `Atrás: ${previousTabLabel} (Alt + ←)` : 'Volver a la vista anterior'}
                className="p-2 rounded-xl text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors relative"
              >
                <ArrowLeft className="w-4 h-4" />
                {hasActiveModal && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 border border-slate-900" />
                )}
              </button>
              <button
                onClick={handleRequestClose}
                title="Cerrar ventana o salir del sistema"
                className="p-2 rounded-xl text-rose-400 hover:text-white bg-rose-950/60 hover:bg-rose-600 border border-rose-900/40 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsCollapsed(false)}
                title="Expandir controles ajustables"
                className="p-1.5 text-slate-400 hover:text-slate-200"
              >
                <Maximize2 className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <>
              {/* Botón Atrás (Back) */}
              <button
                onClick={handleBackClick}
                disabled={!effectiveCanGoBack}
                title={hasActiveModal ? 'Cerrar ventana emergente abierta (Alt + ←)' : previousTabLabel ? `Volver a ${previousTabLabel} (Alt + Flecha Izquierda)` : 'Atrás (vista anterior)'}
                className={`flex items-center gap-1.5 rounded-xl font-medium transition-all cursor-pointer ${
                  size === 'compact'
                    ? 'p-2'
                    : size === 'large'
                    ? 'px-3.5 py-2 text-xs'
                    : 'px-3 py-1.5 text-xs'
                } ${
                  effectiveCanGoBack
                    ? hasActiveModal 
                      ? 'bg-amber-950/80 hover:bg-amber-900/90 text-amber-200 border border-amber-500/60 shadow-lg shadow-amber-950/40 active:scale-95'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-100 hover:text-cyan-300 border border-slate-700/80 active:scale-95 shadow-sm'
                    : 'bg-slate-800/40 text-slate-500 border border-slate-800/60 cursor-not-allowed'
                }`}
              >
                <ArrowLeft className={`${size === 'large' ? 'w-4 h-4' : 'w-3.5 h-3.5'} ${hasActiveModal ? 'text-amber-400' : 'text-cyan-400'}`} />
                {size !== 'compact' && (
                  <span className="font-semibold flex items-center gap-1.5">
                    {hasActiveModal ? (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                        <span>Cerrar Emergente</span>
                      </>
                    ) : previousTabLabel ? (
                      `Atrás (${previousTabLabel})`
                    ) : (
                      'Atrás'
                    )}
                  </span>
                )}
              </button>

              {/* Botón Cerrar Ventana (Close Window) */}
              <button
                onClick={handleRequestClose}
                title="Cerrar ventana / Pausar sesión"
                className={`flex items-center gap-1.5 rounded-xl font-medium transition-all cursor-pointer ${
                  size === 'compact'
                    ? 'p-2'
                    : size === 'large'
                    ? 'px-3.5 py-2 text-xs'
                    : 'px-3 py-1.5 text-xs'
                } bg-rose-950/70 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-800/50 shadow-sm active:scale-95`}
              >
                <X className={`${size === 'large' ? 'w-4 h-4' : 'w-3.5 h-3.5'}`} />
                {size !== 'compact' && (
                  <span className="font-semibold">Cerrar Ventana</span>
                )}
              </button>

              {/* Settings / Adjust Popover Button */}
              <div className="relative">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  title="Ajustar posición y tamaño de los botones"
                  className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                  <Sliders className="w-3.5 h-3.5" />
                </button>

                {/* Settings Menu Popup */}
                {showSettings && (
                  <div className="absolute bottom-full right-0 mb-2 w-56 bg-slate-900 border border-slate-700/90 rounded-xl p-3 shadow-2xl space-y-3 text-xs text-slate-300 z-[100001]">
                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                      <span className="font-bold text-slate-200 flex items-center gap-1.5">
                        <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                        Ajuste de Botones
                      </span>
                      <button
                        onClick={() => setShowSettings(false)}
                        className="text-slate-400 hover:text-slate-200"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Size Selector */}
                    <div>
                      <label className="text-[10px] text-slate-400 uppercase font-mono block mb-1">
                        Tamaño del Control:
                      </label>
                      <div className="grid grid-cols-3 gap-1">
                        {(['compact', 'normal', 'large'] as const).map(s => (
                          <button
                            key={s}
                            onClick={() => setSize(s)}
                            className={`py-1 rounded text-[11px] font-medium capitalize transition-colors ${
                              size === s 
                                ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/80 font-bold' 
                                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                            }`}
                          >
                            {s === 'compact' ? 'Icono' : s === 'normal' ? 'Normal' : 'Grande'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Snap to Corner Presets */}
                    <div>
                      <label className="text-[10px] text-slate-400 uppercase font-mono block mb-1">
                        Fijar en Esquina:
                      </label>
                      <div className="grid grid-cols-2 gap-1 text-[11px]">
                        <button
                          onClick={() => snapToCorner('top-left')}
                          className={`p-1.5 rounded text-left transition-colors ${corner === 'top-left' ? 'bg-cyan-950 text-cyan-300 font-bold border border-cyan-800/60' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                        >
                          Arriba Izquierda
                        </button>
                        <button
                          onClick={() => snapToCorner('top-right')}
                          className={`p-1.5 rounded text-left transition-colors ${corner === 'top-right' ? 'bg-cyan-950 text-cyan-300 font-bold border border-cyan-800/60' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                        >
                          Arriba Derecha
                        </button>
                        <button
                          onClick={() => snapToCorner('bottom-left')}
                          className={`p-1.5 rounded text-left transition-colors ${corner === 'bottom-left' ? 'bg-cyan-950 text-cyan-300 font-bold border border-cyan-800/60' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                        >
                          Abajo Izquierda
                        </button>
                        <button
                          onClick={() => snapToCorner('bottom-right')}
                          className={`p-1.5 rounded text-left transition-colors ${corner === 'bottom-right' ? 'bg-cyan-950 text-cyan-300 font-bold border border-cyan-800/60' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                        >
                          Abajo Derecha
                        </button>
                      </div>
                    </div>

                    <div className="pt-1 border-t border-slate-800 flex items-center justify-between">
                      <span className="text-[10px] text-slate-500">Arrastrable con el mouse</span>
                      <button
                        onClick={() => {
                          setIsCollapsed(true);
                          setShowSettings(false);
                        }}
                        className="text-[11px] text-cyan-400 hover:underline"
                      >
                        Minimizar panel
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Minimize to icon */}
              <button
                onClick={() => setIsCollapsed(true)}
                title="Minimizar panel a botón compacto"
                className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <Minimize2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </aside>
    </>
  );
};
