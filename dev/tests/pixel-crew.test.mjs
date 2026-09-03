import assert from "node:assert/strict";
import test from "node:test";
import {
  PART_ICONS,
  PIXEL_CREW,
  PIXEL_GRID,
  RETRO_CREW,
  TIRE_BOTS,
} from "../../src/components/adgent/pixel-crew.ts";

const EMOTES = ["idle", "celebrate", "thinking", "happy", "sleep"];
const EYE_SIZES = ["small", "medium", "big"];
const MOUTHS = ["smile", "cat", "open"];

function makeMockCtx() {
  const fillRectCalls = [];
  return {
    fillStyle: "",
    font: "",
    save() {},
    restore() {},
    translate() {},
    rotate() {},
    beginPath() {},
    arc() {},
    fill() {},
    fillText() {},
    fillRect(x, y, w, h) {
      fillRectCalls.push({ x, y, w, h });
    },
    _fillRectCalls: fillRectCalls,
  };
}

test("PIXEL_CREW has exactly five characters", () => {
  assert.equal(PIXEL_CREW.length, 5);
});

test("every character has a unique id, name, blurb, persona, and draw function", () => {
  const ids = new Set();
  for (const char of PIXEL_CREW) {
    assert.equal(typeof char.id, "string");
    assert.ok(char.id.length > 0);
    assert.equal(typeof char.name, "string");
    assert.ok(char.name.length > 0);
    assert.equal(typeof char.blurb, "string");
    assert.ok(char.blurb.length > 0);
    assert.ok(char.persona.kind.length > 0, `${char.id} needs a persona.kind`);
    assert.ok(char.persona.self.length > 0, `${char.id} needs a persona.self`);
    assert.equal(typeof char.draw, "function");
    ids.add(char.id);
  }
  assert.equal(ids.size, PIXEL_CREW.length, "ids must be unique");
});

test("PIXEL_GRID is a usable positive integer", () => {
  assert.ok(Number.isInteger(PIXEL_GRID));
  assert.ok(PIXEL_GRID >= 16);
});

test("each character draws something for every emote at frame 0 without throwing", () => {
  for (const char of PIXEL_CREW) {
    for (const emote of EMOTES) {
      const ctx = makeMockCtx();
      char.draw(ctx, 0, emote);
      assert.ok(
        ctx._fillRectCalls.length > 0,
        `${char.id} drew nothing (fillRect count 0) for emote ${emote}`,
      );
    }
  }
});

test("every character renders cleanly for every eye-size and mouth-style combo", () => {
  // The Looks mode sliders need to be backed by real draw code — every
  // combination must produce pixels and not throw.
  for (const char of PIXEL_CREW) {
    for (const eyeSize of EYE_SIZES) {
      for (const mouth of MOUTHS) {
        const ctx = makeMockCtx();
        char.draw(ctx, 0, "idle", { eyeSize, mouth });
        assert.ok(
          ctx._fillRectCalls.length > 0,
          `${char.id} drew nothing for eyeSize=${eyeSize} mouth=${mouth}`,
        );
      }
    }
  }
});

test("different eye sizes produce different total pixel area for the same character", () => {
  // The look variations must actually change the picture: a bigger eye covers
  // more pixel-grid area than a smaller one, even though both are drawn with
  // the same number of fillRect calls.
  const char = PIXEL_CREW.find((c) => c.id === "tread");
  assert.ok(char, "tread character should exist");
  const small = makeMockCtx();
  const big = makeMockCtx();
  char.draw(small, 0, "idle", { eyeSize: "small", mouth: "smile" });
  char.draw(big, 0, "idle", { eyeSize: "big", mouth: "smile" });
  const areaOf = (ctx) => ctx._fillRectCalls.reduce((sum, call) => sum + call.w * call.h, 0);
  assert.notEqual(areaOf(small), areaOf(big));
});

test("different mouth styles produce different total pixel area for the same character", () => {
  const char = PIXEL_CREW.find((c) => c.id === "tread");
  assert.ok(char, "tread character should exist");
  const smile = makeMockCtx();
  const open = makeMockCtx();
  char.draw(smile, 0, "idle", { eyeSize: "medium", mouth: "smile" });
  char.draw(open, 0, "idle", { eyeSize: "medium", mouth: "open" });
  const areaOf = (ctx) => ctx._fillRectCalls.reduce((sum, call) => sum + call.w * call.h, 0);
  assert.notEqual(areaOf(smile), areaOf(open));
});

test("extra sets (RETRO_CREW, TIRE_BOTS, PART_ICONS) have unique ids and draw for every emote", () => {
  const sets = [RETRO_CREW, TIRE_BOTS, PART_ICONS];
  const ids = new Set();
  for (const crew of sets) {
    assert.ok(crew.length > 0);
    for (const char of crew) {
      ids.add(char.id);
      assert.ok(char.name.length > 0);
      assert.ok(char.blurb.length > 0);
      assert.ok(char.persona.kind.length > 0, `${char.id} needs a persona.kind`);
      assert.ok(char.persona.self.length > 0, `${char.id} needs a persona.self`);
      for (const emote of EMOTES) {
        const ctx = makeMockCtx();
        char.draw(ctx, 0, emote);
        assert.ok(
          ctx._fillRectCalls.length > 0,
          `${char.id} drew nothing (fillRect count 0) for emote ${emote}`,
        );
      }
    }
  }
  const total = sets.reduce((n, crew) => n + crew.length, 0);
  assert.equal(ids.size, total, "extra-set ids must be unique");
});

test("PART_ICONS stay faceless — a PixelLook must not change the picture", () => {
  // Icons have no eyes or mouth, so the studio's look controls are hidden for
  // the set; passing a look anyway must produce identical draw calls.
  for (const char of PART_ICONS) {
    const plain = makeMockCtx();
    const looked = makeMockCtx();
    char.draw(plain, 0, "idle");
    char.draw(looked, 0, "idle", { eyeSize: "big", mouth: "open" });
    assert.deepEqual(looked._fillRectCalls, plain._fillRectCalls, `${char.id} used the look`);
  }
});
