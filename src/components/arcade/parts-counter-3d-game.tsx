"use client";

/**
 * Parts Counter 3D — an Animal Crossing-style shop sim. You are the clerk:
 * customers walk in the front door, wait at the counter, and you walk to the
 * back shelves to fetch their part, then ring it up. Coins buy cosmetic props
 * between days.
 *
 * The canvas is the fun way to play; the buttons under it do everything the
 * canvas does, so the game works without WebGL, without a pointer, and without
 * motion.
 */
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { cozyAudio, speakWords, stopWords } from "@/lib/arcade/garage-audio";
import {
  CUSTOMERS_PER_DAY,
  buyUpgrade,
  canAfford,
  coinsForOrder,
  isDayComplete,
  money,
  nextCounterOrder,
  orderPart,
  orderTotal,
  partsStock,
  stockEntry,
  streakAdvance,
  upgrades,
  type PartsOrder,
} from "@/lib/arcade/parts-orders";
import { CozyShell, useAmbience } from "./cozy/cozy-shell";
import { buildWorld, type WorldHandle } from "./parts-world";
import { makeBubble, makeClerk, makeCustomer, makeEmote, type Character } from "./parts-avatars";

const SAVE_KEY = "ohat-parts-3d-v1";
const SPEED = 3.2;
const INTERACT_RADIUS = 1.3;

type VoiceMode = "quiet" | "mumbles" | "words";
type Save = { coins: number; owned: string[]; best: number; voiceMode: VoiceMode };

const VOICE_MODES: VoiceMode[] = ["mumbles", "words", "quiet"];

function loadSave(): Save {
  try {
    const raw = window.localStorage.getItem(SAVE_KEY);
    if (!raw) return { coins: 0, owned: [], best: 0, voiceMode: "mumbles" };
    const parsed = JSON.parse(raw) as Partial<Save>;
    return {
      coins: typeof parsed.coins === "number" ? parsed.coins : 0,
      owned: Array.isArray(parsed.owned) ? parsed.owned : [],
      best: typeof parsed.best === "number" ? parsed.best : 0,
      voiceMode: VOICE_MODES.includes(parsed.voiceMode as VoiceMode)
        ? (parsed.voiceMode as VoiceMode)
        : "mumbles",
    };
  } catch {
    return { coins: 0, owned: [], best: 0, voiceMode: "mumbles" };
  }
}

const FIRST_ORDER: PartsOrder = {
  items: [{ id: "wipers", quantity: 1 }],
  customer: "A regular in a work jacket",
  slip: 1178,
};

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

export default function PartsCounter3DGame() {
  const [sound, setSound] = useState(false);
  const [save, setSave] = useState<Save>(() => loadSave());
  const [order, setOrder] = useState<PartsOrder>(FIRST_ORDER);
  const [carried, setCarried] = useState<string | null>(null);
  const [delivered, setDelivered] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [servedThisDay, setServedThisDay] = useState(0);
  const [day, setDay] = useState(1);
  const [streak, setStreak] = useState(0);
  const [phase, setPhase] = useState<"playing" | "shop">("playing");
  const [note, setNote] = useState("");
  const [sceneFailed, setSceneFailed] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<WorldHandle | null>(null);
  const clerkRef = useRef<Character | null>(null);
  const customerRef = useRef<Character | null>(null);
  const bubbleRef = useRef<THREE.Sprite | null>(null);
  const emoteRef = useRef<{ sprite: THREE.Sprite; t: number } | null>(null);
  const carriedMeshRef = useRef<THREE.Mesh | null>(null);
  const keysRef = useRef<Record<string, boolean>>({});
  const moveTargetRef = useRef<THREE.Vector3 | null>(null);
  const pendingActionRef = useRef<{ kind: "grab" | "deliver"; id?: string } | null>(null);
  const customerStateRef = useRef<{
    state: "entering" | "waiting" | "leaving";
    t: number;
    from: THREE.Vector3;
    to: THREE.Vector3;
  } | null>(null);
  const clockRef = useRef(0);
  const movingRef = useRef(false);
  const rafRef = useRef(0);
  const lastRef = useRef(0);
  const onScreenRef = useRef(true);
  const reducedRef = useRef(false);
  const grabRef = useRef<(id: string) => void>(() => {});
  const deliverRef = useRef<() => void>(() => {});

  // The render loop reads the latest state through this ref, so it never
  // needs to re-subscribe to React state.
  const stateRef = useRef({
    order,
    carried,
    delivered,
    phase,
    servedThisDay,
    day,
    streak,
    mistakes,
  });
  useEffect(() => {
    stateRef.current = { order, carried, delivered, phase, servedThisDay, day, streak, mistakes };
  });
  const voiceModeRef = useRef(save.voiceMode);
  useEffect(() => {
    voiceModeRef.current = save.voiceMode;
  }, [save.voiceMode]);
  const stepTimerRef = useRef(0);

  useAmbience(sound, { fluorescent: 0.012, shopHum: 0.012, traffic: 0.006 });

  // Persist the meta whenever it changes.
  useEffect(() => {
    try {
      window.localStorage.setItem(SAVE_KEY, JSON.stringify(save));
    } catch {
      /* storage full or blocked — the game just won't remember */
    }
  }, [save]);

  // Build the scene once. A missing WebGL2 context is not the end of the game.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (!canvas.getContext("webgl2")) {
      setSceneFailed(true);
      return;
    }
    reducedRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1b1c20);
    const camera = new THREE.PerspectiveCamera(35, 2, 0.1, 60);

    const world = buildWorld(scene);
    worldRef.current = world;
    for (const id of save.owned) world.setPropVisible(id, true);

    const clerk = makeClerk();
    clerk.group.position.copy(world.clerkStart);
    scene.add(clerk.group);
    clerkRef.current = clerk;

    // A little tinted box that floats over the clerk's head while carrying.
    const carriedMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.14, 0.16),
      new THREE.MeshStandardMaterial({ color: 0x999999, roughness: 0.6 }),
    );
    carriedMesh.position.y = 1.4;
    carriedMesh.visible = false;
    clerk.group.add(carriedMesh);
    carriedMeshRef.current = carriedMesh;

    const resize = new ResizeObserver(() => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (width === 0 || height === 0) return;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    });
    resize.observe(canvas);

    const observer = new IntersectionObserver(([entry]) => {
      onScreenRef.current = entry.isIntersecting;
      syncLoop();
    });
    observer.observe(canvas);
    const onVisibility = () => syncLoop();
    document.addEventListener("visibilitychange", onVisibility);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    function pickInteractable(clientX: number, clientY: number) {
      const rect = canvas!.getBoundingClientRect();
      pointer.set(
        ((clientX - rect.left) / rect.width) * 2 - 1,
        -((clientY - rect.top) / rect.height) * 2 + 1,
      );
      raycaster.setFromCamera(pointer, camera);
      for (const item of world.interactables) {
        const hits = raycaster.intersectObject(item.object, true);
        if (hits.length > 0) return item;
      }
      return null;
    }

    function pickFloor(clientX: number, clientY: number): THREE.Vector3 | null {
      const rect = canvas!.getBoundingClientRect();
      pointer.set(
        ((clientX - rect.left) / rect.width) * 2 - 1,
        -((clientY - rect.top) / rect.height) * 2 + 1,
      );
      raycaster.setFromCamera(pointer, camera);
      const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
      const hit = new THREE.Vector3();
      if (raycaster.ray.intersectPlane(plane, hit)) {
        hit.x = clamp(hit.x, world.bounds.minX, world.bounds.maxX);
        hit.z = clamp(hit.z, world.bounds.minZ, world.bounds.maxZ);
        return hit;
      }
      return null;
    }

    const onPointerDown = (event: PointerEvent) => {
      const item = pickInteractable(event.clientX, event.clientY);
      if (item) {
        if (item.kind === "register") {
          moveTargetRef.current = world.registerSpot.clone();
          pendingActionRef.current = { kind: "deliver" };
        } else if (item.kind === "shelf" && item.id) {
          moveTargetRef.current = world.shelfSpot(item.id);
          pendingActionRef.current = { kind: "grab", id: item.id };
        }
      } else {
        const floor = pickFloor(event.clientX, event.clientY);
        moveTargetRef.current = floor;
        pendingActionRef.current = null;
      }
    };
    canvas.addEventListener("pointerdown", onPointerDown);

    function spawnCustomer(order: PartsOrder) {
      const palette = {
        body: [0x1a7183, 0x68a56f, 0x8f1a1f, 0x6a4e30, 0x3b5a8f][Math.floor(Math.random() * 5)],
        head: 0xf0d9b8,
      };
      const customer = makeCustomer(palette);
      customer.group.position.copy(world.doorSpot);
      scene.add(customer.group);
      customerRef.current = customer;
      const bubble = makeBubble(order.items[0].id, order.items[0].quantity);
      bubble.position.y = 1.6;
      bubble.visible = false;
      customer.group.add(bubble);
      bubbleRef.current = bubble;
      customerStateRef.current = {
        state: "entering",
        t: 0,
        from: world.doorSpot.clone(),
        to: world.matSpot.clone(),
      };
      world.door.open();
      cozyAudio.doorBell();
    }

    function grab(id: string) {
      const s = stateRef.current;
      if (s.carried || s.phase !== "playing") return;
      if (!customerStateRef.current || customerStateRef.current.state !== "waiting") return;
      if (id !== s.order.items[0].id) {
        setMistakes((count) => count + 1);
        setNote(
          `"Oh — not the ${stockEntry(id).label.toLowerCase()}, sorry. Check the ticket again."`,
        );
        cozyAudio.click();
        return;
      }
      setCarried(id);
      setNote(`Picked up the ${stockEntry(id).label.toLowerCase()}.`);
      cozyAudio.drawer();
    }

    function deliver() {
      const s = stateRef.current;
      if (!s.carried || s.phase !== "playing") return;
      const qty = s.order.items[0].quantity;
      const nextDelivered = s.delivered + 1;
      if (nextDelivered >= qty) {
        const coins = coinsForOrder(s.order);
        setCarried(null);
        setDelivered(0);
        const newServed = s.servedThisDay + 1;
        setServedThisDay(newServed);
        if (isDayComplete(newServed)) setPhase("shop");
        setStreak((current) => {
          const next = streakAdvance(current, s.mistakes);
          setSave((prev) => ({ ...prev, best: Math.max(prev.best, next) }));
          return next;
        });
        setSave((prev) => ({ ...prev, coins: prev.coins + coins }));
        setNote(
          s.mistakes === 0
            ? `"Perfect — first try, every part. You're hired." +${coins} coins`
            : `"That's the lot. Thanks!" +${coins} coins`,
        );
        cozyAudio.coin();
        cozyAudio.printer();
        if (customerRef.current) {
          const emote = makeEmote("happy");
          emote.position.y = 1.7;
          customerRef.current.group.add(emote);
          emoteRef.current = { sprite: emote, t: 0 };
        }
        world.setShelfGlow(null);
        if (bubbleRef.current) bubbleRef.current.visible = false;
        customerStateRef.current = {
          state: "leaving",
          t: 0,
          from: world.matSpot.clone(),
          to: world.doorSpot.clone(),
        };
      } else {
        setCarried(null);
        setDelivered(nextDelivered);
        setNote(`${nextDelivered} of ${qty} on the counter.`);
        cozyAudio.drawer();
      }
    }

    function doAction(action: { kind: "grab" | "deliver"; id?: string }) {
      if (action.kind === "deliver") deliver();
      else if (action.kind === "grab" && action.id) grab(action.id);
    }
    grabRef.current = grab;
    deliverRef.current = deliver;

    function moveClerk(dt: number) {
      const s = stateRef.current;
      const keys = keysRef.current;
      let dx = 0;
      let dz = 0;
      if (keys.up) dz -= 1;
      if (keys.down) dz += 1;
      if (keys.left) dx -= 1;
      if (keys.right) dx += 1;

      const target = moveTargetRef.current;
      if (target) {
        const d = Math.hypot(target.x - clerk.group.position.x, target.z - clerk.group.position.z);
        if (d < 0.35) {
          moveTargetRef.current = null;
          if (pendingActionRef.current) {
            doAction(pendingActionRef.current);
            pendingActionRef.current = null;
          }
        } else {
          dx = (target.x - clerk.group.position.x) / d;
          dz = (target.z - clerk.group.position.z) / d;
        }
      }

      if (dx !== 0 || dz !== 0) {
        const len = Math.hypot(dx, dz);
        dx /= len;
        dz /= len;
        clerk.group.position.x += dx * SPEED * dt;
        clerk.group.position.z += dz * SPEED * dt;
        clerk.group.rotation.y = Math.atan2(dx, dz);
        movingRef.current = true;
        stepTimerRef.current += dt;
        if (stepTimerRef.current > 0.28) {
          stepTimerRef.current = 0;
          cozyAudio.step();
        }
      } else {
        movingRef.current = false;
        stepTimerRef.current = 0.2;
      }

      for (const obstacle of world.obstacles) {
        const d = Math.hypot(
          clerk.group.position.x - obstacle.x,
          clerk.group.position.z - obstacle.z,
        );
        const min = obstacle.r + 0.35;
        if (d < min && d > 0.001) {
          const push = (min - d) / d;
          clerk.group.position.x += (clerk.group.position.x - obstacle.x) * push;
          clerk.group.position.z += (clerk.group.position.z - obstacle.z) * push;
        }
      }
      clerk.group.position.x = clamp(clerk.group.position.x, world.bounds.minX, world.bounds.maxX);
      clerk.group.position.z = clamp(clerk.group.position.z, world.bounds.minZ, world.bounds.maxZ);
      void s;
    }

    function updateCustomer(dt: number) {
      const c = customerStateRef.current;
      if (!c || !customerRef.current) return;
      c.t += dt / 2.2;
      const t = easeInOut(clamp(c.t, 0, 1));
      customerRef.current.group.position.x = lerp(c.from.x, c.to.x, t);
      customerRef.current.group.position.z = lerp(c.from.z, c.to.z, t);
      customerRef.current.waddle(clockRef.current, c.state !== "waiting");
      if (c.t >= 1) {
        if (c.state === "entering") {
          c.state = "waiting";
          if (bubbleRef.current) bubbleRef.current.visible = true;
          const part = orderPart(stateRef.current.order);
          world.setShelfGlow(part.id);
          cozyAudio.pop();
          const ask = stockEntry(part.id).ask;
          if (voiceModeRef.current === "mumbles") cozyAudio.mumble();
          else if (voiceModeRef.current === "words") {
            speakWords(`I need ${part.quantity === 1 ? "" : `${part.quantity} `}${ask}`);
          }
          setNote(
            `${stateRef.current.order.customer} wants ${part.quantity === 1 ? "a" : `${part.quantity} of`} ${stockEntry(part.id).label.toLowerCase()}.`,
          );
        } else if (c.state === "leaving") {
          stopWords();
          if (customerRef.current) scene.remove(customerRef.current.group);
          customerRef.current = null;
          bubbleRef.current = null;
          customerStateRef.current = null;
          world.door.close();
          cozyAudio.doorBell();
          if (stateRef.current.phase === "playing") {
            const next = nextCounterOrder();
            setOrder(next);
            spawnCustomer(next);
          }
        }
      }
    }

    function updateCarry(dt: number) {
      const s = stateRef.current;
      const mesh = carriedMeshRef.current;
      if (!mesh) return;
      if (s.carried) {
        mesh.visible = true;
        (mesh.material as THREE.MeshStandardMaterial).color.setHex(
          {
            wipers: 0x1a7183,
            oilfilter: 0xa8161c,
            battery: 0x68a56f,
            bulb: 0xf6bd38,
            airfilter: 0x8fb7c4,
            coolant: 0xe0555a,
            plugs: 0xcfc9b8,
            wax: 0xc9a875,
          }[s.carried] ?? 0x999999,
        );
        mesh.position.y = 1.4 + Math.sin(clockRef.current * 6) * 0.03;
      } else {
        mesh.visible = false;
      }
      void dt;
    }

    function updateEmote(dt: number) {
      const emote = emoteRef.current;
      if (!emote) return;
      emote.t += dt;
      emote.sprite.scale.setScalar(0.9 + emote.t * 0.4);
      (emote.sprite.material as THREE.SpriteMaterial).opacity = Math.max(0, 1 - emote.t);
      if (emote.t > 1) {
        emote.sprite.parent?.remove(emote.sprite);
        emoteRef.current = null;
      }
    }

    function updateCamera(dt: number) {
      // Damped follow: the camera tracks the clerk loosely so the room feels
      // stable (Animal Crossing keeps a calm frame), not glued to the avatar.
      const followX = clerk.group.position.x * 0.6;
      const followZ = clerk.group.position.z * 0.5;
      const desired = new THREE.Vector3(followX, 6.8, followZ + 7.2);
      if (reducedRef.current) {
        camera.position.copy(desired);
      } else {
        camera.position.lerp(desired, Math.min(1, dt * 3));
      }
      camera.lookAt(followX, 0.6, followZ - 0.5);
    }

    let running = false;
    function tick(now: number) {
      rafRef.current = 0;
      const dt = Math.min(0.05, (now - lastRef.current) / 1000);
      lastRef.current = now;
      clockRef.current += dt;
      moveClerk(dt);
      updateCustomer(dt);
      updateCarry(dt);
      updateEmote(dt);
      world.update(dt);
      clerkRef.current?.waddle(clockRef.current, movingRef.current);
      updateCamera(dt);
      renderer.render(scene, camera);
      if (running) rafRef.current = requestAnimationFrame(tick);
    }
    function startLoop() {
      if (running) return;
      running = true;
      lastRef.current = performance.now();
      rafRef.current = requestAnimationFrame(tick);
    }
    function stopLoop() {
      running = false;
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }
    function syncLoop() {
      const shouldRun =
        stateRef.current.phase === "playing" && onScreenRef.current && !document.hidden;
      if (shouldRun) startLoop();
      else stopLoop();
    }
    (window as unknown as { __partsSyncLoop?: () => void }).__partsSyncLoop = syncLoop;

    spawnCustomer(FIRST_ORDER);
    syncLoop();

    return () => {
      stopLoop();
      stopWords();
      resize.disconnect();
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      canvas.removeEventListener("pointerdown", onPointerDown);
      worldRef.current = null;
      clerkRef.current = null;
      customerRef.current = null;
      scene.traverse((node) => {
        if (node instanceof THREE.Mesh) {
          node.geometry.dispose();
          const material = node.material;
          for (const entry of Array.isArray(material) ? material : [material]) entry.dispose();
        }
      });
      renderer.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the loop in step with the phase (playing vs the between-days shop).
  useEffect(() => {
    (window as unknown as { __partsSyncLoop?: () => void }).__partsSyncLoop?.();
  }, [phase]);

  function interact() {
    const s = stateRef.current;
    if (s.carried) {
      const d = Math.hypot(
        clerkRef.current!.group.position.x - worldRef.current!.registerSpot.x,
        clerkRef.current!.group.position.z - worldRef.current!.registerSpot.z,
      );
      if (d < INTERACT_RADIUS) deliverRef.current();
      return;
    }
    const wanted = s.order.items[0].id;
    const spot = worldRef.current!.shelfSpot(wanted);
    const d = Math.hypot(
      clerkRef.current!.group.position.x - spot.x,
      clerkRef.current!.group.position.z - spot.z,
    );
    if (d < INTERACT_RADIUS) grabRef.current(wanted);
  }

  function onKeyDown(event: React.KeyboardEvent) {
    const map: Record<string, string> = {
      ArrowUp: "up",
      ArrowDown: "down",
      ArrowLeft: "left",
      ArrowRight: "right",
      w: "up",
      s: "down",
      a: "left",
      d: "right",
      W: "up",
      S: "down",
      A: "left",
      D: "right",
    };
    const key = map[event.key];
    if (key) {
      keysRef.current[key] = true;
      event.preventDefault();
    } else if (event.key === "e" || event.key === "E" || event.key === " ") {
      interact();
      event.preventDefault();
    }
  }
  function onKeyUp(event: React.KeyboardEvent) {
    const map: Record<string, string> = {
      ArrowUp: "up",
      ArrowDown: "down",
      ArrowLeft: "left",
      ArrowRight: "right",
      w: "up",
      s: "down",
      a: "left",
      d: "right",
      W: "up",
      S: "down",
      A: "left",
      D: "right",
    };
    const key = map[event.key];
    if (key) keysRef.current[key] = false;
  }

  function buy(id: string) {
    const result = buyUpgrade(save.coins, save.owned, id);
    if (!result) return;
    setSave((prev) => ({ ...prev, ...result }));
    worldRef.current?.setPropVisible(id, true);
    cozyAudio.coin();
  }

  function openNextDay() {
    setServedThisDay(0);
    setDay((current) => current + 1);
    setPhase("playing");
    setNote("");
  }

  function cycleVoice() {
    setSave((prev) => {
      const next = VOICE_MODES[(VOICE_MODES.indexOf(prev.voiceMode) + 1) % VOICE_MODES.length];
      if (next === "quiet") stopWords();
      return { ...prev, voiceMode: next };
    });
    cozyAudio.click();
  }

  const part = orderPart(order);
  const wanted = part.id;
  const held = carried ? 1 : 0;
  const filled = delivered >= part.quantity;

  return (
    <CozyShell
      edition="Ocean Heights · parts counter, in 3D"
      title="Parts Counter 3D"
      note="Walk to the back shelves, grab what the customer asked for, and ring it up at the front counter. WASD or arrows to move, E to grab or ring up — or just tap. Nothing is timed."
      soundOn={sound}
      onSoundChange={setSound}
    >
      <div
        ref={stageRef}
        className="cozy-stage parts-3d-stage"
        tabIndex={0}
        onKeyDown={onKeyDown}
        onKeyUp={onKeyUp}
        aria-label="Parts Counter 3D game. Use arrow keys or WASD to move, E to interact."
      >
        <canvas
          ref={canvasRef}
          role="img"
          aria-label="A 3D auto parts shop: front counter with a register, back shelves of parts, and a clerk you move around"
        />
        <div className="parts-3d-hud" aria-hidden="true">
          <span>Day {day}</span>
          <span>{save.coins}¢</span>
          <span>Streak {streak}</span>
        </div>
        {sceneFailed ? (
          <p className="parts-3d-fallback">
            The 3D shop needs WebGL, which this browser could not start — the buttons below run the
            same counter.
          </p>
        ) : null}
      </div>

      <div className="cozy-actions parts-3d-voice-row">
        <button
          type="button"
          onClick={cycleVoice}
          aria-label={`Customer voice mode: ${save.voiceMode}. Activate to change.`}
        >
          Voice: {save.voiceMode === "words" ? "human words" : save.voiceMode}
        </button>
      </div>

      <div className="counter-ticket" aria-live="polite">
        <p className="counter-who">
          {order.customer} · Slip #{order.slip}
        </p>
        <p className="counter-ask">
          &ldquo;I need {part.quantity === 1 ? "" : `${part.quantity} × `}
          {stockEntry(part.id).ask}.&rdquo;
        </p>
        {note ? <p className="counter-reply">{note}</p> : null}
      </div>

      {phase === "playing" ? (
        <>
          <div className="cozy-actions counter-shelf">
            {partsStock.map((entry) => {
              const isWanted = entry.id === wanted;
              return (
                <button
                  key={entry.id}
                  type="button"
                  className={isWanted && filled ? "is-on" : ""}
                  aria-pressed={isWanted && held > 0}
                  onClick={() => grabRef.current(entry.id)}
                >
                  {entry.label}
                  {isWanted ? (filled ? " ✓" : held ? " ✓" : "") : ""}
                </button>
              );
            })}
          </div>
          <div className="cozy-actions">
            <button type="button" disabled={!carried} onClick={() => deliverRef.current()}>
              Ring it up · {money(orderTotal(order))}
            </button>
          </div>
        </>
      ) : (
        <div className="parts-3d-shop">
          <h3>Closing time — spend your coins.</h3>
          <p className="parts-3d-shop-note">
            {servedThisDay} of {CUSTOMERS_PER_DAY} customers served. {save.coins} coins in the till.
          </p>
          <div className="cozy-actions">
            {upgrades.map((upgrade) => {
              const owned = save.owned.includes(upgrade.id);
              const affordable = canAfford(save.coins, upgrade.id, save.owned);
              return (
                <button
                  key={upgrade.id}
                  type="button"
                  className={owned ? "is-on" : ""}
                  disabled={owned || !affordable}
                  onClick={() => buy(upgrade.id)}
                >
                  {upgrade.label} · {upgrade.cost}¢{owned ? " ✓" : ""}
                </button>
              );
            })}
          </div>
          <div className="cozy-actions">
            <button type="button" onClick={openNextDay}>
              Open day {day + 1}
            </button>
          </div>
        </div>
      )}

      <p className="cozy-note">
        {servedThisDay === 0 && phase === "playing"
          ? "Quiet morning. The door will swing soon."
          : `${servedThisDay} served today · ${save.coins} coins · best streak ${save.best}.`}
      </p>
    </CozyShell>
  );
}
