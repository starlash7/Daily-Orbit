# Daily Orbit

Base Mini App 환경에서 매일 1분 운세를 확인하고 공유하는 초경량 소셜 운세 앱 기획 문서 모음입니다.

## 현재 구현 상태

- Next.js 기반 MVP 스캐폴딩 완료
- `/api/draw` 일일 운세 API 구현
- `/.well-known/farcaster.json` 라우트 구현
- 결과 공유/심화 해석(데모) UI 구현
- Mini App용 SVG 에셋(`public/miniapp`) 추가

## 로컬 실행

```bash
npm install
npm run dev
```

기본 주소: `http://localhost:3000`

## 환경 변수

`.env.example`를 참고해 `.env.local`을 설정하세요.

- `NEXT_PUBLIC_URL`: 앱 절대 URL
- `FARCASTER_HEADER`
- `FARCASTER_PAYLOAD`
- `FARCASTER_SIGNATURE`

Mini App manifest 확인:

- `http://localhost:3000/.well-known/farcaster.json`

## 코드 구조

| 경로 | 설명 |
|---|---|
| `app/page.tsx` | 메인 운세 UI (카테고리/결과/공유/심화 데모) |
| `app/api/draw/route.ts` | 카테고리 기반 운세 결과 API |
| `app/.well-known/farcaster.json/route.ts` | Farcaster Mini App manifest |
| `lib/fortune.ts` | 운세 데이터/일일 deterministic draw 로직 |
| `public/miniapp/*` | icon/og/splash SVG 에셋 |

## 프로젝트 한 줄 요약

- 무료 1회 운세 -> 결과 카드 공유 -> 다음날 재방문(streak) 루프를 검증하는 Mini App

## 핵심 가치

- 빠른 진입: 온보딩 최소화, 즉시 뽑기
- 높은 공유성: 카드형 결과물 중심 UX
- 부담 없는 수익화: 무료 코어 + USDC 소액 결제
- Base 친화성: 지갑/결제/온체인 경험을 자연스럽게 연결

## 문서 인덱스

| 문서 | 목적 |
|---|---|
| `docs/01_product_prd.md` | 문제 정의, 사용자, 범위, 리스크 |
| `docs/02_user_flow_and_screens.md` | IA, 사용자 플로우, 화면별 요구사항 |
| `docs/03_art_character_asset_strategy.md` | 캐릭터/비주얼/에셋 제작 전략 |
| `docs/04_monetization_and_onchain.md` | 수익화 모델, 결제/가스 UX 설계 |
| `docs/05_kpi_and_event_tracking.md` | KPI, 이벤트, 퍼널/대시보드 기준 |
| `docs/06_two_week_roadmap_and_launch_checklist.md` | 2주 실행 계획, QA/런칭 체크리스트 |
| `docs/07_opencode_agent_workflow.md` | 병렬 에이전트 운영 가이드 |

## 권장 읽는 순서

1. `docs/01_product_prd.md`
2. `docs/02_user_flow_and_screens.md`
3. `docs/03_art_character_asset_strategy.md`
4. `docs/04_monetization_and_onchain.md`
5. `docs/05_kpi_and_event_tracking.md`
6. `docs/06_two_week_roadmap_and_launch_checklist.md`
7. `docs/07_opencode_agent_workflow.md`

## MVP 요약

- 기능: 오늘의 무료 운세 1회, 카테고리 4종, 결과 카드 공유, streak, 유료 심화 리딩
- 수익화: USDC 소액 결제(심화 리딩/추가 뽑기)
- 아트 방향: "신비한 귀여움" 톤의 마스코트 1종 + 표정팩 8~12종

## 핵심 KPI(초기)

- 방문 -> 뽑기 전환율
- 결과 -> 공유 전환율
- D1/D7 리텐션
- 무료 -> 유료 전환율
- 7일 streak 달성률

## 바로 실행 체크

- [ ] PRD 확정 (MVP 범위 고정)
- [ ] 화면 와이어프레임 4개 확정
- [ ] 운세 콘텐츠 초안 320개(카테고리별 80개) 준비
- [ ] 결제 가격 가설 확정(0.3~0.7 USDC 구간)
- [ ] 이벤트 스키마와 대시보드 초기 버전 연결

## 다음 구현 우선순위

1. 실제 온체인 결제 연동 (현재 심화 해석은 데모)
2. 운세 콘텐츠 풀 확장(카테고리별 80개+)
3. streak/결제/공유 이벤트 로그 적재

## 가정

- Base Mini App 배포와 결제 연동에 필요한 계정/권한은 확보되어 있음
- 초기 운영은 한국어 우선, 추후 다국어 확장 가능
- 런칭 목표는 "기능 완성"보다 "루프 검증"에 우선순위를 둠
