# AEROTECH 3D — Interactive Automotive Engineering & Kinematics

A high-performance 3D interactive web application exploring the mechanical engineering and thermodynamics of modern automotive powertrains, aerodynamics, and chassis dynamics.

![AEROTECH 3D Banner](https://img.shields.io/badge/Three.js-WebGL2.0-00e5ff?style=for-the-badge&logo=three.js)
![React 19](https://img.shields.io/badge/React-19.0-61dafb?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?style=for-the-badge&logo=typescript)
![TailwindCSS](https://img.shields.io/badge/Tailwind-CSS-38bdf8?style=for-the-badge&logo=tailwindcss)
![Web Audio](https://img.shields.io/badge/Web_Audio-Synthesizer-f59e0b?style=for-the-badge)

---

## 🌟 Features & Major Subsystems

### 1. 🏎️ Aerodynamic Monocoque & Vehicle Architecture
- Sculpted aerodynamic carbon composite body with active DRS rear wing and venturi ground-effect underbody tunnels.
- Dynamic wind tunnel particle streamlines demonstrating laminar flow, boundary layer deflection, and wake turbulence.

### 2. 💥 Real-Time Exploded View & Kinematic Separation
- Scroll-driven component separation along mechanical axes:
  - Carbon body panels elevate vertically along Y.
  - Front HVAC cooling package slides forward along -Z.
  - Rear transaxle slides rearward along +Z.
  - Engine bay lifts and uncovers internal mechanical structures.
  - 4 independent suspension corners and wheels expand laterally along X.

### 3. 🔥 Powerplant: 4-Stroke Combustion Engine
- Reciprocating pistons with connecting rods adhering to the exact trigonometric crank-slider equation:
  $$y = r \cos(\theta) + \sqrt{l^2 - (r \sin\theta)^2}$$
- Dual Overhead Camshafts (DOHC) pulsing intake and exhaust valves with spring seats.
- Spark ignition flash point lights synchronized to Top Dead Center (TDC) of the compression stroke (1-3-4-2 firing order).
- Hot exhaust manifold with dynamic thermal glow scaling with throttle and RPM.

### 4. ⚙️ 7-Speed Dual-Clutch Transmission (DCT) & Differential
- Dual concentric input shafts (odd gears 1, 3, 5 / even gears 2, 4, 6) with multi-plate hydraulic clutches.
- Interlocking helical gear meshes with accurate tooth counts and ratios.
- Emissive torque energy pulse line highlighting the active power flow.
- Crown ring gear, spider bevel gears, and drive half-shafts.

### 5. 🛞 Adaptive Double-Wishbone & Magnetorheological Coilover Suspension
- Upper and lower tubular A-arms pivoting with outboard spherical ball joints.
- Procedural coil spring deforming and compressing dynamically under simulated road bump oscillations.
- Telescoping hydraulic damper rod with MagneRide adaptive damping.
- Dynamic camber recovery and tie-rod steering linkage.

### 6. 🛑 410mm Carbon-Silicon Carbide (C/SiC) 6-Piston Brakes
- Cross-drilled and slotted rotor with 28 internal centrifugal cooling vanes.
- Monobloc 6-piston opposed caliper with staggered piston bores.
- Interactive brake pedal clamping action.
- Thermal radiation shader simulating blackbody emission (charcoal gray $\rightarrow$ 850°C glowing cherry red).

### 7. ❄️ Automotive HVAC & Refrigerant Thermodynamic Cycle
- Variable displacement swashplate AC compressor with electromagnetic clutch.
- Micro-channel condenser with cooling fan and thermal expansion valve (TXV).
- Cabin evaporator core with rotating blower impeller.
- 4-phase color-coded refrigerant particle flow loop:
  - **Red**: High-pressure superheated gas (240 PSI)
  - **Orange/Yellow**: High-pressure subcooled liquid
  - **Cyan**: Cold low-pressure flash mist (-5°C)
  - **Blue**: Low-pressure suction vapor return

### 8. 🎛️ Diagnostic Lab & Telemetry HUD
- Real-time RPM tachometer, ground speed, cylinder peak pressure, turbo boost, and G-force sensors.
- Interactive throttle slider, gear shifter buttons (1-7, N, R), brake clamp trigger, and separation slider.
- Zero-asset Web Audio API procedural sound synthesizer (synthesizing engine harmonics, turbo spool, transmission whine, and brake friction hiss).
- Camera perspective presets (Default, Front, Side, Top, Isometric, Close-ups).

---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) v18+ (tested on Node v24)
- npm v9+

### Installation
```bash
# Clone repository
git clone https://github.com/blackmangoo/auto-engineering-3d.git
cd auto-engineering-3d

# Install dependencies
npm install --legacy-peer-deps

# Start development server
npm run dev
```

Visit `http://localhost:5173` in your browser.

### Production Build
```bash
npm run build
npm run preview
```

---

## 📐 Technologies Used
- **Three.js & React Three Fiber (@react-three/fiber, @react-three/drei)**: 3D procedural geometries, custom shaders, and lighting.
- **GSAP (GreenSock)**: Smooth scroll and camera interpolation.
- **React 19 & TypeScript**: Responsive UI and reactive telemetry state.
- **Tailwind CSS v4 (@tailwindcss/vite)**: Cyberpunk telemetry HUD and glassmorphism styling.
- **Web Audio API**: Real-time harmonic audio oscillator synthesis without external audio files.

---

## 📄 License
MIT License. Created for interactive automotive and aerospace engineering education.
