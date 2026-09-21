import React, { useEffect, useRef } from 'react';
import type { SubsystemType } from '../../types/automotive';
import {
  ChevronDown,
  Layers,
  Flame,
  Cog,
  Activity,
  Disc,
  Snowflake,
  Sliders
} from 'lucide-react';

interface ScrollStorySectionsProps {
  currentSubsystem: SubsystemType;
  onSubsystemChange: (system: SubsystemType) => void;
  onScrollProgress: (progress: number) => void;
}

interface SectionItem {
  id: SubsystemType;
  number: string;
  title: string;
  subtitle: string;
  description: string;
  highlights: string[];
  icon: React.ReactNode;
}

const ScrollStorySectionsComponent: React.FC<ScrollStorySectionsProps> = ({
  currentSubsystem,
  onSubsystemChange,
  onScrollProgress,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const sections: SectionItem[] = [
    {
      id: 'overview',
      number: '01',
      title: 'AERODYNAMIC MONOCOQUE',
      subtitle: 'Carbon Composite Ground-Effect Architecture',
      description:
        'Sculpted for laminar airflow and negative aerodynamic lift. Integrated venturi channels accelerate air beneath the flat floor pan, generating massive high-speed downforce without excessive drag penalty.',
      highlights: [
        'Pre-preg carbon fiber sandwich construction with 48,500 Nm/deg stiffness',
        'Active DRS rear wing with hydraulic pitch adjustment for airbrake deceleration',
        'Frontal NACA ducts channeling cooling airflow into oil coolers and brake ducts'
      ],
      icon: <Layers className="w-5 h-5 text-cyan-400" />
    },
    {
      id: 'chassis',
      number: '02',
      title: 'KINEMATIC SEPARATION',
      subtitle: 'Exploded Component Architecture & Packaging',
      description:
        'Scroll to separate the vehicle assembly along its primary mechanical axes. Witness how powertrain, chassis spaceframe, suspension corners, and cooling loops integrate into a single sub-millimeter package.',
      highlights: [
        'Body panels lift vertically along Y-axis to reveal structural packaging',
        'Front cooling pack and rear transaxle slide along longitudinal axis',
        'Four suspension corners articulate outwards to display double-wishbone geometry'
      ],
      icon: <Layers className="w-5 h-5 text-purple-400" />
    },
    {
      id: 'engine',
      number: '03',
      title: 'POWERPLANT: 4-STROKE CYCLE',
      subtitle: 'Twin-Turbocharged 120° V6 Combustion Chamber',
      description:
        'Observe the Otto combustion cycle in continuous motion. Precision forged pistons reciprocate through Intake, Compression, Power, and Exhaust strokes as spark plugs ignite and dual overhead camshafts pulse sodium-filled valves.',
      highlights: [
        'Trigonometric slider-crank kinematics driving balanced crankshaft counterweights',
        'Timed spark ignition flashes right at Top Dead Center (TDC) of compression stroke',
        'Hot exhaust runners glowing at 900°C under full boost throttle load'
      ],
      icon: <Flame className="w-5 h-5 text-orange-400" />
    },
    {
      id: 'transmission',
      number: '04',
      title: '7-SPEED DUAL-CLUTCH (DCT)',
      subtitle: 'Seamless Pre-Selected Transaxle & Differential',
      description:
        'Continuous torque delivery with sub-30ms gear changes. Twin oil-cooled concentric clutch packs alternate between odd and even gear clusters, driving differential bevel gears out to rear drive half-shafts.',
      highlights: [
        'Interlocking helical gear meshes with accurate mathematical gear ratios',
        'Torque energy pulse visualization flowing from input shaft through active gear',
        'Integrated limited-slip differential distributing torque under hard acceleration'
      ],
      icon: <Cog className="w-5 h-5 text-blue-400" />
    },
    {
      id: 'suspension',
      number: '05',
      title: 'ADAPTIVE COILOVER SUSPENSION',
      subtitle: 'Double Wishbone Kinematics & Magnetorheological Damper',
      description:
        'Engineered to preserve the tire contact patch throughout dynamic roll, squat, and dive. Watch the progressive coil spring compress and decompress in real-time as simulated road bumps oscillate through the lower A-arm.',
      highlights: [
        'Unequal length upper and lower control wishbones optimizing dynamic camber',
        'Helical steel spring physically deforming with telescoping hydraulic damper rod',
        'Adjustable road surface bump frequency simulator testing high-speed damping'
      ],
      icon: <Activity className="w-5 h-5 text-emerald-400" />
    },
    {
      id: 'brakes',
      number: '06',
      title: '410mm CARBON-CERAMIC BRAKES',
      subtitle: '6-Piston Monobloc Calipers & Thermal Dissipation',
      description:
        'Converts kinetic momentum into thermal energy. Press the brake control to watch 6 opposing hydraulic caliper pistons clamp high-friction pads against the ventilated rotor, causing thermal radiation to glow cherry red.',
      highlights: [
        'Curved internal cooling vanes sucking air radially outward via centrifugal force',
        'Cross-drilled rotor holes venting hot gasses from friction boundary layer',
        'Dynamic thermal shader modeling blackbody incandescence up to 850°C'
      ],
      icon: <Disc className="w-5 h-5 text-rose-400" />
    },
    {
      id: 'hvac',
      number: '07',
      title: 'THERMODYNAMIC HVAC LOOP',
      subtitle: '4-Phase Vapor Compression Refrigeration Cycle',
      description:
        'Follow pressurized refrigerant particles circulating through the closed thermodynamic loop: compressor compression, condenser heat rejection, expansion valve flash-gas expansion, and evaporator cabin cooling.',
      highlights: [
        'Red particles: High-pressure superheated gas leaving compressor at 240 PSI',
        'Orange/Yellow particles: High-pressure subcooled liquid leaving condenser',
        'Cyan/Blue particles: Cold low-pressure vapor boiling inside evaporator to cool cabin'
      ],
      icon: <Snowflake className="w-5 h-5 text-cyan-400" />
    },
    {
      id: 'sandbox',
      number: '08',
      title: 'ENGINEERING DIAGNOSTIC LAB',
      subtitle: 'Interactive Free Sandbox & Stress Diagnostics',
      description:
        'Take full command of the vehicle. Free orbit camera around any angle, test throttle rev limits up to 9,000 RPM, shift through all 7 gears, slam the carbon brakes, and customize separation distances.',
      highlights: [
        'Full 360° 3D OrbitControls freedom with pan, zoom, and perspective presets',
        'Live Web Audio engine sound synthesizer reacting to throttle, revs, and gear ratio',
        'Customizable X-Ray cutaway, wireframe CAD inspection, and wind tunnel streamlines'
      ],
      icon: <Sliders className="w-5 h-5 text-amber-400" />
    }
  ];

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollY = window.scrollY;
          const docHeight = document.documentElement.scrollHeight - window.innerHeight;
          const progress = Math.max(0, Math.min(1, scrollY / (docHeight || 1)));
          onScrollProgress(progress);

          // Section detection based on scroll position
          const sectionElements = sections.map((s) => document.getElementById(`section-${s.id}`));
          let activeSys: SubsystemType = 'overview';

          sectionElements.forEach((el, idx) => {
            if (el) {
              const rect = el.getBoundingClientRect();
              if (rect.top <= window.innerHeight * 0.5 && rect.bottom >= window.innerHeight * 0.2) {
                activeSys = sections[idx].id;
              }
            }
          });

          if (activeSys !== currentSubsystem) {
            onSubsystemChange(activeSys);
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [currentSubsystem, onSubsystemChange, onScrollProgress]);

  return (
    <div ref={containerRef} className="relative z-10 pointer-events-none">
      {sections.map((sec, idx) => (
        <section
          key={sec.id}
          id={`section-${sec.id}`}
          className="min-h-screen flex items-center px-6 md:px-16 lg:px-24 py-20 pointer-events-none"
        >
          <div className="w-full max-w-xl pointer-events-auto">
            <div className="glass-panel p-6 sm:p-8 rounded-3xl shadow-2xl border border-white/10 hover:border-cyan-500/40 transition-all duration-300">
              {/* Header Badge */}
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
                  {sec.icon}
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-cyan-400 font-black text-sm px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/30">
                    STAGE {sec.number}
                  </span>
                  <span className="text-gray-400 font-mono text-xs uppercase tracking-wider">
                    {sec.subtitle}
                  </span>
                </div>
              </div>

              {/* Title */}
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase mb-3">
                {sec.title}
              </h2>

              {/* Description */}
              <p className="text-gray-300 text-sm leading-relaxed mb-5">
                {sec.description}
              </p>

              {/* Highlights List */}
              <div className="space-y-2.5 pt-4 border-t border-white/10">
                {sec.highlights.map((item, hIdx) => (
                  <div key={hIdx} className="flex items-start space-x-2.5 text-xs text-gray-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 flex-shrink-0" />
                    <span className="leading-snug">{item}</span>
                  </div>
                ))}
              </div>

              {/* Scroll prompt for section 1 */}
              {idx === 0 && (
                <div className="mt-6 pt-4 border-t border-white/10 flex items-center space-x-2 text-cyan-400 text-xs font-mono animate-bounce">
                  <ChevronDown className="w-4 h-4" />
                  <span>SCROLL DOWN TO INITIATE EXPLODED VIEW & EXPLORE MECHANICS</span>
                </div>
              )}
            </div>
          </div>
        </section>
      ))}
    </div>
  );
};

export const ScrollStorySections = React.memo(ScrollStorySectionsComponent);
