"use client";

/**
 * The 3D tire scene — the original Tread rig that lives in the contact-page
 * chat widget. A small transparent Three.js scene: a smiling tire in a red
 * shop cap with a valve stem sprout, rocking gently on a fake blob shadow.
 * Emotes arrive as props and play once. Everything runs on refs and one rAF
 * loop, like the arcade cabinet — no React state per frame.
 */
import { type JSX, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import type { MascotEmote } from "@/lib/chat/mascot";
import {
  buildPal,
  makeConfettiSprite,
  makeHeartSprite,
  makeZzzSprite,
  type TreadVariant,
} from "./tread-character";

type EmoteKind = NonNullable<MascotEmote>["kind"];

type Tire3DSceneProps = {
  emote: MascotEmote;
  reducedMotion: boolean;
  onFail?: () => void;
  className?: string;
  variant?: TreadVariant;
};

/* --- the scene ----------------------------------------------------------- */

const EMOTE_DURATIONS: Record<EmoteKind, number> = {
  celebrate: 0.9,
  thinking: 0.6,
  happy: 0.6,
  sleep: 0,
};

export default function Tire3DScene({
  emote,
  reducedMotion,
  onFail,
  className,
  variant,
}: Tire3DSceneProps): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  // The render loop reads the latest props through refs, so it never needs
  // to re-subscribe to React.
  const onFailRef = useRef(onFail);
  useEffect(() => {
    onFailRef.current = onFail;
  }, [onFail]);
  const reducedRef = useRef(reducedMotion);
  useEffect(() => {
    reducedRef.current = reducedMotion;
  }, [reducedMotion]);
  const emoteRef = useRef<MascotEmote>(emote);
  useEffect(() => {
    emoteRef.current = emote;
  }, [emote]);
  const variantRef = useRef(variant);
  useEffect(() => {
    variantRef.current = variant;
  }, [variant]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    } catch {
      // Deferred like the other games: setState in an effect body is a
      // cascading render, so the failure note waits a tick.
      window.setTimeout(() => setFailed(true), 0);
      onFailRef.current?.();
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
    camera.position.set(0, 0.35, 2.2);
    camera.lookAt(0, 0.1, 0);

    scene.add(new THREE.HemisphereLight(0xfff4e0, 0x3a3230, 1.1));
    const sun = new THREE.DirectionalLight(0xffffff, 1.4);
    sun.position.set(2, 3, 4);
    scene.add(sun);

    const pal = buildPal(variantRef.current);
    scene.add(pal.group);
    scene.add(pal.shadow);

    type Particle = {
      sprite: THREE.Sprite;
      velocity: THREE.Vector3;
      gravity: number;
      spin: number;
      t: number;
      life: number;
    };
    const particles: Particle[] = [];

    function disposeSprite(sprite: THREE.Sprite) {
      sprite.material.map?.dispose();
      sprite.material.dispose();
    }

    function spawnParticle(
      sprite: THREE.Sprite,
      position: THREE.Vector3,
      velocity: THREE.Vector3,
      gravity: number,
      life: number,
      scale: number,
      spin = 0,
    ) {
      sprite.position.copy(position);
      sprite.scale.set(scale, scale, 1);
      scene.add(sprite);
      particles.push({ sprite, velocity, gravity, spin, t: 0, life });
    }

    let activeEmote: { kind: EmoteKind; t: number } | null = null;
    let lastEmoteId: number | null = null;
    let clock = 0;
    let blinkT = -1;
    let nextBlink = 2.5 + Math.random() * 2.5;

    function startEmote(kind: EmoteKind) {
      activeEmote = { kind, t: 0 };
      const still = reducedRef.current;
      if (kind === "celebrate") {
        const colors = ["#f6bd38", "#a8161c", "#1a7183"];
        for (let i = 0; i < 10; i++) {
          spawnParticle(
            makeConfettiSprite(colors[i % colors.length]),
            new THREE.Vector3((Math.random() - 0.5) * 0.5, 0.55 + Math.random() * 0.25, 0.15),
            still
              ? new THREE.Vector3(0, 0, 0)
              : new THREE.Vector3(
                  (Math.random() - 0.5) * 1.7,
                  1.3 + Math.random() * 1.1,
                  (Math.random() - 0.5) * 0.6,
                ),
            2.4,
            0.9 + Math.random() * 0.3,
            0.1 + Math.random() * 0.08,
            still ? 0 : (Math.random() - 0.5) * 10,
          );
        }
      } else if (kind === "happy") {
        spawnParticle(
          makeHeartSprite(),
          new THREE.Vector3(0.3, 0.5, 0.2),
          new THREE.Vector3(0, still ? 0 : 0.55, 0),
          0,
          1.1,
          0.42,
        );
      } else if (kind === "sleep") {
        spawnParticle(
          makeZzzSprite(),
          new THREE.Vector3(0.34, 0.55, 0.2),
          new THREE.Vector3(0, still ? 0 : 0.45, 0),
          0,
          1.3,
          0.5,
        );
      }
    }

    let running = false;
    let raf = 0;
    let last = 0;
    let onScreen = true;

    function tick(now: number) {
      raf = 0;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      clock += dt;
      const t = clock;
      const still = reducedRef.current;

      // A new emote id plays once.
      const pending = emoteRef.current;
      if (pending) {
        if (pending.id !== lastEmoteId) {
          lastEmoteId = pending.id;
          startEmote(pending.kind);
        }
      } else {
        lastEmoteId = null;
      }

      // Idle: a gentle rock and a small bob, skipped for reduced motion.
      let rock = still ? 0 : Math.sin(t * 1.6) * 0.06;
      let hop = still ? 0 : Math.sin(t * 2.3) * 0.03;
      let spin = 0;

      if (activeEmote) {
        activeEmote.t += dt;
        const duration = EMOTE_DURATIONS[activeEmote.kind];
        const p = duration > 0 ? Math.min(1, activeEmote.t / duration) : 1;
        if (activeEmote.kind === "celebrate") {
          const ease = 1 - (1 - p) ** 3;
          spin = still ? 0 : ease * Math.PI * 2;
          hop += still ? 0 : Math.sin(p * Math.PI) * 0.35;
        } else if (activeEmote.kind === "thinking") {
          rock = still ? 0.16 : Math.sin(p * Math.PI * 3) * 0.18 * (1 - p);
        } else if (activeEmote.kind === "happy") {
          hop += still ? 0 : Math.sin(p * Math.PI) * 0.16;
        }
        if (activeEmote.t >= duration) activeEmote = null;
      }

      pal.group.rotation.z = rock;
      pal.group.rotation.y = spin;
      pal.group.position.y = hop;
      const shadowScale = Math.max(0.65, 1 - hop * 0.45);
      pal.shadow.scale.set(shadowScale, 0.55 * shadowScale, 1);

      // Blink every 2.5–5 s: lids down for ~120 ms.
      if (blinkT >= 0) {
        blinkT += dt;
        const lid = blinkT < 0.12 ? 0.1 : 1;
        pal.leftEye.scale.y = lid;
        pal.rightEye.scale.y = lid;
        if (blinkT >= 0.12) {
          blinkT = -1;
          nextBlink = t + 2.5 + Math.random() * 2.5;
        }
      } else if (t >= nextBlink) {
        blinkT = 0;
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i];
        particle.t += dt;
        if (!still) {
          particle.velocity.y -= particle.gravity * dt;
          particle.sprite.position.addScaledVector(particle.velocity, dt);
          particle.sprite.material.rotation += particle.spin * dt;
        }
        particle.sprite.material.opacity = Math.max(0, 1 - particle.t / particle.life);
        if (particle.t >= particle.life) {
          scene.remove(particle.sprite);
          disposeSprite(particle.sprite);
          particles.splice(i, 1);
        }
      }

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
        } else if (node instanceof THREE.Sprite) {
          disposeSprite(node);
        }
      });
      renderer.dispose();
      canvas.remove();
    };
  }, []);

  if (failed) return <div className={className} aria-hidden="true" />;
  return <div ref={containerRef} className={className} aria-hidden="true" />;
}
