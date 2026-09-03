"use client";

/**
 * Object3DCanvas — a tiny transparent Three.js stage for one faceless part
 * object from part-objects-3d.ts. Loaded through next/dynamic so the Three.js
 * chunk only downloads when the studio's 3D Objects set is on screen, exactly
 * like the contact-page tire-pal scene.
 *
 * `animated` splits the two use cases: the Character-mode stage spins on a
 * turntable with a gentle bob, while crew-select cards render a single still
 * frame so six cards don't run six rAF loops. Everything runs on refs and one
 * loop — no React state per frame.
 */
import { type JSX, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { PART_OBJECT_BUILDERS } from "./part-objects-3d";

type Object3DCanvasProps = {
  objectId: string;
  reducedMotion: boolean;
  speed?: number;
  /** false renders one still frame (crew cards); true runs the turntable. */
  animated?: boolean;
  className?: string;
};

export default function Object3DCanvas({
  objectId,
  reducedMotion,
  speed = 1,
  animated = true,
  className,
}: Object3DCanvasProps): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const build = PART_OBJECT_BUILDERS[objectId];
    if (!build) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    } catch {
      // Deferred like the other games: setState in an effect body is a
      // cascading render, so the failure note waits a tick.
      window.setTimeout(() => setFailed(true), 0);
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    const canvas = renderer.domElement;
    canvas.style.display = "block";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    container.appendChild(canvas);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 20);
    camera.position.set(0, 0.25, 2.1);
    camera.lookAt(0, 0, 0);

    scene.add(new THREE.HemisphereLight(0xfff4e0, 0x3a3230, 1.1));
    const sun = new THREE.DirectionalLight(0xffffff, 1.4);
    sun.position.set(2, 3, 4);
    scene.add(sun);

    // Turntable wrapper, so the spin and the bob never fight each other.
    const spin = new THREE.Group();
    spin.add(build());
    // A pleasing 3/4 angle for stills and the first frame.
    spin.rotation.y = 0.7;
    scene.add(spin);

    // Fake blob shadow — no light shadows, this is the whole shading budget.
    const shadow = new THREE.Mesh(
      new THREE.CircleGeometry(0.5, 28),
      new THREE.MeshBasicMaterial({
        color: 0x171412,
        transparent: true,
        opacity: 0.22,
        depthWrite: false,
      }),
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.scale.y = 0.55;
    shadow.position.y = -0.68;
    scene.add(shadow);

    const still = reducedMotion || !animated;
    let running = false;
    let raf = 0;
    let last = 0;
    let clock = 0;
    let onScreen = true;

    function tick(now: number) {
      raf = 0;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      clock += dt;
      spin.rotation.y += dt * 0.7 * speed;
      spin.position.y = Math.sin(clock * 2) * 0.03;
      const shadowScale = Math.max(0.65, 1 - spin.position.y * 0.45);
      shadow.scale.set(shadowScale, 0.55 * shadowScale, 1);
      renderer.render(scene, camera);
      if (running) raf = requestAnimationFrame(tick);
    }

    function startLoop() {
      if (running) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(tick);
    }
    function stopLoop() {
      running = false;
      cancelAnimationFrame(raf);
      raf = 0;
    }
    function syncLoop() {
      if (still) {
        renderer.render(scene, camera);
        return;
      }
      if (onScreen && !document.hidden) startLoop();
      else stopLoop();
    }

    const observer = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      syncLoop();
    });
    observer.observe(container);
    const onVisibility = () => syncLoop();
    document.addEventListener("visibilitychange", onVisibility);

    const resize = new ResizeObserver(() => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      if (width === 0 || height === 0) return;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      if (still) renderer.render(scene, camera);
    });
    resize.observe(container);

    syncLoop();

    return () => {
      stopLoop();
      resize.disconnect();
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      scene.traverse((node) => {
        if (node instanceof THREE.Mesh) {
          node.geometry.dispose();
          const material = node.material;
          for (const entry of Array.isArray(material) ? material : [material]) entry.dispose();
        }
      });
      renderer.dispose();
      canvas.remove();
    };
  }, [objectId, reducedMotion, speed, animated]);

  if (failed) return <div className={className} aria-hidden="true" />;
  return <div ref={containerRef} className={className} aria-hidden="true" />;
}
