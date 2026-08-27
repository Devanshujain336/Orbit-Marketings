import { useEffect, useRef } from "react";
import * as THREE from "three";

export function OrbitThree() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 100);
    camera.position.set(0, 0.25, 8.4);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xfff7ed, 2.2));
    const keyLight = new THREE.PointLight(0xff6c4c, 24, 20);
    keyLight.position.set(4, 4, 5);
    scene.add(keyLight);
    const fillLight = new THREE.PointLight(0xffa946, 18, 18);
    fillLight.position.set(-4, -2, 3);
    scene.add(fillLight);

    const system = new THREE.Group();
    system.rotation.x = -0.2;
    system.rotation.z = -0.12;
    scene.add(system);

    const core = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.82, 5),
      new THREE.MeshStandardMaterial({
        color: 0xff6c4c,
        emissive: 0xff6c4c,
        emissiveIntensity: 0.12,
        metalness: 0.05,
        roughness: 0.34,
      }),
    );
    system.add(core);

    const halo = new THREE.Mesh(
      new THREE.SphereGeometry(1.03, 32, 32),
      new THREE.MeshBasicMaterial({ color: 0xffa946, transparent: true, opacity: 0.08 }),
    );
    system.add(halo);

    const ringData = [
      { radius: 1.75, color: 0xff6c4c, x: 1.1, y: 0.15, speed: 0.0032 },
      { radius: 2.48, color: 0xffa946, x: 0.72, y: -0.42, speed: -0.0022 },
      { radius: 3.2, color: 0x1a1a1a, x: 1.25, y: 0.32, speed: 0.0015 },
    ];
    const rings: THREE.Mesh[] = [];

    ringData.forEach((item, ringIndex) => {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(item.radius, ringIndex === 0 ? 0.025 : 0.017, 16, 180),
        new THREE.MeshStandardMaterial({
          color: item.color,
          transparent: true,
          opacity: ringIndex === 2 ? 0.28 : 0.7,
          roughness: 0.35,
        }),
      );
      ring.rotation.x = item.x;
      ring.rotation.y = item.y;
      ring.userData.speed = item.speed;
      system.add(ring);
      rings.push(ring);

      const satellite = new THREE.Mesh(
        new THREE.SphereGeometry(ringIndex === 0 ? 0.13 : 0.1, 20, 20),
        new THREE.MeshStandardMaterial({
          color: item.color,
          emissive: item.color,
          emissiveIntensity: 0.25,
          roughness: 0.25,
        }),
      );
      satellite.position.set(item.radius, 0, 0);
      ring.add(satellite);
    });

    let frame = 0;
    let pointerX = 0;
    let pointerY = 0;
    let reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const onPointerMove = (event: PointerEvent) => {
      const rect = mount.getBoundingClientRect();
      pointerX = ((event.clientX - rect.left) / rect.width - 0.5) * 0.35;
      pointerY = ((event.clientY - rect.top) / rect.height - 0.5) * 0.25;
    };

    const resize = () => {
      const width = mount.clientWidth;
      const height = mount.clientHeight;
      if (!width || !height) return;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };

    const animate = () => {
      frame = window.requestAnimationFrame(animate);
      if (!reducedMotion) {
        rings.forEach((ring) => {
          ring.rotation.z += Number(ring.userData.speed);
        });
        core.rotation.y += 0.002;
        system.rotation.y += (pointerX - system.rotation.y) * 0.025;
        system.rotation.x += (-0.2 - pointerY - system.rotation.x) * 0.025;
      }
      renderer.render(scene, camera);
    };

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onMotionChange = (event: MediaQueryListEvent) => {
      reducedMotion = event.matches;
    };
    const observer = new ResizeObserver(resize);
    observer.observe(mount);
    mount.addEventListener("pointermove", onPointerMove);
    media.addEventListener("change", onMotionChange);
    resize();
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
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach((material) => material.dispose());
        }
      });
      renderer.domElement.remove();
    };
  }, []);

  return <div ref={mountRef} className="absolute inset-0" aria-hidden="true" />;
}