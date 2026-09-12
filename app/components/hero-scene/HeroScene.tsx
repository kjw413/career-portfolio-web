"use client";

/**
 * 남한 지도 위에 다섯 사업장을 제자리에 세우고, 각 사업장의 전력·연료·용수 데이터가
 * 하나의 화면(BEMS)으로 모이는 장면입니다. 화면에는 실측과 예측 구간이 흐릅니다.
 * 사내 BEMS가 다루는 것을 지도 위에 도식화한 것이라, 그림만 보고도 무슨 일을 했는지
 * 읽히는 것을 목표로 합니다.
 *
 * 장식이 아니라 구현 증거로 두는 것이므로 규칙을 정해 두었습니다.
 *   - 색은 CSS 토큰에서 읽습니다. 다크 모드에서 장면만 따로 놀지 않게 합니다.
 *   - glTF 같은 외부 자산을 두지 않고 지오메트리를 코드로 만듭니다. 해안선도 좌표 배열입니다.
 *   - 공장 이름은 원장에서 받고, 위치는 geo.ts의 좌표표에서 찾습니다.
 *   - 화면 밖에 있으면 렌더 루프를 멈춥니다.
 */

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { PLANT_SITES, project } from "./geo";
import { ISLAND_DOTS, KOREA_RINGS } from "./korea-outline";

/** 지도판 두께. 공장과 이름표는 이 위에 올라갑니다. */
const PLATE_DEPTH = 0.1;
/** 전력 · 연료 · 용수. 사업장마다 이 세 줄기가 화면으로 흐릅니다. */
const STREAM_OFFSETS = [-0.09, 0, 0.09];
/** 한 줄기에 알갱이 두 개를 반 주기 간격으로 띄워, 흐름이 끊겨 보이지 않게 합니다. */
const PULSES_PER_STREAM = 2;

/**
 * 데이터가 모이는 화면. 서해 위에 세워 두고 아래 모서리로 데이터를 받습니다.
 * 지도 뒤(북쪽)에 두면 줄기가 화면에서 수직선으로 보여 흐름이 읽히지 않습니다.
 */
const PANEL = {
  position: new THREE.Vector3(-2.8, 1.85, -0.4),
  width: 3.5,
  height: 1.85,
  /** 뒤로 눕히고 지도 쪽으로 돌려 카메라를 향하게 합니다. */
  tilt: -0.3,
  yaw: 0.42,
};

/** 카메라가 바라보는 곳. 지도와 화면 사이를 봅니다. */
const FOCUS = new THREE.Vector3(-0.3, 0.7, 0.35);

type Palette = {
  line: string;
  blue: string;
  cyan: string;
  ink: string;
  surface: string;
  muted: string;
  font: string;
};

function readPalette(): Palette {
  const style = getComputedStyle(document.documentElement);
  const token = (name: string, fallback: string) =>
    style.getPropertyValue(name).trim() || fallback;

  return {
    line: token("--line", "#dce5f0"),
    blue: token("--blue", "#1d5fd0"),
    cyan: token("--cyan", "#38bdf8"),
    ink: token("--ink", "#0f172a"),
    surface: token("--surface", "#ffffff"),
    muted: token("--muted", "#55637a"),
    // 이름표 글꼴은 본문과 같게 합니다. 캔버스에 그리는 글자라 CSS가 닿지 않습니다.
    font: getComputedStyle(document.body).fontFamily || "sans-serif",
  };
}

/** 화면의 로컬 좌표를 장면 좌표로 바꿉니다. 데이터 줄기의 끝점을 정할 때 씁니다. */
function panelToWorld(local: THREE.Vector3): THREE.Vector3 {
  const frame = new THREE.Object3D();
  frame.position.copy(PANEL.position);
  // 먼저 제 축으로 눕힌 뒤 돌립니다(YXZ). 반대로 하면 기울기가 세계 축을 따라가 비뚤어집니다.
  frame.rotation.set(PANEL.tilt, PANEL.yaw, 0, "YXZ");
  frame.updateMatrixWorld();
  return frame.localToWorld(local.clone());
}

/**
 * 데이터가 화면으로 들어가는 자리(화면 로컬 좌표). 화면은 지도 서쪽에 있으므로 줄기는
 * 오른쪽 모서리 한 점으로 모입니다. 다섯 곳에서 한 곳으로 모이는 것이 이 장면의 요지라,
 * 자리를 사업장마다 나누지 않습니다.
 */
const INLET = new THREE.Vector3(PANEL.width / 2 + 0.06, -0.2, 0.06);

/* ── 캔버스 글자 ─────────────────────────────────────────────── */

const LABEL_DPR = 2;

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

/** 이름표 한 장. 반투명 알약 위에 글자를 올려 해안선 위에서도 읽히게 합니다. */
function makeLabelTexture(text: string, palette: Palette) {
  const FONT_PX = 13;
  const HEIGHT_PX = 28;
  const PAD_PX = 9;
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const font = `600 ${FONT_PX * LABEL_DPR}px ${palette.font}`;
  ctx.font = font;
  const width = Math.ceil(ctx.measureText(text).width + PAD_PX * 2 * LABEL_DPR);
  const height = HEIGHT_PX * LABEL_DPR;
  canvas.width = width;
  canvas.height = height;

  ctx.font = font;
  ctx.globalAlpha = 0.94;
  ctx.fillStyle = palette.surface;
  roundedRect(ctx, 1, 1, width - 2, height - 2, height / 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.lineWidth = LABEL_DPR;
  ctx.strokeStyle = palette.line;
  ctx.stroke();
  ctx.fillStyle = palette.ink;
  ctx.textBaseline = "middle";
  ctx.fillText(text, PAD_PX * LABEL_DPR, height / 2 + LABEL_DPR);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  return { texture, aspect: width / height };
}

/**
 * 화면 앞면 한 장. 제목은 왼쪽 위에, 범례는 오른쪽 아래에 그리고 가운데는 비워 둡니다.
 * 비운 자리에는 매 프레임 움직이는 차트 지오메트리가 올라갑니다.
 */
function makePanelTexture(palette: Palette) {
  const PX_PER_UNIT = 200 * LABEL_DPR;
  const width = Math.round(PANEL.width * PX_PER_UNIT);
  const height = Math.round(PANEL.height * PX_PER_UNIT);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  canvas.width = width;
  canvas.height = height;

  const px = (n: number) => n * LABEL_DPR;
  const pad = px(22);

  ctx.textBaseline = "top";
  ctx.font = `700 ${px(26)}px ${palette.font}`;
  ctx.fillStyle = palette.ink;
  ctx.fillText("5개 공장 에너지 사용량 예측", pad, pad);

  // 범례는 제목 아래 둘째 줄. 줄기가 들어오는 자리와 겹치지 않는 곳입니다.
  ctx.textBaseline = "middle";
  ctx.font = `500 ${px(19)}px ${palette.font}`;
  const legendY = pad + px(26) + px(26);
  let cursor = pad;
  const item = (label: string, swatchWidth: number, draw: (x: number) => void) => {
    draw(cursor);
    cursor += swatchWidth + px(8);
    ctx.fillStyle = palette.muted;
    ctx.fillText(label, cursor, legendY);
    cursor += ctx.measureText(label).width + px(22);
  };
  item("실측", px(28), (x) => {
    ctx.strokeStyle = palette.blue;
    ctx.lineWidth = px(2.5);
    ctx.beginPath();
    ctx.moveTo(x, legendY);
    ctx.lineTo(x + px(28), legendY);
    ctx.stroke();
  });
  item("예측 구간 P05~P95", px(28), (x) => {
    ctx.globalAlpha = 0.32;
    ctx.fillStyle = palette.blue;
    ctx.fillRect(x, legendY - px(8), px(28), px(16));
    ctx.globalAlpha = 1;
  });

  // 범례 아래 구분선
  ctx.fillStyle = palette.line;
  ctx.fillRect(pad, legendY + px(22), width - pad * 2, px(1.5));

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  return texture;
}

/* ── 지도 ────────────────────────────────────────────────────── */

function Ground({ palette }: { palette: Palette }) {
  const grid = useMemo(() => {
    const helper = new THREE.GridHelper(18, 30, palette.line, palette.line);
    const material = helper.material as THREE.Material;
    material.transparent = true;
    material.opacity = 0.45;
    return helper;
  }, [palette.line]);

  useEffect(() => () => grid.dispose(), [grid]);
  return <primitive object={grid} position={[0, -0.01, 0]} />;
}

/** 남한 지도판. 해안선 좌표로 면을 만들어 얇게 뽑아 올리고, 윗면 테두리에 해안선을 긋습니다. */
function MapPlate({ palette }: { palette: Palette }) {
  const { plate, coast } = useMemo(() => {
    const shapes = KOREA_RINGS.map((ring) => {
      const shape = new THREE.Shape();
      ring.forEach(([lon, lat], index) => {
        const { x, z } = project(lon, lat);
        // Shape는 2차원(x, y)이라 y에 -z를 넣고, 아래에서 판을 눕힙니다.
        if (index === 0) shape.moveTo(x, -z);
        else shape.lineTo(x, -z);
      });
      shape.closePath();
      return shape;
    });
    const plate = new THREE.ExtrudeGeometry(shapes, { depth: PLATE_DEPTH, bevelEnabled: false });
    // x축으로 -90° 돌리면 shape의 y가 -z(북쪽)로, 뽑아 올린 방향이 +y가 됩니다.
    plate.rotateX(-Math.PI / 2);

    const points: number[] = [];
    for (const ring of KOREA_RINGS) {
      for (let i = 0; i < ring.length; i += 1) {
        const a = project(ring[i][0], ring[i][1]);
        const next = ring[(i + 1) % ring.length];
        const b = project(next[0], next[1]);
        points.push(a.x, PLATE_DEPTH + 0.003, a.z, b.x, PLATE_DEPTH + 0.003, b.z);
      }
    }
    const coast = new THREE.BufferGeometry();
    coast.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
    return { plate, coast };
  }, []);

  useEffect(
    () => () => {
      plate.dispose();
      coast.dispose();
    },
    [plate, coast],
  );

  return (
    <group>
      <mesh geometry={plate}>
        <meshStandardMaterial
          color={palette.surface}
          roughness={0.9}
          metalness={0}
          emissive={palette.blue}
          emissiveIntensity={0.1}
        />
      </mesh>
      <lineSegments geometry={coast}>
        <lineBasicMaterial color={palette.blue} transparent opacity={0.6} />
      </lineSegments>
      {ISLAND_DOTS.map((island) => {
        const { x, z } = project(island.lon, island.lat);
        return (
          <group key={island.name} position={[x, 0, z]}>
            <mesh position={[0, PLATE_DEPTH / 2, 0]}>
              <cylinderGeometry args={[island.radius, island.radius, PLATE_DEPTH, 10]} />
              <meshStandardMaterial
                color={palette.surface}
                emissive={palette.blue}
                emissiveIntensity={0.1}
              />
            </mesh>
            <mesh position={[0, PLATE_DEPTH + 0.003, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[island.radius - 0.01, island.radius, 14]} />
              <meshBasicMaterial color={palette.blue} transparent opacity={0.6} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

/* ── 공장 ────────────────────────────────────────────────────── */

/**
 * 공장 한 채. 톱니 지붕의 옆모습을 그려 앞뒤로 뽑아 올린 지오메트리 하나라,
 * 공장 한 채가 draw call 한 번입니다.
 */
function factoryGeometry(width = 0.24, depth = 0.2, wall = 0.13, teeth = 3, tooth = 0.065) {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.lineTo(0, wall);
  const toothWidth = width / teeth;
  for (let i = 0; i < teeth; i += 1) {
    // 완만한 지붕면을 올라갔다가 채광창 쪽으로 가파르게 떨어집니다.
    shape.lineTo(i * toothWidth + toothWidth * 0.62, wall + tooth);
    shape.lineTo((i + 1) * toothWidth, wall);
  }
  shape.lineTo(width, 0);
  shape.closePath();

  const geometry = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false });
  geometry.translate(-width / 2, 0, -depth / 2);
  return geometry;
}

function PlantSiteMarker({
  name,
  x,
  z,
  units,
  labelSide,
  labelDz,
  palette,
  geometry,
}: {
  name: string;
  x: number;
  z: number;
  units: number;
  labelSide: "left" | "right" | "top";
  labelDz: number;
  palette: Palette;
  geometry: THREE.ExtrudeGeometry;
}) {
  const label = useMemo(() => makeLabelTexture(name, palette), [name, palette]);
  useEffect(() => () => label?.texture.dispose(), [label]);

  const LABEL_HEIGHT = 0.26;
  const padRadius = units > 1 ? 0.4 : 0.3;
  // 이름표는 자리 판 바깥에 붙입니다. 위쪽이면 북쪽(카메라에서 먼 쪽)입니다.
  const labelX =
    labelSide === "top" ? x : x + (labelSide === "left" ? -padRadius - 0.02 : padRadius + 0.02);
  const labelZ = labelSide === "top" ? z - padRadius - 0.04 : z;
  const anchor = useMemo(
    () =>
      labelSide === "top"
        ? new THREE.Vector2(0.5, 0)
        : new THREE.Vector2(labelSide === "left" ? 1 : 0, 0.5),
    [labelSide],
  );

  return (
    <group>
      {/* 자리를 표시하는 판. 공장이 작아도 위치가 눈에 들어오게 합니다. */}
      <mesh position={[x, PLATE_DEPTH + 0.004, z]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[padRadius, 28]} />
        <meshBasicMaterial color={palette.blue} transparent opacity={0.14} />
      </mesh>
      <mesh position={[x, PLATE_DEPTH + 0.005, z]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[padRadius - 0.012, padRadius, 40]} />
        <meshBasicMaterial color={palette.blue} transparent opacity={0.55} />
      </mesh>
      {Array.from({ length: units }, (_, unit) => (
        <mesh
          key={unit}
          geometry={geometry}
          position={[x + (unit - (units - 1) / 2) * 0.3, PLATE_DEPTH, z]}
        >
          <meshStandardMaterial
            color={palette.blue}
            emissive={palette.blue}
            emissiveIntensity={0.18}
            roughness={0.55}
          />
        </mesh>
      ))}
      {label && (
        <sprite
          position={[labelX, PLATE_DEPTH + 0.16, labelZ + labelDz]}
          scale={[LABEL_HEIGHT * label.aspect, LABEL_HEIGHT, 1]}
          center={anchor}
        >
          <spriteMaterial map={label.texture} transparent depthWrite={false} />
        </sprite>
      )}
    </group>
  );
}

/* ── 데이터 흐름 ─────────────────────────────────────────────── */

type Site = { name: string; x: number; z: number; units: number };

/** 사업장에서 화면 입구로 흘러 들어가는 곡선. 사업장마다 세 줄기입니다. */
function buildStreams(sites: Site[]) {
  return sites.flatMap((site) =>
    STREAM_OFFSETS.map((offset) => {
      const start = new THREE.Vector3(site.x + offset * 0.4, PLATE_DEPTH + 0.26, site.z + offset);
      // 세 줄기는 입구에서 거의 하나로 합쳐집니다.
      const end = panelToWorld(INLET.clone().add(new THREE.Vector3(0, offset * 0.15, 0)));
      // 화면 오른쪽 바깥에서 수평으로 들어가게 합니다. 화면 좌표로 잡아야 화면을 돌려도 맞습니다.
      const approach = panelToWorld(
        INLET.clone().add(new THREE.Vector3(0.95, offset * 0.8 - 0.05, 0.15)),
      );
      const lift = start.clone().lerp(approach, 0.45).add(new THREE.Vector3(0, 0.5, 0));
      return new THREE.CatmullRomCurve3([start, lift, approach, end], false, "centripetal");
    }),
  );
}

/** 줄기의 길. 알갱이만 띄우면 어디로 가는지 읽히지 않아, 옅은 선으로 길을 깔아 둡니다. */
function StreamPaths({ curves, palette }: { curves: THREE.CatmullRomCurve3[]; palette: Palette }) {
  const geometry = useMemo(() => {
    const SEGMENTS = 36;
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
      <lineBasicMaterial color={palette.blue} transparent opacity={0.28} />
    </lineSegments>
  );
}

/** 길 위를 지나는 데이터 알갱이. 전부 InstancedMesh 하나라 draw call 한 번입니다. */
function DataPulses({ curves, palette }: { curves: THREE.CatmullRomCurve3[]; palette: Palette }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const pulseCount = curves.length * PULSES_PER_STREAM;

  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    if (!mesh) return;

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
      const t = (clock.elapsedTime * 0.14 + phase) % 1;
      curves[curveIndex].getPointAt(t, dummy.position);
      // 화면에 가까워질수록 작아져, 모여서 하나로 들어가는 것으로 읽히게 합니다.
      dummy.scale.setScalar(0.062 * (1 - t * 0.35));
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, pulseCount]}>
      <sphereGeometry args={[1, 10, 8]} />
      <meshStandardMaterial
        color={palette.cyan}
        emissive={palette.cyan}
        emissiveIntensity={0.9}
        roughness={0.3}
      />
    </instancedMesh>
  );
}

/* ── 화면 ────────────────────────────────────────────────────── */

/**
 * 화면 위를 흐르는 예측 구간(P05~P95)과 실측선.
 * 값 하나가 아니라 범위를 내놓는다는 것이 이 모델의 핵심이라 띠로 표현합니다.
 */
const CHART = {
  samples: 72,
  left: -PANEL.width / 2 + 0.24,
  right: PANEL.width / 2 - 0.24,
  /** 제목·범례 아래, 판 아래 여백 위의 가운데 */
  baseY: -0.2,
  /** 판 앞면보다 살짝 앞 */
  front: 0.045,
};

function ForecastChart({ palette }: { palette: Palette }) {
  const { left: LEFT, right: RIGHT, baseY: BASE_Y, front: FRONT } = CHART;

  const bandGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(CHART.samples * 2 * 3), 3),
    );
    const indices: number[] = [];
    for (let i = 0; i < CHART.samples - 1; i += 1) {
      const a = i * 2;
      indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
    geometry.setIndex(indices);
    return geometry;
  }, []);

  const lineGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(CHART.samples * 3), 3),
    );
    return geometry;
  }, []);

  const actualLine = useMemo(
    () => new THREE.Line(lineGeometry, new THREE.LineBasicMaterial({ color: palette.blue })),
    [lineGeometry, palette.blue],
  );

  /** 눈금선 세 줄. 띠가 허공에 뜬 그림이 아니라 차트라는 것을 알려 줍니다. */
  const gridGeometry = useMemo(() => {
    const points: number[] = [];
    for (const dy of [-0.34, 0, 0.34]) {
      points.push(LEFT, BASE_Y + dy, FRONT - 0.005, RIGHT, BASE_Y + dy, FRONT - 0.005);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
    return geometry;
  }, [LEFT, RIGHT, BASE_Y, FRONT]);

  useEffect(
    () => () => {
      bandGeometry.dispose();
      lineGeometry.dispose();
      gridGeometry.dispose();
    },
    [bandGeometry, lineGeometry, gridGeometry],
  );

  useFrame(({ clock }) => {
    const time = clock.elapsedTime * 0.45;
    const band = bandGeometry.getAttribute("position") as THREE.BufferAttribute;
    const line = lineGeometry.getAttribute("position") as THREE.BufferAttribute;

    for (let i = 0; i < CHART.samples; i += 1) {
      const u = i / (CHART.samples - 1);
      const x = LEFT + u * (RIGHT - LEFT);
      const centre = Math.sin(u * 5.2 - time) * 0.2 + Math.sin(u * 2.1 - time * 0.7) * 0.11;
      const spread = 0.13 + Math.sin(u * 3.1 + time * 0.5) * 0.04;

      band.setXYZ(i * 2, x, BASE_Y + centre + spread, FRONT);
      band.setXYZ(i * 2 + 1, x, BASE_Y + centre - spread, FRONT);
      // 실측선은 구간 안에서 조금씩 다르게 움직입니다.
      line.setXYZ(i, x, BASE_Y + centre + Math.sin(u * 9.3 - time * 1.6) * 0.045, FRONT + 0.006);
    }

    band.needsUpdate = true;
    line.needsUpdate = true;
  });

  return (
    <group>
      <lineSegments geometry={gridGeometry}>
        <lineBasicMaterial color={palette.line} />
      </lineSegments>
      <mesh geometry={bandGeometry}>
        <meshBasicMaterial
          color={palette.blue}
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      <primitive object={actualLine} />
    </group>
  );
}

/** 데이터가 모이는 화면. 지도 뒤에 세운 판 위에 머리글·범례·차트를 올립니다. */
function Panel({ palette }: { palette: Palette }) {
  const face = useMemo(() => makePanelTexture(palette), [palette]);
  useEffect(() => () => face?.dispose(), [face]);

  const edges = useMemo(
    () => new THREE.EdgesGeometry(new THREE.BoxGeometry(PANEL.width, PANEL.height, 0.06)),
    [],
  );
  useEffect(() => () => edges.dispose(), [edges]);

  return (
    <group position={PANEL.position} rotation={[PANEL.tilt, PANEL.yaw, 0, "YXZ"]}>
      <mesh>
        <boxGeometry args={[PANEL.width, PANEL.height, 0.06]} />
        <meshStandardMaterial
          color={palette.surface}
          roughness={0.7}
          emissive={palette.blue}
          emissiveIntensity={0.04}
        />
      </mesh>
      <lineSegments geometry={edges}>
        <lineBasicMaterial color={palette.blue} transparent opacity={0.6} />
      </lineSegments>
      {face && (
        <mesh position={[0, 0, 0.032]}>
          <planeGeometry args={[PANEL.width, PANEL.height]} />
          <meshBasicMaterial map={face} transparent />
        </mesh>
      )}
      <ForecastChart palette={palette} />
      {/* 데이터가 들어오는 입구 */}
      <mesh position={INLET}>
        <sphereGeometry args={[0.09, 14, 10]} />
        <meshStandardMaterial color={palette.cyan} emissive={palette.cyan} emissiveIntensity={0.7} />
      </mesh>
    </group>
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

/** 마우스를 따라 아주 조금만 기울입니다. 회전이 아니라 시차 정도의 움직임입니다. */
function ParallaxRig({ children }: { children: React.ReactNode }) {
  const group = useRef<THREE.Group>(null);
  const { pointer } = useThree();

  useFrame(() => {
    if (!group.current) return;
    group.current.rotation.y += (pointer.x * 0.05 - group.current.rotation.y) * 0.05;
    group.current.rotation.x += (-pointer.y * 0.025 - group.current.rotation.x) * 0.05;
  });

  return <group ref={group}>{children}</group>;
}

export default function HeroScene({
  plants,
  active,
}: {
  plants: string[];
  active: boolean;
}) {
  /*
   * 이 컴포넌트는 브라우저에서만 불러오므로 첫 렌더에서 바로 토큰을 읽습니다.
   * effect에서 setState로 채우면 렌더가 한 번 더 돌고, 그 사이에 색 없는 장면이 그려집니다.
   */
  const [palette, setPalette] = useState<Palette>(readPalette);

  // 테마가 바뀌면 장면의 색도 따라 바뀝니다. 웹폰트가 늦게 오면 이름표도 다시 그립니다.
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
  const factory = useMemo(() => factoryGeometry(), []);
  useEffect(() => () => factory.dispose(), [factory]);

  return (
    <Canvas
      camera={{ position: [0, 7.45, 9.3], fov: 30 }}
      /* 톤 매핑을 끕니다. 켜 두면 흰색이 회색으로, 토큰의 파랑이 다른 파랑으로 바뀝니다. */
      flat
      /* 화면 밖에서는 루프를 재웁니다. 마지막 프레임은 캔버스에 그대로 남습니다. */
      frameloop={active ? "always" : "never"}
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: true }}
      style={{ width: "100%", height: "100%" }}
      aria-hidden="true"
      onCreated={({ camera }) => camera.lookAt(FOCUS)}
    >
      {/* 조명 세기는 물리 단위라 1이 1/π 밝기입니다. 흰 판이 희게 보이도록 π 배 가까이 줍니다. */}
      <ambientLight intensity={2.0} />
      <directionalLight position={[4, 9, 5]} intensity={1.6} />
      <SceneStats />
      <ParallaxRig>
        <Ground palette={palette} />
        <MapPlate palette={palette} />
        {sites.map((site) => (
          <PlantSiteMarker
            key={site.name}
            name={site.name}
            x={site.x}
            z={site.z}
            units={site.units}
            labelSide={PLANT_SITES[site.name].label.side}
            labelDz={PLANT_SITES[site.name].label.dz ?? 0}
            palette={palette}
            geometry={factory}
          />
        ))}
        <StreamPaths curves={curves} palette={palette} />
        <DataPulses curves={curves} palette={palette} />
        <Panel palette={palette} />
      </ParallaxRig>
    </Canvas>
  );
}
