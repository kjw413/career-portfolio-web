---
title: "투자 실적 검증 도구"
repoName: "investment_checker"
category: "AUTOMATION"
kind: "AUTOMATION · VALIDATION"
summary: "MIS 등록 내역과 실제 투자실적을 비교해 미등록·계정코드 누락 등 정정 대상을 보고서로 만드는 검증 도구"
intro: "종합정보시스템(MIS) 등록 내역과 실제 투자실적 엑셀을 교차 비교해 미등록 건과 계정코드 누락 후보를 자동으로 탐지합니다. 사람이 눈으로 대조하던 투자 실적 검증 업무를 자동화했습니다."
tags: [Python, Excel, Validation, RPA]
stack: "Python · Excel · Validation · RPA"
github: "https://github.com/kjw413/investment_checker"
visibility: "PUBLIC"
status: "completed"
order: 8
---

## 개요

투자 실적을 검증하려면 MIS에 등록된 내역과 실제 투자실적을 한 건씩 대조해야
합니다. 건수가 많아질수록 사람이 눈으로 맞추는 방식은 누락이 생기기 쉽습니다.

두 자료를 자동으로 교차 비교해 **미등록 건**과 **계정코드 누락 후보**를 뽑아내는
검증 도구를 만들어, 사람은 걸러진 후보만 확인하도록 바꿨습니다.

## 점검 항목

자코드와 공장을 기준으로 두 자료를 맞춘 뒤, 담당 부서가 정정해야 할 항목을 찾아
엑셀 보고서로 남깁니다.

- 전산 미등록
- 계정코드 미기입 · 오기입
- 승인금액 미기입
- 모코드 미기입
- 투자자(담당자) 미기입

실제 투자실적 양식에 요약표나 2행 헤더가 있어도 헤더 위치와 필요한 열을 자동으로 찾습니다.

> 입력·결과 파일은 사내 자료라 `.gitignore`로 저장소에서 제외하고, 형식 설명만 공개합니다.
