import { describe, expect, it } from "vitest";
import { getPlantNames } from "../../../lib/ledger";
import { PLANT_SITES, pointInRing, project } from "./geo";
import { KOREA_RINGS } from "./korea-outline";

/**
 * 공장 이름은 원장에서 오고 위치는 좌표표에서 옵니다. 둘이 어긋나면 공장이
 * 장면에서 조용히 사라지므로, 어긋남을 여기서 잡습니다.
 */
describe("지도 위 공장 위치", () => {
  it("원장의 사업장마다 좌표가 있다", () => {
    for (const name of getPlantNames()) {
      expect(PLANT_SITES[name], `${name}의 좌표가 geo.ts에 없습니다`).toBeDefined();
    }
  });

  it("좌표표에 원장에 없는 사업장이 남아 있지 않다", () => {
    expect(Object.keys(PLANT_SITES).sort()).toEqual([...getPlantNames()].sort());
  });

  it("모든 사업장이 본토 안에 찍힌다", () => {
    const mainland = KOREA_RINGS[0];
    for (const [name, site] of Object.entries(PLANT_SITES)) {
      expect(pointInRing([site.lon, site.lat], mainland), `${name}이(가) 바다에 있습니다`).toBe(true);
    }
  });

  it("광주는 경기도 광주라 논산보다 북쪽에 있다", () => {
    expect(PLANT_SITES["광주(경기)"].lat).toBeGreaterThan(PLANT_SITES["논산"].lat);
  });

  it("가까운 남양주와 광주(경기)는 이름표를 서로 반대쪽에 둔다", () => {
    expect(PLANT_SITES["남양주(1·2)"].label.side).not.toBe(PLANT_SITES["광주(경기)"].label.side);
  });

  it("투영은 북쪽을 -z로 보낸다", () => {
    const north = project(127, 38);
    const south = project(127, 35);
    expect(north.z).toBeLessThan(south.z);
  });
});
