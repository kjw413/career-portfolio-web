---
id: EXP-UNIV-POWERFLOW
title: 전력계통 조류해석·최적화 (MATLAB)
status: 확정
affiliation: hongik
role: IT종합시스템설계 과목 프로젝트
period:
  start: null
  end: null
  asOf: "2026-09-12"
headline: "전력조류해석의 연산 구조를 바꿔 반복 {{metric:powerflow-iterations}}, 수렴 시간 {{metric:powerflow-speedup}}"
highlights:
  - "병목이 알고리즘이 아니라 매 반복의 역행렬 연산 구조에 있다고 판단"
  - "역행렬 대신 선형 연립 풀이로 변화량만 계산하고, 근사해를 초기 시드값으로 사용"
  - "IEEE 9-bus 50회 벤치마크에서 반복 {{metric:powerflow-iterations}}, 수렴 시간 {{metric:powerflow-speedup}}"
metricIds: [powerflow-iterations, powerflow-speedup]
tags: [알고리즘최적화, 수치해석, MATLAB, 전력계통, 시뮬레이션]
useFor: [생산관리·생산계획, 제조 AI·데이터, 반도체 공정·기반기술]
excludeFor: []
relatedCards: []
projectSlugs: []
evidence: []
canonical:
  - "병목이 알고리즘이 아니라 연산 구조에 있다고 판단하고, 역행렬 연산 대신 선형 연립 풀이로 변화량만 계산하도록 바꿨다."
  - "IEEE 9-bus 계통 50회 벤치마크에서 반복 횟수가 4회에서 3회로, 평균 수렴 시간이 16% 줄었다."
forbidden:
  - "학부 종합설계"
openQuestions: [OQ-UNIV-TERM]
publicOnSite: true
order: 11
---

## 배경

홍익대학교 전자전기공학부 **IT종합시스템설계** 과목에서 MATLAB으로 AC 전력조류해석과
DC 전력 최적화 시스템을 구현했습니다. 전력 조류 해석은 뉴턴-랩슨 기법 기반이고, DC 전력
최적화는 별도 솔버 기반입니다.

## 수행

메인 로직인 뉴턴-랩슨 이터레이션이 매 반복마다 자코비언 역행렬을 연산하는 구조라, 계통
규모가 커질수록 반복당 연산 복잡도가 속도 저하로 이어졌습니다. 병목이 알고리즘이 아니라
연산 구조에 있다고 판단하고 두 가지를 바꿨습니다.

- 역행렬 연산 대신 백슬래시(선형 연립 풀이)로 변화량(델타 x)만 계산해 연산 부담 완화
- 이터레이션 시작 전 1회 근사해를 초기 시드값으로 설정해 반복 필요 횟수 감소

## 성과

IEEE 9-bus 계통 50회 벤치마크에서 반복 횟수 {{metric:powerflow-iterations}}, 평균 수렴
시간 {{metric:powerflow-speedup}}. 시스템 규모가 커질수록 알고리즘 최적화의 비용 절감
효과가 커진다는 것을 확인했습니다.

공식 과목명은 `IT종합시스템설계`입니다. 축약해 쓰지 않습니다.
