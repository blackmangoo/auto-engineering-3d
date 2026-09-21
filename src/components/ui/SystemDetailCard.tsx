import React, { useState } from 'react';
import type { SubsystemType } from '../../types/automotive';
import { SYSTEMS_DATA } from '../../data/systemsData';
import {
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Sliders,
  Scale,
  Cpu,
  Info
} from 'lucide-react';

interface SystemDetailCardProps {
  currentSubsystem: SubsystemType;
}

export const SystemDetailCard: React.FC<SystemDetailCardProps> = ({
  currentSubsystem
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const data = SYSTEMS_DATA[currentSubsystem];

  if (!data) return null;

  return (
    <section className="fixed bottom-24 left-4 z-40 w-96 max-w-[calc(100vw-2rem)] pointer-events-auto">
      <div className="glass-panel rounded-2xl shadow-2xl border border-white/10 hover:border-cyan-500/30 transition-all overflow-hidden">
        {/* Header bar */}
        <div
          className="p-3.5 bg-gradient-to-r from-white/5 to-white/0 flex items-center justify-between cursor-pointer border-b border-white/10"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-cyan-400 tracking-wider uppercase block">
                {data.category}
              </span>
              <h2 className="text-sm font-bold text-white tracking-tight leading-none mt-0.5">
                {data.title}
              </h2>
            </div>
          </div>
          <button className="text-gray-400 hover:text-white p-1">
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>

        {/* Collapsible Content */}
        {isExpanded && (
          <div className="p-4 max-h-[50vh] overflow-y-auto space-y-4 text-xs font-sans">
            {/* Tagline / Overview */}
            <p className="text-gray-300 text-xs leading-relaxed border-l-2 border-cyan-400 pl-3 italic">
              {data.tagline}
            </p>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-2 font-mono">
              {data.metrics.map((m, idx) => (
                <div key={idx} className="bg-black/40 p-2 rounded-xl border border-white/5">
                  <span className="text-[10px] text-gray-400 block">{m.label}</span>
                  <div className="text-sm font-bold text-white mt-0.5">
                    {m.value}{' '}
                    <span className="text-[10px] text-cyan-400 font-normal">{m.unit}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Engineering Principles */}
            <div>
              <h3 className="text-xs font-bold text-gray-200 uppercase tracking-wider mb-2 flex items-center gap-1.5 font-mono">
                <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                Engineering Principles
              </h3>
              <ul className="space-y-1.5 text-gray-300">
                {data.principles.map((p, idx) => (
                  <li key={idx} className="flex items-start space-x-2 text-[11px] leading-tight">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Key Components */}
            <div>
              <h3 className="text-xs font-bold text-gray-200 uppercase tracking-wider mb-2 flex items-center gap-1.5 font-mono">
                <Sliders className="w-3.5 h-3.5 text-purple-400" />
                Key Components
              </h3>
              <div className="space-y-2">
                {data.keyComponents.map((c, idx) => (
                  <div key={idx} className="bg-white/5 p-2 rounded-xl border border-white/5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white text-[11px]">{c.name}</span>
                      <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-500/20">
                        {c.spec}
                      </span>
                    </div>
                    <p className="text-gray-400 text-[10px] mt-1 leading-normal">{c.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Engineering Trade-offs */}
            <div>
              <h3 className="text-xs font-bold text-gray-200 uppercase tracking-wider mb-2 flex items-center gap-1.5 font-mono">
                <Scale className="w-3.5 h-3.5 text-amber-400" />
                Engineering Trade-Offs
              </h3>
              <div className="space-y-2">
                {data.engineeringTradeoffs.map((t, idx) => (
                  <div key={idx} className="bg-black/30 p-2.5 rounded-xl border border-white/5 text-[11px]">
                    <div className="font-semibold text-amber-300 mb-1">{t.title}</div>
                    <div className="text-emerald-400">
                      <span className="font-bold">PRO:</span> {t.pro}
                    </div>
                    <div className="text-rose-400 mt-0.5">
                      <span className="font-bold">CON:</span> {t.con}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
