import React from 'react';
import type { SubsystemType, TelemetryData } from '../../types/automotive';
import {
  Activity,
  Flame,
  Thermometer,
  Gauge,
  Compass,
  ArrowUpRight,
  Zap,
  Disc,
  Snowflake,
  BarChart3
} from 'lucide-react';

interface TelemetryHUDProps {
  currentSubsystem: SubsystemType;
  telemetry: TelemetryData;
}

export const TelemetryHUD: React.FC<TelemetryHUDProps> = ({
  currentSubsystem,
  telemetry
}) => {
  // 4-Stroke Cycle calculation from RPM
  const strokePhaseNames = ['INTAKE', 'COMPRESSION', 'POWER (EXPANSION)', 'EXHAUST'];
  const strokeIndex = Math.floor((Date.now() / (60000 / Math.max(800, telemetry.rpm))) % 4);
  const currentStroke = strokePhaseNames[strokeIndex];

  return (
    <aside className="fixed top-24 right-4 z-40 w-80 max-w-[calc(100vw-2rem)] pointer-events-auto flex flex-col space-y-3">
      {/* Primary Powertrain / Engine Telemetry Box */}
      <div className="glass-panel rounded-2xl p-4 shadow-2xl border border-white/10 hover:border-cyan-500/30 transition-all">
        <div className="flex items-center justify-between pb-2 border-b border-white/10">
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold tracking-wider text-gray-200 uppercase">
              LIVE TELEMETRY HUD
            </span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-500/30">
            ONLINE
          </span>
        </div>

        {/* Engine RPM & Speed */}
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="bg-black/40 rounded-xl p-2.5 border border-white/5">
            <div className="text-[10px] text-gray-400 font-mono flex items-center justify-between">
              <span>TACHOMETER</span>
              <span className="text-orange-400 font-bold">RPM</span>
            </div>
            <div className="text-2xl font-black font-mono tracking-tight text-white mt-0.5">
              {Math.round(telemetry.rpm)}
            </div>
            {/* RPM Progress Bar */}
            <div className="w-full bg-gray-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className={`h-full transition-all duration-75 ${
                  telemetry.rpm > 7800
                    ? 'bg-rose-500 shadow-sm shadow-rose-500'
                    : telemetry.rpm > 5500
                    ? 'bg-amber-400'
                    : 'bg-cyan-400'
                }`}
                style={{ width: `${Math.min(100, (telemetry.rpm / 9000) * 100)}%` }}
              />
            </div>
          </div>

          <div className="bg-black/40 rounded-xl p-2.5 border border-white/5">
            <div className="text-[10px] text-gray-400 font-mono flex items-center justify-between">
              <span>GROUND SPEED</span>
              <span className="text-cyan-400 font-bold">KM/H</span>
            </div>
            <div className="text-2xl font-black font-mono tracking-tight text-white mt-0.5">
              {Math.round(telemetry.speedKmh)}
            </div>
            {/* Speed Progress Bar */}
            <div className="w-full bg-gray-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-75"
                style={{ width: `${Math.min(100, (telemetry.speedKmh / 350) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Dynamic Contextual Telemetry based on Active Subsystem */}
        {currentSubsystem === 'engine' && (
          <div className="mt-3 pt-3 border-t border-white/10 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-gray-400 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-orange-400" />
                Cycle Phase:
              </span>
              <span className="font-bold text-orange-400 px-2 py-0.5 rounded bg-orange-950/60 border border-orange-500/30">
                {currentStroke}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="bg-white/5 p-2 rounded-lg">
                <span className="text-gray-400 block text-[10px]">CYLINDER PEAK P</span>
                <span className="text-gray-200 font-bold">138.4 BAR</span>
              </div>
              <div className="bg-white/5 p-2 rounded-lg">
                <span className="text-gray-400 block text-[10px]">TURBO BOOST</span>
                <span className="text-cyan-400 font-bold">{(1.2 + telemetry.throttle * 1.0).toFixed(2)} BAR</span>
              </div>
            </div>

            <div className="bg-white/5 p-2 rounded-lg text-xs font-mono flex items-center justify-between">
              <span className="text-gray-400">OIL PRESSURE / TEMP:</span>
              <span className="text-emerald-400 font-bold">5.8 BAR / 98°C</span>
            </div>
          </div>
        )}

        {currentSubsystem === 'transmission' && (
          <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-gray-400">GEAR RATIO:</span>
              <span className="font-bold text-cyan-300">
                {telemetry.gear === -1 ? '3.25 : 1 (REV)' : telemetry.gear === 0 ? '0.00 (NEUT)' : `${(3.4 - telemetry.gear * 0.45).toFixed(2)} : 1`}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-gray-400">CLUTCH DUAL ENGAGEMENT:</span>
              <span className="text-amber-400 font-bold">ODD: 98% | EVEN: 02%</span>
            </div>
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-gray-400">SHIFT TIME:</span>
              <span className="text-emerald-400 font-bold">28 ms (DCT Hydraulic)</span>
            </div>
          </div>
        )}

        {currentSubsystem === 'suspension' && (
          <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-gray-400">DEFLECTION TRAVEL:</span>
              <span className="text-cyan-400 font-bold">{telemetry.suspensionTravelMm.toFixed(1)} mm</span>
            </div>
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-gray-400">DAMPER MAGNERIDE:</span>
              <span className="text-purple-400 font-bold">2,400 N/m/s (Adaptive)</span>
            </div>
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-gray-400">DYNAMIC CAMBER:</span>
              <span className="text-emerald-400 font-bold">-2.15° Cornering</span>
            </div>
          </div>
        )}

        {currentSubsystem === 'brakes' && (
          <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-gray-400 flex items-center gap-1">
                <Thermometer className="w-3.5 h-3.5 text-rose-400" />
                ROTOR SURFACE TEMP:
              </span>
              <span className={`font-bold ${telemetry.brakeTempC > 500 ? 'text-rose-400 animate-pulse' : 'text-amber-400'}`}>
                {Math.round(telemetry.brakeTempC)} °C
              </span>
            </div>
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-gray-400">HYDRAULIC CLAMP:</span>
              <span className="text-rose-400 font-bold">{Math.round(telemetry.brakePressurePsi)} PSI</span>
            </div>
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-gray-400">100-0 KM/H STOPPING:</span>
              <span className="text-emerald-400 font-bold">29.4 METERS</span>
            </div>
          </div>
        )}

        {currentSubsystem === 'hvac' && (
          <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-gray-400 flex items-center gap-1">
                <Snowflake className="w-3.5 h-3.5 text-cyan-400" />
                CABIN TARGET / AMBIENT:
              </span>
              <span className="text-cyan-300 font-bold">{telemetry.cabinTempC.toFixed(1)}°C / 32.0°C</span>
            </div>
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-gray-400">HIGH-SIDE CONDENSER:</span>
              <span className="text-rose-400 font-bold">{Math.round(telemetry.hvacHighSidePsi)} PSI (Hot Gas)</span>
            </div>
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-gray-400">LOW-SIDE EVAPORATOR:</span>
              <span className="text-cyan-400 font-bold">{Math.round(telemetry.hvacLowSidePsi)} PSI (Mist)</span>
            </div>
          </div>
        )}
      </div>

      {/* Mini Quick Status / G-Force meter */}
      <div className="glass-panel rounded-xl p-3 text-xs font-mono border border-white/10 flex items-center justify-between text-gray-400">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 rounded-full border border-cyan-500/40 flex items-center justify-center text-[10px] text-cyan-300">
            G
          </div>
          <span>LAT: +0.42g | LONG: +0.65g</span>
        </div>
        <span className="text-emerald-400 font-bold">TRACTION 100%</span>
      </div>
    </aside>
  );
};
