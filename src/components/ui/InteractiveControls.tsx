import React from 'react';
import type {
  SubsystemType,
  TelemetryData,
  ViewerSettings,
  CameraPreset
} from '../../types/automotive';
import { soundEngine } from '../../utils/soundEngine';
import {
  Flame,
  Layers,
  Disc
} from 'lucide-react';

interface InteractiveControlsProps {
  currentSubsystem: SubsystemType;
  telemetry: TelemetryData;
  onUpdateTelemetry: (data: Partial<TelemetryData>) => void;
  viewerSettings: ViewerSettings;
  onUpdateViewerSettings: (settings: Partial<ViewerSettings>) => void;
  onSelectCameraPreset: (preset: CameraPreset) => void;
}

export const InteractiveControls: React.FC<InteractiveControlsProps> = ({
  currentSubsystem,
  telemetry,
  onUpdateTelemetry,
  viewerSettings,
  onUpdateViewerSettings,
  onSelectCameraPreset
}) => {
  const gears = [-1, 0, 1, 2, 3, 4, 5, 6, 7];

  const handleGearShift = (newGear: number) => {
    soundEngine.playShiftClick();
    onUpdateTelemetry({
      gear: newGear,
      speedKmh: newGear > 0 ? newGear * 42 : newGear === -1 ? 25 : 0
    });
  };

  const handleBrakeDown = () => {
    onUpdateTelemetry({
      brakePedal: 1,
      brakePressurePsi: 750,
      brakeTempC: Math.min(850, telemetry.brakeTempC + 120),
      speedKmh: Math.max(0, telemetry.speedKmh - 35)
    });
  };

  const handleBrakeUp = () => {
    onUpdateTelemetry({
      brakePedal: 0,
      brakePressurePsi: 0
    });
  };

  return (
    <footer className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[95%] max-w-4xl pointer-events-auto">
      <div className="glass-panel-accent rounded-2xl p-3 shadow-2xl border border-cyan-500/30 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Left Section: Throttle & RPM Rev control */}
        <div className="flex items-center space-x-3 bg-black/40 px-3 py-2 rounded-xl border border-white/5">
          <Flame className="w-4 h-4 text-orange-400 flex-shrink-0" />
          <div className="flex flex-col">
            <div className="flex items-center justify-between text-[10px] font-mono text-gray-400">
              <span>THROTTLE</span>
              <span className="text-orange-400 font-bold">{Math.round(telemetry.throttle * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={telemetry.throttle}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                const targetRpm = 900 + val * 7800;
                onUpdateTelemetry({
                  throttle: val,
                  rpm: targetRpm,
                  speedKmh: telemetry.gear > 0 ? (targetRpm / 9000) * (telemetry.gear * 45) : telemetry.speedKmh
                });
              }}
              className="w-28 sm:w-36 accent-orange-500 cursor-pointer"
            />
          </div>
        </div>

        {/* Transmission Gear Shifter Selector */}
        <div className="flex items-center space-x-1 bg-black/40 px-2.5 py-1.5 rounded-xl border border-white/5">
          <span className="text-[10px] font-mono text-gray-400 mr-1.5">GEAR:</span>
          {gears.map((g) => {
            const isSelected = telemetry.gear === g;
            const label = g === -1 ? 'R' : g === 0 ? 'N' : `${g}`;
            return (
              <button
                key={g}
                onClick={() => handleGearShift(g)}
                className={`w-6 h-7 rounded-md font-mono text-xs font-bold transition-all ${
                  isSelected
                    ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/40'
                    : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Brake Clamp Button */}
        <button
          onMouseDown={handleBrakeDown}
          onMouseUp={handleBrakeUp}
          onTouchStart={handleBrakeDown}
          onTouchEnd={handleBrakeUp}
          className={`px-3.5 py-2 rounded-xl font-mono text-xs font-bold transition-all flex items-center space-x-1.5 border select-none ${
            telemetry.brakePedal > 0
              ? 'bg-rose-600 text-white border-rose-400 shadow-lg shadow-rose-600/50 scale-95'
              : 'bg-rose-950/40 text-rose-300 border-rose-500/30 hover:bg-rose-900/60'
          }`}
        >
          <Disc className="w-3.5 h-3.5" />
          <span>BRAKE (HOLD)</span>
        </button>

        {/* Exploded Distance Separation Slider */}
        <div className="flex items-center space-x-2 bg-black/40 px-3 py-2 rounded-xl border border-white/5">
          <Layers className="w-4 h-4 text-cyan-400 flex-shrink-0" />
          <div className="flex flex-col">
            <div className="flex items-center justify-between text-[10px] font-mono text-gray-400">
              <span>EXPLODE SEPARATION</span>
              <span className="text-cyan-400 font-bold">{Math.round(viewerSettings.explodedDistance * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={viewerSettings.explodedDistance}
              onChange={(e) =>
                onUpdateViewerSettings({
                  explodedDistance: parseFloat(e.target.value)
                })
              }
              className="w-24 sm:w-32 accent-cyan-400 cursor-pointer"
            />
          </div>
        </div>

        {/* Camera Views Selector */}
        <div className="flex items-center space-x-1 bg-black/40 p-1 rounded-xl border border-white/5">
          {(['default', 'side', 'front', 'top', 'isometric'] as CameraPreset[]).map((preset) => {
            const isCurrent = viewerSettings.activeCameraPreset === preset;
            return (
              <button
                key={preset}
                onClick={() => onSelectCameraPreset(preset)}
                className={`px-2 py-1 rounded-lg text-[10px] font-mono capitalize transition-all ${
                  isCurrent
                    ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-500/40'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {preset}
              </button>
            );
          })}
        </div>
      </div>
    </footer>
  );
};
