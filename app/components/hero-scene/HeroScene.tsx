"use client";

/**
 * 남한 지도 위에 다섯 사업장을 제자리에 두고, 각 사업장의 전력·연료·용수 데이터가
 * 지도 위에 떠 있는 하나의 통합 화면(원형 패널 링)으로 모이는 장면입니다.
 * 어두운 무대 위의 홀로그램처럼 그려, 무엇이 어디서 모이는지가 그림만으로 읽히게 합니다.
 *
 * 장식이 아니라 구현 증거로 두는 것이므로 규칙을 정해 두었습니다.
 *   - 색은 CSS 토큰(--scene-*)에서 읽습니다. 무대는 테마와 무관하게 어둡습니다.
 *   - glTF·이미지 같은 외부 자산을 두지 않습니다. 지도·아이콘·패널은 캔버스에 그려 텍스처로 쓰고,
 *     해안선은 좌표 배열입니다.
 *   - 패널에 적는 수치는 원장에서 props로 받습니다. 장면 안에 수치를 적어 두지 않습니다.
 *   - 화면 밖에 있으면 렌더 루프를 멈춥니다.
 */

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { PLANT_SITES, project } from "./geo";
import { ISLAND_DOTS, KOREA_RINGS } from "./korea-outline";

export type SceneMetric = { display: string; condition?: string };

/** 전력 · 연료 · 용수. 사업장마다 이 세 줄기가 링으로 흐릅니다. */
const STREAM_OFFSETS = [-0.1, 0, 0.1];
/** 한 줄기에 알갱이 두 개를 반 주기 간격으로 띄워, 흐름이 끊겨 보이지 않게 합니다. */
const PULSES_PER_STREAM = 2;

/** 통합 화면. 지도 북쪽 위 허공에 떠 있는 패널 링입니다. */
const RING = {
  center: new THREE.Vector3(0.2, 2.25, -2.8),
  radius: 3.0,
  /** 바닥 원반(데이터가 들어오는 자리)은 링 아래 모서리에 둡니다. */
  floorY: 1.78,
};

/*
 * 카메라가 바라보는 곳. 장면을 화면 오른쪽에 놓기 위해 실제 주제(x ≈ 0.2)보다
 * 왼쪽을 겨눕니다. 왼쪽 빈자리에는 글이 얹힙니다.
 */
const FOCUS = new THREE.Vector3(-2.6, 1.05, 0.45);

type Palette = {
  bg: string;
  glow: string;
  accent: string;
  text: string;
  muted: string;
  font: string;
};

function readPalette(): Palette {
  const style = getComputedStyle(document.documentElement);
  const token = (name: string, fallback: string) =>
    style.getPropertyValue(name).trim() || fallback;

  return {
    bg: token("--scene-bg", "#071021"),
    glow: token("--scene-glow", "#4fd8ff"),
    accent: token("--scene-accent", "#2f7de1"),
    text: token("--scene-text", "#e6f6ff"),
    muted: token("--scene-muted", "#8fb3cc"),
    // 글자는 본문 글꼴로 씁니다. 캔버스에 그리는 글자라 CSS가 닿지 않습니다.
    font: getComputedStyle(document.body).fontFamily || "sans-serif",
  };
}

/* ── 캔버스 도우미 ───────────────────────────────────────────── */

function rgba(hex: string, alpha: number) {
  const value = hex.replace("#", "");
  const full = value.length === 3 ? value.split("").map((c) => c + c).join("") : value;
  const n = parseInt(full, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

function makeCanvas(width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  return ctx ? { canvas, ctx } : null;
}

function toTexture(canvas: HTMLCanvasElement) {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  // 기울어진 면에 붙는 글자가 뭉개지지 않게 이방성 필터를 넉넉히 줍니다(three가 장치 최대치로 잘라 줍니다).
  texture.anisotropy = 16;
  return texture;
}

/** 네온 획. 흐린 획을 먼저 깔고 선명한 획을 겹쳐 빛나는 것처럼 보이게 합니다. */
function neonStroke(ctx: CanvasRenderingContext2D, color: string, width: number, blur: number) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.shadowColor = color;
  ctx.shadowBlur = blur;
  ctx.lineWidth = width * 2.2;
  ctx.globalAlpha = 0.35;
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.shadowBlur = blur * 0.5;
  ctx.lineWidth = width;
  ctx.stroke();
  ctx.restore();
}

function neonText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color: string,
  blur = 10,
) {
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = blur;
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
  ctx.restore();
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** 결정적 의사난수. 장식 차트가 렌더마다 달라지지 않게 합니다. */
function pseudoRandom(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

/* ── 지도 ────────────────────────────────────────────────────── */

type Site = { name: string; x: number; z: number; units: number };

const MAP_PADDING = 0.55;
const MAP_PX_PER_UNIT = 560;

/** 지도판의 범위(장면 좌표). 해안선·섬·이름표가 다 들어가게 여백을 둡니다. */
function mapBounds() {
  let xMin = Infinity;
  let xMax = -Infinity;
  let zMin = Infinity;
  let zMax = -Infinity;
  const include = (lon: number, lat: number) => {
    const { x, z } = project(lon, lat);
    xMin = Math.min(xMin, x);
    xMax = Math.max(xMax, x);
    zMin = Math.min(zMin, z);
    zMax = Math.max(zMax, z);
  };
  for (const ring of KOREA_RINGS) for (const [lon, lat] of ring) include(lon, lat);
  for (const island of ISLAND_DOTS) include(island.lon, island.lat);
  return {
    xMin: xMin - MAP_PADDING,
    xMax: xMax + MAP_PADDING,
    zMin: zMin - MAP_PADDING,
    zMax: zMax + MAP_PADDING,
  };
}

/** 공장 아이콘. 톱니 지붕 실루엣입니다. */
function factoryGlyph(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number) {
  const h = size * 0.62;
  const tooth = size / 3;
  const left = cx - size / 2;
  const top = cy - h / 2;
  ctx.beginPath();
  ctx.moveTo(left, cy + h / 2);
  ctx.lineTo(left, top + tooth * 0.45);
  for (let i = 0; i < 3; i += 1) {
    const x0 = left + i * tooth;
    ctx.lineTo(x0 + tooth, top);
    ctx.lineTo(x0 + tooth, top + tooth * 0.45);
  }
  ctx.lineTo(cx + size / 2, cy + h / 2);
  ctx.closePath();
  ctx.fill();
  // 굴뚝
  ctx.fillRect(left + tooth * 0.12, top - tooth * 0.5, tooth * 0.28, tooth * 0.9);
}

/**
 * 지도 한 장. 해안선·섬·공장 아이콘·이름표를 캔버스에 네온으로 그려 바닥에 깝니다.
 * 지오메트리로 만들면 글로우를 낼 수 없어, 지도는 그림으로 두고 흐름만 3D로 둡니다.
 */
function makeMapTexture(sites: Site[], palette: Palette) {
  const bounds = mapBounds();
  const width = Math.round((bounds.xMax - bounds.xMin) * MAP_PX_PER_UNIT);
  const height = Math.round((bounds.zMax - bounds.zMin) * MAP_PX_PER_UNIT);
  const made = makeCanvas(width, height);
  if (!made) return null;
  const { canvas, ctx } = made;
  const px = (x: number) => ((x - bounds.xMin) / (bounds.xMax - bounds.xMin)) * width;
  const py = (z: number) => ((z - bounds.zMin) / (bounds.zMax - bounds.zMin)) * height;
  const unit = MAP_PX_PER_UNIT;

  // 땅. 바다보다 살짝 밝은 남색 위에 네온 해안선
  const trace = (ring: readonly (readonly [number, number])[]) => {
    ring.forEach(([lon, lat], index) => {
      const { x, z } = project(lon, lat);
      if (index === 0) ctx.moveTo(px(x), py(z));
      else ctx.lineTo(px(x), py(z));
    });
    ctx.closePath();
  };
  ctx.beginPath();
  for (const ring of KOREA_RINGS) trace(ring);
  ctx.fillStyle = rgba(palette.glow, 0.16);
  ctx.fill();
  neonStroke(ctx, palette.glow, 4, 28);

  for (const island of ISLAND_DOTS) {
    const { x, z } = project(island.lon, island.lat);
    ctx.beginPath();
    ctx.arc(px(x), py(z), island.radius * unit, 0, Math.PI * 2);
    ctx.fillStyle = rgba(palette.glow, 0.1);
    ctx.fill();
    neonStroke(ctx, palette.glow, 3, 16);
  }

  // 사업장: 자리 고리, 아이콘, 이름표
  ctx.textBaseline = "middle";
  for (const site of sites) {
    const cx = px(site.x);
    const cy = py(site.z);
    const ringRadius = (site.units > 1 ? 0.36 : 0.28) * unit;
    ctx.beginPath();
    ctx.arc(cx, cy, ringRadius, 0, Math.PI * 2);
    ctx.fillStyle = rgba(palette.glow, 0.08);
    ctx.fill();
    neonStroke(ctx, palette.glow, 2, 14);

    ctx.save();
    ctx.fillStyle = palette.glow;
    ctx.shadowColor = palette.glow;
    ctx.shadowBlur = 22;
    const glyph = 0.22 * unit;
    for (let unitIndex = 0; unitIndex < site.units; unitIndex += 1) {
      factoryGlyph(ctx, cx + (unitIndex - (site.units - 1) / 2) * glyph * 1.15, cy, glyph);
    }
    ctx.restore();

    const label = PLANT_SITES[site.name]?.label ?? { side: "right" as const };
    ctx.font = `600 ${0.17 * unit}px ${palette.font}`;
    const gap = ringRadius + 0.06 * unit;
    if (label.side === "top") {
      ctx.textAlign = "center";
      neonText(ctx, site.name, cx, cy - gap - 0.06 * unit, palette.text, 12);
    } else {
      ctx.textAlign = label.side === "left" ? "right" : "left";
      const dx = label.side === "left" ? -gap : gap;
      neonText(ctx, site.name, cx + dx, cy + (label.dz ?? 0) * unit, palette.text, 12);
    }
  }

  return {
    texture: toTexture(canvas),
    width: bounds.xMax - bounds.xMin,
    height: bounds.zMax - bounds.zMin,
    centerX: (bounds.xMin + bounds.xMax) / 2,
    centerZ: (bounds.zMin + bounds.zMax) / 2,
  };
}

function GroundMap({ sites, palette }: { sites: Site[]; palette: Palette }) {
  const map = useMemo(() => makeMapTexture(sites, palette), [sites, palette]);
  useEffect(() => () => map?.texture.dispose(), [map]);
  if (!map) return null;
  return (
    <mesh position={[map.centerX, 0.004, map.centerZ]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[map.width, map.height]} />
      <meshBasicMaterial map={map.texture} transparent depthWrite={false} />
    </mesh>
  );
}

/* ── 통합 화면(패널 링) ──────────────────────────────────────── */

type PanelKind = "forecast" | "gauge" | "bars" | "lines" | "donut" | "table";

type PanelSpec = {
  kind: PanelKind;
  title: string;
  /** 링 위의 각도(도). 0이 카메라 쪽(+z)입니다. */
  angle: number;
  /** 패널이 차지하는 각도 폭(도) */
  span: number;
  height: number;
};

/*
 * 각도 폭은 호의 길이(반지름 × 각도)가 패널 그림의 가로세로비와 맞도록 정합니다.
 * 맞추지 않으면 패널 안의 글자와 차트가 가로로 늘어납니다.
 */
const PANELS: PanelSpec[] = [
  { kind: "forecast", title: "에너지 사용량 예측", angle: 0, span: 33, height: 0.95 },
  { kind: "gauge", title: "예측 오차", angle: 52, span: 28, height: 0.82 },
  { kind: "bars", title: "전력 · 연료 · 용수", angle: -52, span: 28, height: 0.82 },
  { kind: "lines", title: "공장별 원단위", angle: 104, span: 28, height: 0.82 },
  { kind: "donut", title: "설비별 사용 구성", angle: -104, span: 28, height: 0.82 },
  { kind: "table", title: "일일 점검", angle: 180, span: 30, height: 0.82 },
];

/** 패널을 그리는 좌표계. 아래 SCALE만큼 키운 캔버스에 같은 그림을 찍어 글자를 선명하게 만듭니다. */
const PANEL_DESIGN = { width: 720, height: 400 };
const PANEL_SCALE = 2.4;
const PANEL_PX = {
  width: Math.round(PANEL_DESIGN.width * PANEL_SCALE),
  height: Math.round(PANEL_DESIGN.height * PANEL_SCALE),
};

function drawPanelFrame(ctx: CanvasRenderingContext2D, palette: Palette, title: string) {
  const { width, height } = PANEL_DESIGN;
  // 설계 좌표로 그리고 캔버스 배율만 올립니다. 글자 크기를 일일이 고칠 필요가 없습니다.
  ctx.setTransform(PANEL_SCALE, 0, 0, PANEL_SCALE, 0, 0);
  ctx.clearRect(0, 0, width, height);
  roundedRect(ctx, 6, 6, width - 12, height - 12, 18);
  ctx.fillStyle = rgba(palette.bg, 0.72);
  ctx.fill();
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, rgba(palette.glow, 0.14));
  gradient.addColorStop(1, rgba(palette.accent, 0.06));
  ctx.fillStyle = gradient;
  ctx.fill();
  neonStroke(ctx, palette.glow, 2.5, 18);

  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  ctx.font = `600 32px ${palette.font}`;
  neonText(ctx, title, 30, 42, palette.text, 8);
  ctx.fillStyle = rgba(palette.glow, 0.35);
  ctx.fillRect(30, 68, width - 60, 1.5);
}

const PANEL_BODY = { x: 34, y: 84, w: PANEL_DESIGN.width - 68, h: PANEL_DESIGN.height - 112 };

function drawForecast(ctx: CanvasRenderingContext2D, palette: Palette, time: number) {
  const { x, y, w, h } = PANEL_BODY;
  // 눈금
  ctx.strokeStyle = rgba(palette.glow, 0.18);
  ctx.lineWidth = 1;
  for (let i = 0; i <= 3; i += 1) {
    const gy = y + (h / 3) * i;
    ctx.beginPath();
    ctx.moveTo(x, gy);
    ctx.lineTo(x + w, gy);
    ctx.stroke();
  }
  const SAMPLES = 60;
  const mid = y + h * 0.52;
  const centre = (u: number) =>
    mid - (Math.sin(u * 5.2 - time) * 0.22 + Math.sin(u * 2.1 - time * 0.7) * 0.12) * h;
  const spread = (u: number) => (0.11 + Math.sin(u * 3.1 + time * 0.5) * 0.035) * h;

  // 예측 구간(P05~P95)
  ctx.beginPath();
  for (let i = 0; i <= SAMPLES; i += 1) {
    const u = i / SAMPLES;
    ctx.lineTo(x + u * w, centre(u) - spread(u));
  }
  for (let i = SAMPLES; i >= 0; i -= 1) {
    const u = i / SAMPLES;
    ctx.lineTo(x + u * w, centre(u) + spread(u));
  }
  ctx.closePath();
  ctx.fillStyle = rgba(palette.glow, 0.22);
  ctx.fill();

  // 실측선
  ctx.beginPath();
  for (let i = 0; i <= SAMPLES; i += 1) {
    const u = i / SAMPLES;
    ctx.lineTo(x + u * w, centre(u) + Math.sin(u * 9.3 - time * 1.6) * 0.045 * h);
  }
  neonStroke(ctx, palette.glow, 3, 14);

  ctx.font = `500 19px ${palette.font}`;
  ctx.textAlign = "right";
  ctx.fillStyle = palette.muted;
  ctx.fillText("실측 ─   예측 구간 P05~P95 ▬", x + w, y + h + 16);
  ctx.textAlign = "left";
}

function drawGauge(ctx: CanvasRenderingContext2D, palette: Palette, metric?: SceneMetric) {
  const { x, y, w, h } = PANEL_BODY;
  const cx = x + w * 0.3;
  const cy = y + h * 0.55;
  const r = h * 0.42;
  ctx.beginPath();
  ctx.arc(cx, cy, r, Math.PI * 0.75, Math.PI * 2.25);
  ctx.strokeStyle = rgba(palette.glow, 0.18);
  ctx.lineWidth = 14;
  ctx.lineCap = "round";
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, r, Math.PI * 0.75, Math.PI * 1.05);
  neonStroke(ctx, palette.glow, 14, 18);

  ctx.textAlign = "left";
  ctx.font = `700 40px ${palette.font}`;
  neonText(ctx, metric?.display ?? "—", x + w * 0.56, cy - 14, palette.text, 10);
  ctx.font = `500 18px ${palette.font}`;
  ctx.fillStyle = palette.muted;
  const condition = metric?.condition ?? "";
  // 조건은 두 줄까지 접습니다.
  const words = condition.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (ctx.measureText(next).width > w * 0.42 && current) {
      lines.push(current);
      current = word;
    } else current = next;
  }
  if (current) lines.push(current);
  lines.slice(0, 2).forEach((line, index) => {
    ctx.fillText(line, x + w * 0.56, cy + 22 + index * 24);
  });
}

function drawBars(ctx: CanvasRenderingContext2D, palette: Palette) {
  const { x, y, w, h } = PANEL_BODY;
  const random = pseudoRandom(7);
  const groups = 5;
  const groupWidth = w / groups;
  for (let g = 0; g < groups; g += 1) {
    for (let k = 0; k < 3; k += 1) {
      const value = 0.35 + random() * 0.55;
      const barWidth = groupWidth * 0.2;
      const bx = x + g * groupWidth + groupWidth * 0.14 + k * barWidth * 1.15;
      const barHeight = value * (h - 20);
      ctx.fillStyle = rgba(palette.glow, 0.28 + k * 0.22);
      ctx.shadowColor = palette.glow;
      ctx.shadowBlur = 10;
      ctx.fillRect(bx, y + h - barHeight, barWidth, barHeight);
      ctx.shadowBlur = 0;
    }
  }
  ctx.fillStyle = rgba(palette.glow, 0.4);
  ctx.fillRect(x, y + h, w, 1.5);
}

function drawLines(ctx: CanvasRenderingContext2D, palette: Palette) {
  const { x, y, w, h } = PANEL_BODY;
  const random = pseudoRandom(3);
  ctx.strokeStyle = rgba(palette.glow, 0.18);
  ctx.lineWidth = 1;
  for (let i = 0; i <= 3; i += 1) {
    ctx.beginPath();
    ctx.moveTo(x, y + (h / 3) * i);
    ctx.lineTo(x + w, y + (h / 3) * i);
    ctx.stroke();
  }
  for (let series = 0; series < 3; series += 1) {
    ctx.beginPath();
    let level = 0.3 + random() * 0.4;
    for (let i = 0; i <= 14; i += 1) {
      level = Math.min(0.9, Math.max(0.1, level + (random() - 0.5) * 0.25));
      ctx.lineTo(x + (i / 14) * w, y + h - level * h);
    }
    neonStroke(ctx, series === 0 ? palette.glow : palette.accent, 2.5, 10);
  }
}

function drawDonut(ctx: CanvasRenderingContext2D, palette: Palette) {
  const { x, y, w, h } = PANEL_BODY;
  const cx = x + w * 0.3;
  const cy = y + h * 0.52;
  const r = h * 0.4;
  const parts = [0.42, 0.33, 0.25];
  let start = -Math.PI / 2;
  parts.forEach((part, index) => {
    ctx.beginPath();
    ctx.arc(cx, cy, r, start + 0.04, start + part * Math.PI * 2 - 0.04);
    ctx.lineWidth = 16;
    ctx.strokeStyle = rgba(palette.glow, 0.9 - index * 0.3);
    ctx.shadowColor = palette.glow;
    ctx.shadowBlur = 12;
    ctx.stroke();
    ctx.shadowBlur = 0;
    start += part * Math.PI * 2;
  });
  for (let i = 0; i < 3; i += 1) {
    ctx.fillStyle = rgba(palette.glow, 0.9 - i * 0.3);
    ctx.fillRect(x + w * 0.6, y + 30 + i * 46, 14, 14);
    ctx.fillStyle = rgba(palette.glow, 0.3);
    ctx.fillRect(x + w * 0.6 + 26, y + 34 + i * 46, w * 0.3 - (i * w) / 14, 6);
  }
}

function drawTable(ctx: CanvasRenderingContext2D, palette: Palette) {
  const { x, y, w, h } = PANEL_BODY;
  const random = pseudoRandom(11);
  const rows = 5;
  for (let i = 0; i < rows; i += 1) {
    const ry = y + 12 + (i * (h - 12)) / rows;
    ctx.fillStyle = rgba(palette.glow, 0.2 + random() * 0.3);
    ctx.beginPath();
    ctx.arc(x + 12, ry + 10, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = rgba(palette.glow, 0.28);
    ctx.fillRect(x + 36, ry + 6, w * (0.25 + random() * 0.3), 8);
    ctx.fillStyle = rgba(palette.glow, 0.16);
    ctx.fillRect(x + w * 0.7, ry + 6, w * 0.3 * random(), 8);
    ctx.fillStyle = rgba(palette.glow, 0.12);
    ctx.fillRect(x, ry + 28, w, 1);
  }
}

function drawPanel(
  ctx: CanvasRenderingContext2D,
  spec: PanelSpec,
  palette: Palette,
  time: number,
  metric?: SceneMetric,
) {
  drawPanelFrame(ctx, palette, spec.title);
  switch (spec.kind) {
    case "forecast":
      drawForecast(ctx, palette, time);
      break;
    case "gauge":
      drawGauge(ctx, palette, metric);
      break;
    case "bars":
      drawBars(ctx, palette);
      break;
    case "lines":
      drawLines(ctx, palette);
      break;
    case "donut":
      drawDonut(ctx, palette);
      break;
    case "table":
      drawTable(ctx, palette);
      break;
  }
}

/** 링 위의 굽은 패널 한 장. 예측 패널은 매 몇 프레임마다 다시 그려 띠가 흐릅니다. */
function RingPanel({
  spec,
  palette,
  metric,
}: {
  spec: PanelSpec;
  palette: Palette;
  metric?: SceneMetric;
}) {
  const made = useMemo(() => {
    const canvas = makeCanvas(PANEL_PX.width, PANEL_PX.height);
    if (!canvas) return null;
    drawPanel(canvas.ctx, spec, palette, 0, metric);
    const texture = toTexture(canvas.canvas);
    // 카메라 반대편 패널은 안쪽 면이 보이므로 그림을 좌우로 뒤집어 글자가 바로 읽히게 합니다.
    const inside = Math.abs(spec.angle) > 90;
    texture.wrapS = THREE.RepeatWrapping;
    texture.repeat.x = inside ? -1 : 1;
    texture.offset.x = inside ? 1 : 0;
    return { ...canvas, texture };
  }, [spec, palette, metric]);
  useEffect(() => () => made?.texture.dispose(), [made]);

  // 매 프레임 다시 그리는 캔버스는 ref로 잡습니다. 렌더 결과를 콜백에서 고치지 않기 위해서입니다.
  const live = useRef<typeof made>(null);
  useEffect(() => {
    live.current = made;
  }, [made]);
  const frames = useRef(0);
  useFrame(({ clock }) => {
    const target = live.current;
    if (!target || spec.kind !== "forecast") return;
    frames.current += 1;
    if (frames.current % 3 !== 0) return;
    drawPanel(target.ctx, spec, palette, clock.elapsedTime * 0.45, metric);
    target.texture.needsUpdate = true;
  });

  if (!made) return null;
  const theta = THREE.MathUtils.degToRad(spec.span);
  const start = THREE.MathUtils.degToRad(spec.angle) - theta / 2;
  return (
    <mesh position={RING.center}>
      <cylinderGeometry args={[RING.radius, RING.radius, spec.height, 24, 1, true, start, theta]} />
      <meshBasicMaterial
        map={made.texture}
        transparent
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}

/** 링 바닥의 동심원 원반. 데이터가 들어오는 자리입니다. */
function makeFloorTexture(palette: Palette) {
  const size = 768;
  const made = makeCanvas(size, size);
  if (!made) return null;
  const { canvas, ctx } = made;
  const c = size / 2;
  const glow = ctx.createRadialGradient(c, c, 0, c, c, c);
  glow.addColorStop(0, rgba(palette.glow, 0.28));
  glow.addColorStop(0.45, rgba(palette.glow, 0.08));
  glow.addColorStop(1, rgba(palette.glow, 0));
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, size, size);
  for (const [radius, width] of [
    [0.96, 3],
    [0.8, 1.5],
    [0.62, 2],
  ]) {
    ctx.beginPath();
    ctx.arc(c, c, radius * c * 0.98, 0, Math.PI * 2);
    neonStroke(ctx, palette.glow, width, 14);
  }
  // 눈금
  ctx.strokeStyle = rgba(palette.glow, 0.5);
  ctx.lineWidth = 2;
  for (let i = 0; i < 48; i += 1) {
    const a = (i / 48) * Math.PI * 2;
    const inner = 0.88 * c;
    const outer = (i % 4 === 0 ? 0.94 : 0.91) * c;
    ctx.beginPath();
    ctx.moveTo(c + Math.cos(a) * inner, c + Math.sin(a) * inner);
    ctx.lineTo(c + Math.cos(a) * outer, c + Math.sin(a) * outer);
    ctx.stroke();
  }
  return toTexture(canvas);
}

function RingFloor({ palette }: { palette: Palette }) {
  const texture = useMemo(() => makeFloorTexture(palette), [palette]);
  useEffect(() => () => texture?.dispose(), [texture]);
  const core = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!core.current) return;
    core.current.children[0].rotation.z = clock.elapsedTime * 0.35;
    core.current.children[1].rotation.z = -clock.elapsedTime * 0.22;
  });
  if (!texture) return null;
  const size = RING.radius * 1.2;
  return (
    <group position={[RING.center.x, RING.floorY, RING.center.z]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[size, size]} />
        <meshBasicMaterial map={texture} transparent depthWrite={false} />
      </mesh>
      {/* 가운데 도는 고리 두 개 */}
      <group ref={core} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <mesh>
          <ringGeometry args={[0.46, 0.5, 48, 1, 0, Math.PI * 1.6]} />
          <meshBasicMaterial
            color={palette.glow}
            transparent
            opacity={0.9}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
        <mesh>
          <ringGeometry args={[0.3, 0.33, 48, 1, 0, Math.PI * 1.3]} />
          <meshBasicMaterial
            color={palette.glow}
            transparent
            opacity={0.7}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      </group>
    </group>
  );
}

/* ── 데이터 흐름 ─────────────────────────────────────────────── */

/** 사업장에서 링 바닥 가운데로 솟아오르는 곡선. 사업장마다 세 줄기입니다. */
function buildStreams(sites: Site[]) {
  const target = new THREE.Vector3(RING.center.x, RING.floorY, RING.center.z);
  return sites.flatMap((site) =>
    STREAM_OFFSETS.map((offset) => {
      const start = new THREE.Vector3(site.x + offset * 0.5, 0.02, site.z + offset);
      const end = target.clone().add(new THREE.Vector3(offset * 0.8, 0, offset * 0.4));
      // 공장에서 곧게 솟아오른 뒤 바깥에서 링 안으로 휘어 들어갑니다. 분수를 거꾸로 돌린 모양입니다.
      const outward = new THREE.Vector3(start.x - target.x, 0, start.z - target.z).normalize();
      const lift = start.clone().add(new THREE.Vector3(0, 1.25, 0)).add(outward.clone().multiplyScalar(0.25));
      const settle = end.clone().add(outward.multiplyScalar(0.95)).add(new THREE.Vector3(0, 0.4, 0));
      return new THREE.CatmullRomCurve3([start, lift, settle, end], false, "centripetal");
    }),
  );
}

/** 줄기의 길. 알갱이만 띄우면 어디로 가는지 읽히지 않아, 옅은 선으로 길을 깔아 둡니다. */
function StreamPaths({ curves, palette }: { curves: THREE.CatmullRomCurve3[]; palette: Palette }) {
  const geometry = useMemo(() => {
    const SEGMENTS = 40;
    const points: number[] = [];
    for (const curve of curves) {
      const samples = curve.getPoints(SEGMENTS);
      for (let i = 0; i < samples.length - 1; i += 1) {
        const a = samples[i];
        const b = samples[i + 1];
        points.push(a.x, a.y, a.z, b.x, b.y, b.z);
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
    return geometry;
  }, [curves]);
  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial
        color={palette.glow}
        transparent
        opacity={0.4}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </lineSegments>
  );
}

/** 부드러운 빛 알갱이 스프라이트 */
function makeGlowTexture() {
  const size = 96;
  const made = makeCanvas(size, size);
  if (!made) return null;
  const { canvas, ctx } = made;
  const c = size / 2;
  const gradient = ctx.createRadialGradient(c, c, 0, c, c, c);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.25, "rgba(255,255,255,0.85)");
  gradient.addColorStop(0.6, "rgba(255,255,255,0.18)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/** 길 위를 지나는 데이터 알갱이. 점 하나짜리 Points라 draw call 한 번입니다. */
function DataPulses({ curves, palette }: { curves: THREE.CatmullRomCurve3[]; palette: Palette }) {
  const pulseCount = curves.length * PULSES_PER_STREAM;
  const geometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const attribute = new THREE.BufferAttribute(new Float32Array(pulseCount * 3), 3);
    attribute.setUsage(THREE.DynamicDrawUsage);
    geometry.setAttribute("position", attribute);
    return geometry;
  }, [pulseCount]);
  const sprite = useMemo(() => makeGlowTexture(), []);
  useEffect(
    () => () => {
      geometry.dispose();
      sprite?.dispose();
    },
    [geometry, sprite],
  );
  const scratch = useMemo(() => new THREE.Vector3(), []);

  useFrame(({ clock }) => {
    const position = geometry.getAttribute("position") as THREE.BufferAttribute;
    for (let index = 0; index < pulseCount; index += 1) {
      const curveIndex = index % curves.length;
      const pulse = Math.floor(index / curves.length);
      const stream = curveIndex % STREAM_OFFSETS.length;
      const site = Math.floor(curveIndex / STREAM_OFFSETS.length);
      /*
       * 위상: 같은 줄기의 두 알갱이는 반 주기, 같은 사업장의 세 줄기는 1/6 주기씩 떨어뜨리고,
       * 사업장끼리는 황금비로 흩어 놓습니다. 그래야 알갱이가 뭉쳐 다니지 않습니다.
       */
      const phase =
        pulse / PULSES_PER_STREAM +
        stream / (STREAM_OFFSETS.length * PULSES_PER_STREAM) +
        site * 0.618;
      const t = (clock.elapsedTime * 0.13 + phase) % 1;
      curves[curveIndex].getPointAt(t, scratch);
      position.setXYZ(index, scratch.x, scratch.y, scratch.z);
    }
    position.needsUpdate = true;
  });

  if (!sprite) return null;
  return (
    <points geometry={geometry}>
      <pointsMaterial
        map={sprite}
        color={palette.glow}
        size={0.3}
        sizeAttenuation
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/** 링 가운데의 빛. 데이터가 모이는 곳이라는 표시입니다. */
function CoreGlow({ palette }: { palette: Palette }) {
  const texture = useMemo(() => makeGlowTexture(), []);
  useEffect(() => () => texture?.dispose(), [texture]);
  if (!texture) return null;
  return (
    <sprite position={[RING.center.x, RING.floorY + 0.12, RING.center.z]} scale={[1.6, 1.6, 1]}>
      <spriteMaterial
        map={texture}
        color={palette.glow}
        transparent
        opacity={0.55}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </sprite>
  );
}

/* ── 계측·시차·조립 ──────────────────────────────────────────── */

/**
 * 장면의 실제 비용을 재서 남깁니다. 포스터 생성 스크립트가 읽어 가고,
 * 경험 카드에 적는 삼각형 수·draw call 수의 근거가 됩니다.
 */
function SceneStats() {
  const { gl, scene } = useThree();
  const frames = useRef(0);

  useFrame(() => {
    frames.current += 1;
    const store = window as Window & { __heroSceneStats?: { frames?: number } };
    if (store.__heroSceneStats) store.__heroSceneStats.frames = frames.current;

    // 첫 프레임에는 draw call이 아직 0이라, 몇 프레임 돌린 뒤에 잽니다.
    if (frames.current !== 5) return;

    let triangles = 0;
    let meshes = 0;
    scene.traverse((object) => {
      const mesh = object as THREE.Mesh & { isInstancedMesh?: boolean; count?: number };
      const geometry = mesh.geometry as THREE.BufferGeometry | undefined;
      if (!geometry?.attributes?.position) return;
      meshes += 1;
      const faces = geometry.index
        ? geometry.index.count / 3
        : geometry.attributes.position.count / 3;
      triangles += faces * (mesh.isInstancedMesh ? (mesh.count ?? 1) : 1);
    });

    (window as Window & { __heroSceneStats?: unknown }).__heroSceneStats = {
      triangles: Math.round(triangles),
      meshes,
      drawCalls: gl.info.render.calls,
      frames: frames.current,
    };
  });

  return null;
}

export default function HeroScene({
  plants,
  active,
  metric,
}: {
  plants: string[];
  active: boolean;
  /** 패널에 적을 예측 오차. 원장에서 옵니다. */
  metric?: SceneMetric;
}) {
  /*
   * 이 컴포넌트는 브라우저에서만 불러오므로 첫 렌더에서 바로 토큰을 읽습니다.
   * effect에서 setState로 채우면 렌더가 한 번 더 돌고, 그 사이에 색 없는 장면이 그려집니다.
   */
  const [palette, setPalette] = useState<Palette>(readPalette);

  // 테마가 바뀌면 토큰을 다시 읽고, 웹폰트가 늦게 오면 글자를 다시 그립니다.
  useEffect(() => {
    const update = () => setPalette(readPalette());
    const media = window.matchMedia?.("(prefers-color-scheme: dark)");
    media?.addEventListener("change", update);
    if (document.fonts && document.fonts.status !== "loaded") {
      document.fonts.ready.then(update).catch(() => {});
    }
    return () => media?.removeEventListener("change", update);
  }, []);

  /** 원장의 이름을 좌표표에서 찾습니다. 좌표가 없는 이름은 테스트가 막으므로 여기서는 건너뜁니다. */
  const sites = useMemo<Site[]>(
    () =>
      plants
        .filter((name) => PLANT_SITES[name])
        .map((name) => {
          const site = PLANT_SITES[name];
          const { x, z } = project(site.lon, site.lat);
          return { name, x, z, units: site.units };
        }),
    [plants],
  );
  const curves = useMemo(() => buildStreams(sites), [sites]);

  return (
    <Canvas
      camera={{ position: [0.2, 4.63, 9.71], fov: 30 }}
      /* 화면 밖에서는 루프를 재웁니다. 마지막 프레임은 캔버스에 그대로 남습니다. */
      frameloop={active ? "always" : "never"}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
      /* 톤 매핑을 끕니다. 켜 두면 토큰의 색이 다른 색으로 바뀝니다. */
      flat
      style={{ width: "100%", height: "100%" }}
      aria-hidden="true"
      onCreated={({ camera }) => camera.lookAt(FOCUS)}
    >
      <SceneStats />
      <group>
        <GroundMap sites={sites} palette={palette} />
        <StreamPaths curves={curves} palette={palette} />
        <DataPulses curves={curves} palette={palette} />
        <RingFloor palette={palette} />
        <CoreGlow palette={palette} />
        {PANELS.map((spec) => (
          <RingPanel key={spec.kind} spec={spec} palette={palette} metric={metric} />
        ))}
      </group>
    </Canvas>
  );
}
