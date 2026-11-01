import React from 'react';
import { RiskLevel } from '../types/aml';
import { ShieldCheck, ShieldAlert, AlertTriangle, ShieldX } from 'lucide-react';

interface RiskScoreDisplayProps {
  score: number;
  level: RiskLevel;
  size?: 'sm' | 'md' | 'lg';
  showBar?: boolean;
}

export const RiskScoreDisplay: React.FC<RiskScoreDisplayProps> = ({
  score,
  level,
  size = 'md',
  showBar = false
}) => {
  const getMeta = () => {
    switch (level) {
      case 'CRITICAL_REPROBABLE':
        return {
          textColor: 'text-rose-400',
          barColor: 'bg-rose-500',
          label: 'Reprobable / SAR Obligatorio',
          icon: <ShieldX className="w-3.5 h-3.5 text-rose-400 shrink-0" />
        };
      case 'HIGH':
        return {
          textColor: 'text-amber-400',
          barColor: 'bg-amber-500',
          label: 'Riesgo Alto',
          icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        };
      case 'MEDIUM':
        return {
          textColor: 'text-yellow-300',
          barColor: 'bg-yellow-400',
          label: 'Riesgo Medio',
          icon: <ShieldAlert className="w-3.5 h-3.5 text-yellow-300 shrink-0" />
        };
      case 'LOW':
      default:
        return {
          textColor: 'text-emerald-400',
          barColor: 'bg-emerald-500',
          label: 'Riesgo Bajo / Aprobado',
          icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        };
    }
  };

  const meta = getMeta();
  const percentage = Math.min(100, Math.max(0, (score / 1000) * 100));

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5 text-xs">
        {meta.icon}
        <span className={`font-mono tabular-nums font-semibold ${meta.textColor} ${size === 'lg' ? 'text-base' : 'text-xs'}`}>
          {score}
          <span className="text-slate-500 text-[10px] font-normal">/1000</span>
        </span>
        <span className="text-slate-500" aria-hidden="true">·</span>
        <span className={`${meta.textColor} font-medium`}>{meta.label}</span>
      </div>

      {showBar && (
        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
          <div 
            className={`h-full ${meta.barColor} transition-all duration-300`} 
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
    </div>
  );
};
