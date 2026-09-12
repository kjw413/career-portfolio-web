"use client";

/**
 * 5개 공장에서 모인 에너지·생산 데이터가 하나의 시스템으로 들어가고, 그 위에서
 * 예측 구간이 실측과 함께 흐르는 장면입니다. BEMS 대시보드가 실제로 보여 주는 것을
 * 그대로 3D로 옮긴 것이라, 그림만 보고도 무슨 일을 했는지 읽히는 것을 목표로 합니다.
 *
 * 장식이 아니라 구현 증거로 두는 것이므로 규칙을 정해 두었습니다.
 *   - 색은 CSS 토큰에서 읽습니다. 다크 모드에서 장면만 따로 놀지 않게 합니다.
 *   - glTF 같은 외부 자산을 두지 않고 지오메트리를 코드로 만듭니다.
 *   - 화면 밖에 있으면 렌더 루프를 멈춥니다.
 */

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

const PULSES_PER_PLANT = 4;
/** 전력 · 연료 · 용수. 대시보드에서 쓰는 색 구분을 그대로 씁니다. */
const STREAM_OFFSETS = [-0.2, -0.07, 0.07, 0.2];

type Palette = {
  line: string;
  blue: string;
  cyan: string;
  ink: string;
  surface: string;
  muted: string;
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
  };
}

/**
 * 공장 5개를 뷰어 쪽으로 열린 호 위에 놓습니다. 가운데가 가장 멀고 양 끝이 가까워,
 * 다섯 곳에서 한 곳으로 모이는 방향이 그림에서 읽힙니다.
 */
function plantLayout(count: number) {
  return Array.from({ length: count }, (_, index) => {
    const spread = ((index - (count - 1) / 2) / Math.max(count - 1, 1)) * 1.15;
    return new THREE.Vector3(
      Math.sin(spread) * 4.35,
      0,
      (1 - Math.cos(spread)) * 3.1 + 0.4,
    );
  });
}

const HUB = new THREE.Vector3(0, 2.35, -1.1);
/** 카메라가 바라보는 곳. 공장 줄과 허브 사이를 봅니다. */
const FOCUS = new THREE.Vector3(0, 1.55, 0);

function Ground({ palette }: { palette: Palette }) {
  const grid = useMemo(() => {
    const helper = new THREE.GridHelper(18, 30, palette.line, palette.line);
    const material = helper.material as THREE.Material;
    material.transparent = true;
    material.opacity = 0.55;
    return helper;
  }, [palette.line]);

  useEffect(() => () => grid.dispose(), [grid]);
  return <primitive object={grid} position={[0, -0.01, 0]} />;
}

function Plant({
  position,
  height,
  palette,
}: {
  position: THREE.Vector3;
  height: number;
  palette: Palette;
}) {
  return (
    <group position={position}>
      <mesh position={[0, height / 2, 0]} castShadow={false}>
        <boxGeometry args={[1.02, height, 1.02]} />
        <meshStandardMaterial
          color={palette.surface}
          roughness={0.85}
          metalness={0}
          emissive={palette.blue}
          emissiveIntensity={0.06}
        />
      </mesh>
      {/* 블록 윤곽선. 면만 두면 밝은 배경에서 형태가 사라집니다. */}
      <lineSegments position={[0, height / 2, 0]}>
        <edgesGeometry args={[new THREE.BoxGeometry(1.02, height, 1.02)]} />
        <lineBasicMaterial color={palette.blue} transparent opacity={0.55} />
      </lineSegments>
      <mesh position={[0, height + 0.055, 0]}>
        <boxGeometry args={[0.38, 0.11, 0.38]} />
        <meshStandardMaterial color={palette.blue} emissive={palette.blue} emissiveIntensity={0.5} />
      </mesh>
      {/* 바닥에 깔리는 얇은 판. 블록이 허공에 떠 보이지 않게 자리를 잡아 줍니다. */}
      <mesh position={[0, 0.015, 0]}>
        <boxGeometry args={[1.5, 0.03, 1.5]} />
        <meshStandardMaterial color={palette.blue} transparent opacity={0.18} />
      </mesh>
    </group>
  );
}

function Hub({ palette }: { palette: Palette }) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.y = clock.elapsedTime * 0.18;
  });

  return (
    <group position={HUB}>
      <mesh ref={ref}>
        <cylinderGeometry args={[0.72, 0.72, 0.3, 12]} />
        <meshStandardMaterial
          color={palette.blue}
          emissive={palette.blue}
          emissiveIntensity={0.35}
          roughness={0.4}
        />
      </mesh>
      <mesh position={[0, -HUB.y / 2, 0]}>
        <cylinderGeometry args={[0.07, 0.07, HUB.y, 8]} />
        <meshStandardMaterial color={palette.blue} transparent opacity={0.4} />
      </mesh>
    </group>
  );
}

/** 공장에서 허브로 흐르는 데이터. 15개를 한 번의 draw call로 그립니다. */
function DataPulses({
  plants,
  palette,
}: {
  plants: THREE.Vector3[];
  palette: Palette;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const curves = useMemo(
    () =>
      plants.flatMap((plant) =>
        STREAM_OFFSETS.map((offset) => {
          const start = new THREE.Vector3(plant.x + offset, 0.9, plant.z + offset);
          const mid = start
            .clone()
            .lerp(HUB, 0.5)
            .add(new THREE.Vector3(0, 0.85 + Math.abs(offset) * 1.6, 0));
          return new THREE.CatmullRomCurve3([start, mid, HUB.clone()]);
        }),
      ),
    [plants],
  );

  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    for (let index = 0; index < curves.length; index += 1) {
      const offset = (index % PULSES_PER_PLANT) * 0.33 + Math.floor(index / PULSES_PER_PLANT) * 0.11;
      const t = (clock.elapsedTime * 0.22 + offset) % 1;
      curves[index].getPointAt(t, dummy.position);
      // 허브에 가까워질수록 작아져, 모여서 하나로 들어가는 것으로 읽히게 합니다.
      const scale = 0.115 * (1 - t * 0.4);
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, curves.length]}>
      <sphereGeometry args={[1, 8, 6]} />
      <meshStandardMaterial
        color={palette.cyan}
        emissive={palette.cyan}
        emissiveIntensity={0.85}
        roughness={0.3}
      />
    </instancedMesh>
  );
}

/**
 * 허브 위를 흐르는 예측 구간(P05~P95)과 실측선.
 * 값 하나가 아니라 범위를 내놓는다는 것이 이 모델의 핵심이라 띠로 표현합니다.
 */
function ForecastBand({ palette }: { palette: Palette }) {
  const SAMPLES = 72;
  const WIDTH = 6.0;
  const BASE_Y = 3.4;

  const bandRef = useRef<THREE.Mesh>(null);
  const lineRef = useRef<THREE.Line>(null);

  const bandGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(SAMPLES * 2 * 3), 3),
    );
    const indices: number[] = [];
    for (let i = 0; i < SAMPLES - 1; i += 1) {
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
      new THREE.BufferAttribute(new Float32Array(SAMPLES * 3), 3),
    );
    return geometry;
  }, []);

  useEffect(
    () => () => {
      bandGeometry.dispose();
      lineGeometry.dispose();
    },
    [bandGeometry, lineGeometry],
  );

  useFrame(({ clock }) => {
    const time = clock.elapsedTime * 0.45;
    const band = bandGeometry.getAttribute("position") as THREE.BufferAttribute;
    const line = lineGeometry.getAttribute("position") as THREE.BufferAttribute;

    for (let i = 0; i < SAMPLES; i += 1) {
      const u = i / (SAMPLES - 1);
      const x = (u - 0.5) * WIDTH;
      const centre = Math.sin(u * 5.2 - time) * 0.34 + Math.sin(u * 2.1 - time * 0.7) * 0.18;
      const spread = 0.26 + Math.sin(u * 3.1 + time * 0.5) * 0.08;

      band.setXYZ(i * 2, x, BASE_Y + centre + spread, HUB.z);
      band.setXYZ(i * 2 + 1, x, BASE_Y + centre - spread, HUB.z);
      // 실측선은 구간 안에서 조금씩 다르게 움직입니다.
      line.setXYZ(i, x, BASE_Y + centre + Math.sin(u * 9.3 - time * 1.6) * 0.075, HUB.z + 0.02);
    }

    band.needsUpdate = true;
    line.needsUpdate = true;
    bandGeometry.computeVertexNormals();
  });

  return (
    <group>
      <mesh ref={bandRef} geometry={bandGeometry}>
        <meshBasicMaterial
          color={palette.blue}
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      <primitive
        object={
          new THREE.Line(
            lineGeometry,
            new THREE.LineBasicMaterial({ color: palette.blue, linewidth: 1 }),
          )
        }
        ref={lineRef}
      />
    </group>
  );
}

/**
 * 장면의 실제 비용을 재서 남깁니다. 포스터 생성 스크립트가 읽어 가고,
 * 경험 카드에 적는 삼각형 수·draw call 수의 근거가 됩니다.
 */
function SceneStats() {
  const { gl, scene } = useThree();
  const frames = useRef(0);

  useFrame(() => {
    // 첫 프레임에는 draw call이 아직 0이라, 몇 프레임 돌린 뒤에 잽니다.
    frames.current += 1;
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
    group.current.rotation.y += (pointer.x * 0.055 - group.current.rotation.y) * 0.05;
    group.current.rotation.x += (-pointer.y * 0.03 - group.current.rotation.x) * 0.05;
  });

  return <group ref={group}>{children}</group>;
}

export default function HeroScene({ plants }: { plants: string[] }) {
  /*
   * 이 컴포넌트는 브라우저에서만 불러오므로 첫 렌더에서 바로 토큰을 읽습니다.
   * effect에서 setState로 채우면 렌더가 한 번 더 돌고, 그 사이에 색 없는 장면이 그려집니다.
   */
  const [palette, setPalette] = useState<Palette>(readPalette);
  const positions = useMemo(() => plantLayout(plants.length), [plants.length]);
  const heights = useMemo(
    () => positions.map((_, index) => 1.05 + ((index * 7) % 5) * 0.17),
    [positions],
  );

  // 테마가 바뀌면 장면의 색도 따라 바뀝니다.
  useEffect(() => {
    const media = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!media) return;
    const update = () => setPalette(readPalette());
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return (
    <Canvas
      camera={{ position: [0, 3.9, 11.2], fov: 30 }}
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: true }}
      style={{ width: "100%", height: "100%" }}
      aria-hidden="true"
      onCreated={({ camera }) => camera.lookAt(FOCUS)}
    >
      <ambientLight intensity={1.05} />
      <directionalLight position={[4, 7, 5]} intensity={1.15} />
      <SceneStats />
      <ParallaxRig>
        <Ground palette={palette} />
        {positions.map((position, index) => (
          <Plant
            key={plants[index]}
            position={position}
            height={heights[index]}
            palette={palette}
          />
        ))}
        <DataPulses plants={positions} palette={palette} />
        <Hub palette={palette} />
        <ForecastBand palette={palette} />
      </ParallaxRig>
    </Canvas>
  );
}
