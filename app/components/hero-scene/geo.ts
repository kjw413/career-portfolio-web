/**
 * 지도 좌표계와 공장 위치. three.js를 끌어오지 않는 순수 모듈이라 테스트에서 바로 씁니다.
 *
 * 위도 1도를 1단위로 두고, 경도는 36°N에서의 실제 거리 비율(cos 36°)로 줄입니다.
 * 이 축척에서 남한 본토는 가로 약 2.8, 세로 약 4.3단위입니다.
 */

export const LON_SCALE = Math.cos((36 * Math.PI) / 180);

/** 장면의 원점. 본토 한가운데쯤(대전 부근)입니다. */
export const ORIGIN = { lon: 127.9, lat: 36.35 } as const;

export type XZ = { x: number; z: number };

/** 경도·위도를 장면의 x·z로 바꿉니다. 북쪽이 -z, 즉 카메라에서 먼 쪽입니다. */
export function project(lon: number, lat: number): XZ {
  return { x: (lon - ORIGIN.lon) * LON_SCALE, z: -(lat - ORIGIN.lat) };
}

export type PlantSite = {
  lat: number;
  lon: number;
  /** 한 사업장에 있는 공장 수. 남양주는 1·2공장 두 단위입니다. */
  units: number;
  /** 이름표를 어느 쪽에 붙일지. 남양주와 광주(경기)가 가까워 서로 다른 쪽에 둡니다. */
  label: { side: "left" | "right" | "top"; dz?: number };
};

/**
 * 공장 위치(시 단위 좌표). 키는 원장 `bems-plants`의 이름 그대로입니다.
 * 원장의 이름이 바뀌면 geo.test.ts가 잡아 장면에서 공장이 조용히 사라지지 않게 합니다.
 */
export const PLANT_SITES: Record<string, PlantSite> = {
  "남양주(1·2)": { lat: 37.62, lon: 127.17, units: 2, label: { side: "top" } },
  "광주(경기)": { lat: 37.36, lon: 127.3, units: 1, label: { side: "right", dz: 0.05 } },
  논산: { lat: 36.19, lon: 127.1, units: 1, label: { side: "left" } },
  경산: { lat: 35.85, lon: 128.78, units: 1, label: { side: "right", dz: -0.04 } },
  김해: { lat: 35.24, lon: 128.82, units: 1, label: { side: "right", dz: 0.08 } },
};

/** 점이 다각형 안에 있는지(ray casting). 공장 좌표가 바다에 찍히지 않았는지 검사할 때 씁니다. */
export function pointInRing(
  point: readonly [number, number],
  ring: readonly (readonly [number, number])[],
): boolean {
  const [x, y] = point;
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const crosses = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (crosses) inside = !inside;
  }
  return inside;
}
