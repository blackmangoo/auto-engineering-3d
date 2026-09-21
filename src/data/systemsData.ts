import type { SystemInfo, SubsystemType } from '../types/automotive';

export const SYSTEMS_DATA: Record<SubsystemType, SystemInfo> = {
  overview: {
    id: 'overview',
    title: 'Aerodynamic Monocoque & Vehicle Architecture',
    category: 'Vehicle Dynamics & Packaging',
    tagline: 'Carbon-fiber monocoque with active downforce aerodynamics and integrated hybrid architecture',
    description:
      'Modern high-performance automotive engineering unites lightweight composites, aerodynamic ground effect tunnels, and optimized mass distribution into a cohesive structural chassis designed for extreme torsional rigidity and occupant safety.',
    principles: [
      'Torsional Rigidity: Carbon fiber composite tub provides >45,000 Nm/deg stiffness',
      'Ground Effect Venturi: Underbody tunnels generate low pressure without induced drag penalty',
      'Low Polar Moment of Inertia: Mid-mounted powertrain yields rapid yaw transient response',
      'Integrated Thermal Flow: High-temperature radiators fed by frontal laminar NACA ducts'
    ],
    keyComponents: [
      { name: 'Carbon Fiber Tub', desc: 'Pre-preg carbon sandwich core monocoque chassis', spec: '48,000 Nm/deg' },
      { name: 'Active Aero Wing', desc: 'Hydraulically actuated DRS rear wing with airbrake pitch', spec: '650 kg @ 250 km/h' },
      { name: 'Front Splitter & Canards', desc: 'Channel high-velocity airflow into front brake & oil coolers', spec: 'Carbon Composite' },
      { name: 'Rear Venturi Diffuser', desc: 'Expands underbody airflow to create negative lift suction', spec: '12° Expansion Angle' }
    ],
    engineeringTradeoffs: [
      { title: 'Carbon Tub vs Aluminum Spaceframe', pro: 'Ultra-high stiffness-to-weight ratio', con: 'Complex repairability and high manufacturing tooling costs' },
      { title: 'Active Aero vs Fixed High-Downforce Wing', pro: 'Low straight-line drag with high cornering grip', con: 'Actuator weight, hydraulic failure modes, and calibration complexity' }
    ],
    metrics: [
      { label: 'Curb Weight', value: '1,380', unit: 'kg' },
      { label: 'Drag Coefficient', value: '0.31', unit: 'Cd' },
      { label: 'Weight Distribution', value: '42 / 58', unit: 'F/R %' },
      { label: 'Torsional Rigidity', value: '48,500', unit: 'Nm/deg' }
    ]
  },
  chassis: {
    id: 'chassis',
    title: 'Exploded Component Architecture',
    category: 'Kinematics & Modular Separation',
    tagline: 'Dynamic isolation of chassis, drivetrain, suspension geometry, and thermal circuits',
    description:
      'Automotive packaging requires sub-millimeter clearances between high-vibration rotating machinery, pressurized fluid conduits, high-voltage battery harnesses, and structural suspension pickup points.',
    principles: [
      'Modular Subframe Mounts: Isolate powertrain secondary harmonics from passenger cell',
      'Center of Mass Optimization: Wet-sump dry conversion lowers crankshaft centerline by 65mm',
      'Crash Energy Dissipation: Honeycomb crumple elements absorb deceleration impact energy',
      'Serviceability & Maintenance: Modular sub-assemblies allow rapid component replacement'
    ],
    keyComponents: [
      { name: 'Aluminum Front Subframe', desc: 'Extruded alloy structure housing steering rack and upper wishbones', spec: '6061-T6 Aluminum' },
      { name: 'Rear Powertrain Cradle', desc: 'Tubular chrome-moly spaceframe cradling V6 engine & transaxle', spec: '4130 Chromoly Steel' },
      { name: 'Torsional Bulkhead', desc: 'Structural firewall separating cockpit from engine thermal envelope', spec: 'Al-Li Alloy' },
      { name: 'Impact Attenuator', desc: 'Progressive crush carbon cone absorbing frontal collision force', spec: 'FIA Spec 45g rated' }
    ],
    engineeringTradeoffs: [
      { title: 'Rigid Subframe Mounts vs Bushing Isolators', pro: 'Zero compliance steering precision', con: 'Direct transmission of NVH (Noise, Vibration, Harshness)' },
      { title: 'Structural Engine Block vs Cradle Mount', pro: 'Weight reduction by using block as stressed member', con: 'Engine vibrations directly enter monocoque' }
    ],
    metrics: [
      { label: 'Chassis Mass', value: '112', unit: 'kg' },
      { label: 'Component Separation', value: 'Dynamic', unit: 'Axes' },
      { label: 'Safety Factor', value: '2.4', unit: 'FS' },
      { label: 'NVH Attenuation', value: '-38', unit: 'dB' }
    ]
  },
  engine: {
    id: 'engine',
    title: '3.0L Twin-Turbo 120° V6 Internal Combustion Powerplant',
    category: 'Thermodynamics & Combustion Cycle',
    tagline: 'High-revving 4-stroke Otto cycle engine with direct injection, sodium-filled valves, and hot-inside-V turbochargers',
    description:
      'The heart of mechanical propulsion. Fuel-air mixture is drawn in during the Intake stroke, compressed under high pressure, ignited near Top Dead Center (TDC) to drive the piston down during Power stroke, and expelled during Exhaust stroke.',
    principles: [
      'Intake Stroke (0°-180° CA): Piston descends from TDC to BDC, intake valve opens, drawing fresh air/fuel charge',
      'Compression Stroke (180°-360° CA): Valves close, piston ascends, compressing mixture (10.5:1 ratio) to ~45 bar',
      'Combustion & Power Stroke (360°-540° CA): Spark ignites mixture, peak pressure hits ~140 bar, driving crankshaft',
      'Exhaust Stroke (540°-720° CA): Exhaust valve opens, scavenged burned gas leaves at 900°C into turbo manifold'
    ],
    keyComponents: [
      { name: 'Forged Crankshaft', desc: 'Nitrocarburized alloy steel with balanced counterweights', spec: 'Cross-plane 120° V' },
      { name: 'Reciprocating Pistons', desc: 'Forged aluminum with graphite skirts and moly piston rings', spec: '88.0mm Bore / 82.0mm Stroke' },
      { name: 'Titanium Valves', desc: 'Sodium-filled exhaust valves for thermal conduction at high revs', spec: 'DOHC 4-Valves/Cylinder' },
      { name: 'Variable Twin Turbochargers', desc: 'Hot-V geometry with electronic wastegates boosting 2.2 bar', spec: '145,000 RPM Max' }
    ],
    engineeringTradeoffs: [
      { title: 'Short Stroke vs Long Stroke', pro: 'Allows ultra-high engine speeds up to 9,000 RPM', con: 'Reduced low-end torque compared to undersquare designs' },
      { title: 'Hot-V Turbo Layout vs External Turbos', pro: 'Ultra-short exhaust runners reduce turbo lag drastically', con: 'High thermal concentration requiring aggressive heat shielding' }
    ],
    metrics: [
      { label: 'Max Power', value: '680', unit: 'HP @ 8,200 RPM' },
      { label: 'Peak Torque', value: '730', unit: 'Nm @ 3,500-6,000 RPM' },
      { label: 'Specific Output', value: '226', unit: 'HP / Liter' },
      { label: 'Compression Ratio', value: '10.5 : 1', unit: 'CR' }
    ]
  },
  transmission: {
    id: 'transmission',
    title: '7-Speed Dual-Clutch Seamless Transaxle (DCT)',
    category: 'Powertrain & Torque Multiplication',
    tagline: 'Pre-selected odd and even gear clusters enabling sub-30ms seamless shifts under continuous torque delivery',
    description:
      'Transfers rotating kinetic energy from the engine crankshaft to the drive wheels while optimizing engine RPM via stepped gear ratios. Two independent wet clutch packs manage odd (1, 3, 5, 7) and even (2, 4, 6, R) gearsets.',
    principles: [
      'Pre-Selection Mechanism: Next gear is synchronized and engaged before previous clutch disengages',
      'Torque Interruption Elimination: Overlapping clutch engagement maintains continuous acceleration',
      'Gear Multiplication: 1st gear multiplies engine torque by 3.4:1 for rapid static breakaway',
      'Limited Slip Differential (e-LSD): Electronically vector torque between left and right drive wheels'
    ],
    keyComponents: [
      { name: 'Dual Concentric Clutches', desc: 'Twin oil-cooled multi-plate wet clutch assemblies', spec: '850 Nm Capacity' },
      { name: 'Helical Gear Shafts', desc: 'Precision ground helical gear meshes reducing transmission whine', spec: 'Shot-peened Steel' },
      { name: 'Electro-Hydraulic Mechatronics', desc: 'Fast proportional solenoid valves actuating shift forks', spec: '60 Bar Hydraulic Rail' },
      { name: 'Electronic LSD', desc: 'Computer-controlled hydraulic clutch lock between rear half-shafts', spec: '0-100% Lockup in 50ms' }
    ],
    engineeringTradeoffs: [
      { title: 'Dual-Clutch vs Manual Transmission', pro: 'Lightning-fast automated shifts without torque drop', con: 'Increased weight (+35 kg) and fluid hydraulic complexity' },
      { title: 'Helical Gears vs Straight-Cut Spur Gears', pro: 'Smooth, whisper-quiet operation and continuous tooth contact', con: 'Creates axial thrust loads requiring heavy-duty tapered bearings' }
    ],
    metrics: [
      { label: 'Shift Time', value: '28', unit: 'milliseconds' },
      { label: 'Gear Ratios', value: '3.40 to 0.72', unit: 'Ratio Spread' },
      { label: 'Final Drive', value: '3.91 : 1', unit: 'Hypoid Bevel' },
      { label: 'Mechanical Efficiency', value: '96.8', unit: '%' }
    ]
  },
  suspension: {
    id: 'suspension',
    title: 'Adaptive Double-Wishbone & Magnetorheological Coilover System',
    category: 'Kinematics & Contact Patch Optimization',
    tagline: 'Independent unequal-length A-arms with continuously variable magnetic fluid dampers and pushrod actuation',
    description:
      'Maintains the tire contact patch perpendicular to the road surface under aggressive cornering roll, squat, and dive. Controls unsprung mass oscillations and absorbs road surface irregularities.',
    principles: [
      'Camber Recovery: Unequal length wishbones induce negative camber as suspension compresses in roll',
      'Magnetorheological Damping: Electromagnetic coils alter fluid viscosity in 1 millisecond',
      'Roll Center Control: Geometry keeps instant roll center close to center of gravity, minimizing body roll',
      'Anti-Dive & Anti-Squat: Angled control arm pivot axes counteract longitudinal braking and acceleration pitch'
    ],
    keyComponents: [
      { name: 'Forged Aluminum A-Arms', desc: 'Upper and lower wishbones optimized via finite element analysis', spec: 'Al-Zn-Mg-Cu Alloy' },
      { name: 'Progressive Helical Spring', desc: 'Silicon-chrome steel spring with non-linear rate progression', spec: '75 - 120 N/mm' },
      { name: 'MagneRide Damper', desc: 'Piston contains micron-sized iron particles suspended in synthetic hydrocarbon', spec: '1,000 adjustments/sec' },
      { name: 'Pushrod & Bellcrank', desc: 'Inboard mounted dampers reduce unsprung mass at the wheel', spec: 'Needle-bearing pivot' }
    ],
    engineeringTradeoffs: [
      { title: 'Double Wishbone vs MacPherson Strut', pro: 'Superior camber control throughout wheel travel curve', con: 'Requires wider packaging envelope and multiple ball-joint linkages' },
      { title: 'Inboard Pushrod vs Direct Coilover', pro: 'Lower unsprung mass and aerodynamic packaging advantages', con: 'Higher lever-arm loads on bellcrank pivots and subframe nodes' }
    ],
    metrics: [
      { label: 'Wheel Travel', value: '115', unit: 'mm (+65 / -50)' },
      { label: 'Static Camber', value: '-1.8', unit: 'degrees' },
      { label: 'Unsprung Mass / Corner', value: '24.5', unit: 'kg' },
      { label: 'Damper Response Time', value: '1.2', unit: 'ms' }
    ]
  },
  brakes: {
    id: 'brakes',
    title: '410mm Carbon-Silicon Carbide (C/SiC) 6-Piston Braking System',
    category: 'Thermodynamic Energy Conversion',
    tagline: 'Ventilated ceramic composite rotors with differential-bore monobloc calipers converting kinetic energy to heat',
    description:
      'Translates high hydraulic line pressure into friction clamping force against rotating brake discs. Carbon-ceramic matrix resists brake fade up to 1,000°C while reducing rotational unsprung inertia by 50% compared to cast iron.',
    principles: [
      'Kinetic Energy Dissipation: Kinetic energy (1/2 m v²) is entirely converted into thermodynamic heat',
      'Differential Piston Bores: Caliper piston diameters step up (28mm -> 32mm -> 36mm) to prevent pad taper wear',
      'Internal Vane Ventilation: Curved internal cooling channels pump air radially outwards via centrifugal suction',
      'Anti-Lock Braking (ABS): High-speed solenoid modulation prevents tire slip ratio exceeding optimal 15-20%'
    ],
    keyComponents: [
      { name: 'Carbon-Silicon Carbide Rotor', desc: 'Carbon fiber matrix impregnated with molten silicon at 1700°C', spec: '410mm x 38mm Ventilated' },
      { name: '6-Piston Monobloc Caliper', desc: 'Machined from single billet aerospace aluminum for zero bridge flex', spec: 'Radial Mount' },
      { name: 'Sintered Ceramic Brake Pads', desc: 'High-coefficient copper-free friction compound', spec: 'μ = 0.52 @ 600°C' },
      { name: 'Titanium Thermal Piston Caps', desc: 'Insulates brake fluid from extreme heat conduction', spec: 'Grade 5 Ti-6Al-4V' }
    ],
    engineeringTradeoffs: [
      { title: 'Carbon Ceramic vs Cast Iron Rotors', pro: 'Zero fade at 800°C and 50% lighter rotational unsprung weight', con: 'High manufacturing cost and requires warm-up for maximum initial bite' },
      { title: 'Cross-Drilled vs Slotted Rotors', pro: 'Weight reduction and degassing of hot friction boundary layer', con: 'Holes act as stress risers under extreme thermal cycling' }
    ],
    metrics: [
      { label: 'Max Rotor Temp', value: '1,050', unit: '°C' },
      { label: '100-0 km/h Distance', value: '29.2', unit: 'meters' },
      { label: 'Max Clamping Force', value: '28.5', unit: 'kN' },
      { label: 'Weight Saving vs Iron', value: '-22.4', unit: 'kg total' }
    ]
  },
  hvac: {
    id: 'hvac',
    title: 'Automotive Thermal Management & Vapor-Compression HVAC',
    category: 'Applied Thermodynamics & Refrigeration',
    tagline: 'Closed-loop 4-phase thermodynamic refrigeration cycle utilizing R-1234yf refrigerant and cabin heat pumps',
    description:
      'A continuous cycle of compression, condensation, expansion, and evaporation that extracts heat energy from the passenger cabin and high-voltage battery systems and rejects it to the ambient atmosphere.',
    principles: [
      'Compression (1 -> 2): Low-pressure vapor refrigerant is compressed to high-pressure, superheated vapor',
      'Condensation (2 -> 3): Hot gas flows through frontal condenser; ambient air cools it into high-pressure subcooled liquid',
      'Expansion (3 -> 4): Fluid passes through Thermal Expansion Valve (TXV), dropping pressure & temp to -5°C mist',
      'Evaporation (4 -> 1): Cold refrigerant absorbs heat from cabin air blown across evaporator fins, boiling back to gas'
    ],
    keyComponents: [
      { name: 'Variable Displacement Compressor', desc: 'Swash-plate axial piston pump modulating displacement 5-100%', spec: '180cc Displacement' },
      { name: 'Microchannel Condenser', desc: 'High-surface-area aluminum radiator with dual brushless fans', spec: '12 kW Heat Rejection' },
      { name: 'Thermal Expansion Valve (TXV)', desc: 'Precision orifice metering refrigerant flow based on evaporator superheat', spec: 'Electronic Stepper' },
      { name: 'Evaporator Core & Blower', desc: 'Ultra-thin louvered aluminum fins with antimicrobial coating', spec: '450 m³/h Airflow' }
    ],
    engineeringTradeoffs: [
      { title: 'R-1234yf vs R-134a Refrigerant', pro: 'Global Warming Potential (GWP) of < 1 compared to 1,430 for R-134a', con: 'Higher chemical cost and mild flammability classification (A2L)' },
      { title: 'Heat Pump vs PTC Electric Resistance Heater', pro: 'Up to 3x higher coefficient of performance (COP) conserving battery range', con: 'Complex 4-way reversing valves and reduced efficiency below -10°C' }
    ],
    metrics: [
      { label: 'High-Side Pressure', value: '16.5', unit: 'Bar (240 PSI)' },
      { label: 'Low-Side Pressure', value: '2.1', unit: 'Bar (30.5 PSI)' },
      { label: 'Cooling Capacity', value: '8.4', unit: 'kW' },
      { label: 'COP Efficiency', value: '3.2', unit: 'Ratio' }
    ]
  },
  sandbox: {
    id: 'sandbox',
    title: 'Interactive Engineering Sandbox & Diagnostic Lab',
    category: 'Free 3D Exploration & Real-Time Stress Diagnostics',
    tagline: 'Full freedom 360° inspection, dynamic X-ray mode, exploded view separation, and simulated powertrain loads',
    description:
      'Experiment with real-time powertrain parameters. Adjust throttle to rev the V6 engine to 9,000 RPM, shift through the 7-speed dual-clutch transmission, slam the carbon-ceramic brakes to witness rotor heat dissipation, and dial in road bump frequency.',
    principles: [
      'Multi-Body Kinematic Coupling: Interactive controls trigger interconnected physical motions',
      'Thermal Inertia Simulation: Dynamic mathematical cooling curves govern brake and engine temperatures',
      'Spectral Acoustics: Web Audio API oscillators synthesize engine harmonic frequencies in real time',
      'Spatial Decoupling: Smooth vector interpolation separates components along their mechanical explosion vectors'
    ],
    keyComponents: [
      { name: 'Interactive Throttle', desc: 'Drives engine RPM, intake airflow velocity, and fuel injection rate', spec: '0 - 100%' },
      { name: 'DCT Shift Selector', desc: 'Cycles through gear ratios, recalculating wheel torque output', spec: '1-7, N, R' },
      { name: 'Hydraulic Brake Pedal', desc: 'Actuates caliper clamping force and generates rotor friction heat', spec: '0 - 80 Bar' },
      { name: 'Suspension Dynamic Exciter', desc: 'Simulates rumble strip and road undulation oscillation', spec: '0.5 - 15.0 Hz' }
    ],
    engineeringTradeoffs: [
      { title: 'Full Assembly vs Isolated System View', pro: 'Holistic understanding of automotive packaging & spatial layout', con: 'Internal components can be occluded without X-ray or exploded view' },
      { title: 'Performance vs High Polygon Density', pro: 'Fluid 60 FPS responsiveness across mobile and desktop devices', con: 'Requires procedural optimization rather than multi-gigabyte CAD files' }
    ],
    metrics: [
      { label: 'Interactive Nodes', value: '142', unit: 'Meshes' },
      { label: 'Physics Frame Rate', value: '60.0', unit: 'FPS' },
      { label: 'Acoustic Synthesizer', value: 'Active', unit: 'Web Audio' },
      { label: 'Explosion Range', value: '0 - 3.5', unit: 'Meters' }
    ]
  }
};
