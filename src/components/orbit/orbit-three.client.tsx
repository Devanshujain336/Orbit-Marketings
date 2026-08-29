import { useEffect, useRef } from "react";
import * as THREE from "three";

/* Orbital annotation data — labels that appear next to each ring. */
const ORBIT_ANNOTATIONS = [
  {
    label: "Onboard",
    subline: "Brand DNA extracted",
    color: "#ff6c4c",
    pos: { x: -0.36, y: 0.62 }, // relative (0–1) inside the canvas
  },
  {
    label: "Create",
    subline: "Videos produced",
    color: "#ffa946",
    pos: { x: 0.62, y: 0.14 },
  },
  {
    label: "Distribute",
    subline: "Boosted to buyers",
    color: "#a8a8b8",
    pos: { x: 0.62, y: 0.80 },
  },
];

export function OrbitThree() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    /* ── Scene ─────────────────────────────────────────────────────── */
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(44, 1, 0.1, 100);
    camera.position.set(0, 0.6, 9.5);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);

    /* ── Lighting ──────────────────────────────────────────────────── */
    scene.add(new THREE.AmbientLight(0xfff4e8, 1.8));

    const keyLight = new THREE.DirectionalLight(0xff6c4c, 6);
    keyLight.position.set(5, 6, 5);
    scene.add(keyLight);

    const rimLight = new THREE.PointLight(0xffa946, 20, 16);
    rimLight.position.set(-4, -2, 4);
    scene.add(rimLight);

    const backLight = new THREE.PointLight(0x6644ff, 8, 12);
    backLight.position.set(0, -4, -3);
    scene.add(backLight);

    /* ── System group ──────────────────────────────────────────────── */
    const system = new THREE.Group();
    system.rotation.x = -0.22;
    system.rotation.z = -0.10;
    scene.add(system);

    /* ── Core nucleus (layered spheres) ───────────────────────────── */
    // Inner glow sphere
    const glowMesh = new THREE.Mesh(
      new THREE.SphereGeometry(1.12, 32, 32),
      new THREE.MeshBasicMaterial({
        color: 0xff9050,
        transparent: true,
        opacity: 0.12,
      }),
    );
    system.add(glowMesh);

    // Main core
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0xff6c4c,
      emissive: 0xff4422,
      emissiveIntensity: 0.22,
      metalness: 0.08,
      roughness: 0.28,
    });
    const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.88, 6), coreMat);
    system.add(core);

    // Outer halo ring (flat torus around equator)
    const haloRing = new THREE.Mesh(
      new THREE.TorusGeometry(1.05, 0.022, 16, 100),
      new THREE.MeshBasicMaterial({ color: 0xffa050, transparent: true, opacity: 0.4 }),
    );
    haloRing.rotation.x = Math.PI / 2;
    system.add(haloRing);

    /* ── Orbital rings (3 tilted ellipses) ────────────────────────── */
    interface RingDef {
      radius: number;
      tube: number;
      color: number;
      opacity: number;
      rx: number;
      ry: number;
      speed: number;
      satRadius: number;
      satColor: number;
      satEmissive: number;
    }

    const ringDefs: RingDef[] = [
      {
        radius: 1.85,
        tube: 0.024,
        color: 0xff6c4c,
        opacity: 0.75,
        rx: 1.18,
        ry: 0.14,
        speed: 0.0038,
        satRadius: 0.14,
        satColor: 0xff6c4c,
        satEmissive: 0xff4422,
      },
      {
        radius: 2.6,
        tube: 0.018,
        color: 0xffa946,
        opacity: 0.65,
        rx: 0.70,
        ry: -0.45,
        speed: -0.0025,
        satRadius: 0.11,
        satColor: 0xffa946,
        satEmissive: 0xff8800,
      },
      {
        radius: 3.35,
        tube: 0.015,
        color: 0x3a3a4a,
        opacity: 0.35,
        rx: 1.28,
        ry: 0.30,
        speed: 0.0016,
        satRadius: 0.10,
        satColor: 0x9090a8,
        satEmissive: 0x4444aa,
      },
    ];

    const rings: THREE.Mesh[] = [];

    ringDefs.forEach((def) => {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(def.radius, def.tube, 20, 240),
        new THREE.MeshStandardMaterial({
          color: def.color,
          transparent: true,
          opacity: def.opacity,
          roughness: 0.3,
          metalness: 0.1,
        }),
      );
      ring.rotation.x = def.rx;
      ring.rotation.y = def.ry;
      ring.userData["speed"] = def.speed;
      system.add(ring);
      rings.push(ring);

      /* Satellite — small glowing sphere riding the ring */
      const sat = new THREE.Mesh(
        new THREE.SphereGeometry(def.satRadius, 24, 24),
        new THREE.MeshStandardMaterial({
          color: def.satColor,
          emissive: def.satEmissive,
          emissiveIntensity: 0.5,
          roughness: 0.18,
          metalness: 0.2,
        }),
      );
      sat.position.set(def.radius, 0, 0);
      ring.add(sat);
    });

    /* ── Inner bullseye rings floating around nucleus ─────────────── */
    [1.05, 1.25, 1.45].forEach((r, i) => {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(r, 0.008, 12, 80),
        new THREE.MeshBasicMaterial({
          color: 0xff8844,
          transparent: true,
          opacity: 0.08 - i * 0.02,
        }),
      );
      ring.rotation.x = Math.PI / 2 + 0.05 * i;
      system.add(ring);
    });

    /* ── Particle field ───────────────────────────────────────────── */
    const PARTICLE_COUNT = 320;
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 3.8 + Math.random() * 2.5;
      positions[i * 3 + 0] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
    }
    const partGeo = new THREE.BufferGeometry();
    partGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const partMat = new THREE.PointsMaterial({
      color: 0xffa060,
      size: 0.045,
      transparent: true,
      opacity: 0.55,
    });
    scene.add(new THREE.Points(partGeo, partMat));

    /* ── Pointer interaction ──────────────────────────────────────── */
    let pointerX = 0;
    let pointerY = 0;
    const onPointerMove = (event: PointerEvent) => {
      const rect = mount.getBoundingClientRect();
      pointerX = ((event.clientX - rect.left) / rect.width - 0.5) * 0.4;
      pointerY = ((event.clientY - rect.top) / rect.height - 0.5) * 0.28;
    };
    mount.addEventListener("pointermove", onPointerMove);

    /* ── Resize handler ───────────────────────────────────────────── */
    const resize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(mount);
    resize();

    /* ── Reduced-motion ───────────────────────────────────────────── */
    let reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onMotionChange = (e: MediaQueryListEvent) => { reducedMotion = e.matches; };
    media.addEventListener("change", onMotionChange);

    /* ── Animation loop ───────────────────────────────────────────── */
    let frame = 0;
    let t = 0;
    const animate = () => {
      frame = window.requestAnimationFrame(animate);
      if (!reducedMotion) {
        t += 0.008;
        rings.forEach((ring) => {
          ring.rotation.z += Number(ring.userData["speed"]);
        });
        core.rotation.y += 0.003;
        core.rotation.x += 0.0008;
        haloRing.rotation.z += 0.002;
        // Gentle nucleus pulse via scale
        const pulse = 1 + Math.sin(t * 1.8) * 0.012;
        core.scale.setScalar(pulse);
        glowMesh.scale.setScalar(pulse * 1.05);

        // Mouse-follow tilt
        system.rotation.y += (pointerX - system.rotation.y) * 0.022;
        system.rotation.x += (-0.22 - pointerY - system.rotation.x) * 0.022;
      }
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      mount.removeEventListener("pointermove", onPointerMove);
      media.removeEventListener("change", onMotionChange);
      renderer.dispose();
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          (Array.isArray(object.material) ? object.material : [object.material]).forEach((m) =>
            m.dispose(),
          );
        }
      });
      renderer.domElement.remove();
    };
  }, []);

  return (
    <div className="absolute inset-0" aria-hidden="true">
      {/* Three.js canvas fills the container */}
      <div ref={mountRef} className="absolute inset-0" />

      {/* ── Annotation labels ──────────────────────────────────────── */}
      {ORBIT_ANNOTATIONS.map((ann) => (
        <div
          key={ann.label}
          className="pointer-events-none absolute flex flex-col md:flex-row items-center md:items-baseline gap-1 md:gap-1.5 select-none"
          style={{
            "--pos-x-desktop": `${(ann.pos.x + 0.5) * 100}%`,
            "--pos-x-mobile": `${(ann.pos.x * 0.45 + 0.5) * 100}%`, // pull inward on mobile
            "--pos-y": `${ann.pos.y * 100}%`,
            left: "var(--pos-x-mobile)",
            top: "var(--pos-y)",
            transform: "translate(-50%, -50%)",
          } as React.CSSProperties}
        >
          {/* We use a tiny style block to apply the desktop position via media query, since inline styles don't support breakpoints directly */}
          <style>{`
            @media (min-width: 768px) {
              div[data-label="${ann.label}"] { left: var(--pos-x-desktop) !important; }
            }
          `}</style>
          
          <div data-label={ann.label} className="contents">
            {/* Connector dot */}
            <span
              className="block size-2 shrink-0 rounded-full ring-1 ring-background"
              style={{ background: ann.color }}
            />
            <span
              className="rounded-md border bg-background/70 px-2 py-0.5 md:px-2.5 md:py-1 text-xs md:text-sm font-bold leading-none backdrop-blur-sm whitespace-nowrap text-center"
              style={{ color: ann.color, borderColor: ann.color + "44" }}
            >
              {ann.label}{" "}
              <span className="block md:inline font-normal text-muted-foreground text-[10px] md:text-xs md:ml-1 mt-0.5 md:mt-0">
                {ann.subline}
              </span>
            </span>
          </div>
        </div>
      ))}

      {/* ── Qualify label (bottom-left) ────────────────────────────── */}
      <div
        className="pointer-events-none absolute flex flex-col md:flex-row items-center md:items-baseline gap-1 md:gap-1.5 select-none"
        style={{ 
          "--pos-x-desktop": "10%", 
          "--pos-x-mobile": "25%",
          left: "var(--pos-x-mobile)", 
          top: "84%", 
          transform: "translate(-50%, -50%)" 
        } as React.CSSProperties}
      >
        <style>{`
          @media (min-width: 768px) {
            div[data-label="Qualify"] { left: var(--pos-x-desktop) !important; }
          }
        `}</style>
        <div data-label="Qualify" className="contents">
          <span
            className="block size-2 shrink-0 rounded-full ring-1 ring-background"
            style={{ background: "#ff6c4c" }}
          />
          <span className="rounded-md border bg-background/70 px-2 py-0.5 md:px-2.5 md:py-1 text-xs md:text-sm font-bold leading-none backdrop-blur-sm text-[#ff6c4c] border-[#ff6c4c44] whitespace-nowrap text-center">
            Qualify{" "}
            <span className="block md:inline font-normal text-muted-foreground text-[10px] md:text-xs md:ml-1 mt-0.5 md:mt-0">
              protect your time
            </span>
          </span>
        </div>
      </div>

      {/* ── "ORBIT — Always On" centre label ──────────────────────── */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[120%] flex flex-col items-center gap-1 select-none">
        <span className="rounded-full border border-border bg-background/70 px-3 py-1 font-display text-xs font-bold uppercase tracking-widest text-foreground backdrop-blur-sm">
          Orbit · Always On
        </span>
      </div>
    </div>
  );
}