import React from 'react';
import type {
  SubsystemType,
  ViewerSettings
} from '../../types/automotive';
import {
  Gauge,
  Layers,
  Volume2,
  VolumeX,
  Eye,
  Wind,
  RotateCcw,
  Sparkles,
  Zap,
  Sliders
} from 'lucide-react';

interface NavbarProps {
  currentSubsystem: SubsystemType;
  onSelectSubsystem: (id: SubsystemType) => void;
  viewerSettings: ViewerSettings;
  onUpdateViewerSettings: (settings: Partial<ViewerSettings>) => void;
  fps: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentSubsystem,
  onSelectSubsystem,
  viewerSettings,
  onUpdateViewerSettings,
  fps
}) => {
  const subsystems: { id: SubsystemType; label: string; icon: string }[] = [
    { id: 'overview', label: 'Aero Body', icon: '01' },
    { id: 'chassis', label: 'Exploded View', icon: '02' },
    { id: 'engine', label: 'V6 Engine', icon: '03' },
    { id: 'transmission', label: '7-Speed DCT', icon: '04' },
    { id: 'suspension', label: 'Suspension', icon: '05' },
    { id: 'brakes', label: 'Carbon Brakes', icon: '06' },
    { id: 'hvac', label: 'HVAC Thermal', icon: '07' },
    { id: 'sandbox', label: 'Diagnostic Lab', icon: '08' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 pointer-events-auto">
      {/* Top Telemetry Ticker */}
      <div className="bg-[#090b11]/90 backdrop-blur-md border-b border-cyan-500/20 px-4 py-1.5 flex items-center justify-between text-xs font-mono text-gray-400">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-gray-200 font-semibold tracking-wider">APEX-V6 DYNAMICS LAB</span>
          </div>
          <span className="hidden md:inline text-gray-600">|</span>
          <div className="hidden md:flex items-center space-x-2 text-gray-300">
            <span>SYS:</span>
            <span className="text-cyan-400 font-bold uppercase">{currentSubsystem}</span>
          </div>
          <span className="hidden lg:inline text-gray-600">|</span>
          <div className="hidden lg:flex items-center space-x-1">
            <span className="text-gray-400">RENDER:</span>
            <span className="text-emerald-400">WEBGL 2.0</span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1.5">
            <span className="text-gray-400">FPS:</span>
            <span className={`font-bold ${fps >= 55 ? 'text-emerald-400' : fps >= 30 ? 'text-amber-400' : 'text-rose-400'}`}>
              {fps.toFixed(0)}
            </span>
          </div>
          <span className="text-gray-600">|</span>
          <div className="flex items-center space-x-1 text-gray-300">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">60Hz Realtime Kinematics</span>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="bg-[#0c0e17]/85 backdrop-blur-xl border-b border-white/10 px-4 py-2.5 flex items-center justify-between">
        {/* Logo / Brand */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onSelectSubsystem('overview')}>
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/25 border border-cyan-300/40">
            <Gauge className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-widest text-white uppercase flex items-center gap-1.5">
              AERO<span className="text-cyan-400">TECH</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-500/30 font-mono">
                3D-CAD
              </span>
            </h1>
            <p className="text-[10px] text-gray-400 tracking-tight">Interactive Automotive Engineering</p>
          </div>
        </div>

        {/* Subsystem Navigation Pills */}
        <nav className="hidden xl:flex items-center space-x-1 bg-black/40 p-1 rounded-xl border border-white/5">
          {subsystems.map((sys) => {
            const isActive = currentSubsystem === sys.id;
            return (
              <button
                key={sys.id}
                onClick={() => onSelectSubsystem(sys.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 flex items-center space-x-1.5 ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500/30 to-blue-600/30 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/20'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                }`}
              >
                <span className="text-[10px] font-mono text-cyan-400/80">{sys.icon}</span>
                <span>{sys.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Action Controls & Display Toggles */}
        <div className="flex items-center space-x-2">
          {/* Aero Streamlines */}
          <button
            onClick={() => onUpdateViewerSettings({ showAeroStreamlines: !viewerSettings.showAeroStreamlines })}
            title="Toggle Aerodynamic Streamlines"
            className={`p-2 rounded-lg text-xs font-mono transition-all duration-200 flex items-center gap-1.5 border ${
              viewerSettings.showAeroStreamlines
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-sm shadow-cyan-500/30'
                : 'bg-white/5 text-gray-400 border-white/10 hover:text-white hover:bg-white/10'
            }`}
          >
            <Wind className="w-4 h-4" />
            <span className="hidden md:inline">Aero</span>
          </button>

          {/* X-Ray / Wireframe */}
          <button
            onClick={() => onUpdateViewerSettings({ xRayMode: !viewerSettings.xRayMode })}
            title="Toggle X-Ray Cutaway Mode"
            className={`p-2 rounded-lg text-xs font-mono transition-all duration-200 flex items-center gap-1.5 border ${
              viewerSettings.xRayMode
                ? 'bg-purple-500/25 text-purple-300 border-purple-500/50 shadow-sm shadow-purple-500/30'
                : 'bg-white/5 text-gray-400 border-white/10 hover:text-white hover:bg-white/10'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span className="hidden md:inline">X-Ray</span>
          </button>

          {/* Audio Engine */}
          <button
            onClick={() => onUpdateViewerSettings({ soundEnabled: !viewerSettings.soundEnabled })}
            title="Toggle Acoustic Synthesizer"
            className={`p-2 rounded-lg text-xs font-mono transition-all duration-200 flex items-center gap-1.5 border ${
              viewerSettings.soundEnabled
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm shadow-amber-500/30'
                : 'bg-white/5 text-gray-400 border-white/10 hover:text-white hover:bg-white/10'
            }`}
          >
            {viewerSettings.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden md:inline">Sound</span>
          </button>

          {/* Quick Exploded Toggle */}
          <button
            onClick={() =>
              onUpdateViewerSettings({
                explodedDistance: viewerSettings.explodedDistance > 0.1 ? 0 : 0.8
              })
            }
            title="Quick Exploded View Toggle"
            className={`p-2 rounded-lg text-xs font-mono transition-all duration-200 flex items-center gap-1.5 border ${
              viewerSettings.explodedDistance > 0.1
                ? 'bg-orange-500/20 text-orange-300 border-orange-500/50 shadow-sm shadow-orange-500/30'
                : 'bg-white/5 text-gray-400 border-white/10 hover:text-white hover:bg-white/10'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span className="hidden md:inline">Explode</span>
          </button>
        </div>
      </div>

      {/* Mobile Subsystem Scrollable Bar */}
      <div className="xl:hidden bg-[#0a0c14]/95 border-b border-white/10 px-3 py-2 flex items-center space-x-2 overflow-x-auto scrollbar-none">
        {subsystems.map((sys) => {
          const isActive = currentSubsystem === sys.id;
          return (
            <button
              key={sys.id}
              onClick={() => onSelectSubsystem(sys.id)}
              className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                isActive
                  ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-500/40'
                  : 'text-gray-400 bg-white/5 border border-white/5 hover:text-white'
              }`}
            >
              {sys.label}
            </button>
          );
        })}
      </div>
    </header>
  );
};
