"use client";

/**
 * The pixel-crew mascot scene: a 2D canvas renderer for any character in
 * src/components/agent/pixel-crew.ts (Sparky today). Same contract as the 3D
 * tire scene — emote props play once, everything runs on refs and one rAF
 * loop — but the frames come from the 32×32 pixel grid, drawn crisp.
 */
import { type JSX, useEffect, useRef } from "react";
import { PIXEL_CREW, PIXEL_GRID, type PixelEmote } from "@/components/agent/pixel-crew";

export type TirePalEmote = {
  kind: "celebrate" | "thinking" | "happy" | "sleep";
  id: number;
} | null;

type PixelMascotSceneProps = {
  emote: TirePalEmote;
  reducedMotion: boolean;
  onFail?: () => void;
  className?: string;
  /** Which pixel-crew character to draw. Defaults to Sparky. */
  characterId?: string;
};

// The widget's emote kinds map 1:1 onto the pixel crew's emote names.
const EMOTES: Record<NonNullable<TirePalEmote>["kind"], PixelEmote> = {
  celebrate: "celebrate",
  thinking: "thinking",
  happy: "happy",
  sleep: "sleep",
};

export default function PixelMascotScene({
  emote,
  reducedMotion,
  className,
  characterId = "sparky",
}: PixelMascotSceneProps): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // The loop reads the latest props through refs so it never re-subscribes.
  const emoteRef = useRef<TirePalEmote>(emote);
  useEffect(() => {
    emoteRef.current = emote;
  }, [emote]);
  const reducedRef = useRef(reducedMotion);
  useEffect(() => {
    reducedRef.current = reducedMotion;
  }, [reducedMotion]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const character = PIXEL_CREW.find((c) => c.id === characterId);
    if (!canvas || !character) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let frame = 0;
    let raf = 0;

    function draw() {
      const el = emoteRef.current;
      // A new emote id plays once; between emotes the character idles.
      const emoteName: PixelEmote = el ? EMOTES[el.kind] : "idle";
      const w = canvas!.width;
      ctx!.imageSmoothingEnabled = false;
      ctx!.clearRect(0, 0, w, w);
      ctx!.save();
      ctx!.translate(w / 2, w / 2);
      const scale = w / PIXEL_GRID;
      ctx!.scale(scale, scale);
      ctx!.translate(-PIXEL_GRID / 2, -PIXEL_GRID / 2);
      character!.draw(ctx!, frame, emoteName);
      ctx!.restore();
    }

    if (reducedMotion) {
      // One honest still frame: no loop, but emote changes repaint once.
      draw();
      return () => {};
    }

    const tick = () => {
      frame += 1;
      draw();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // characterId is fixed per mount; emote/reducedMotion ride the refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [characterId]);

  return (
    <canvas ref={canvasRef} width={256} height={256} className={className} aria-hidden="true" />
  );
}
