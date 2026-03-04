# 05. KPI and Event Tracking

## 1) 측정 목표

Daily Orbit의 초기 목표는 수익 극대화가 아니라, 반복 사용 루프의 성립 여부를 검증하는 것입니다.

## 2) North Star

- **Weekly Returning Draw Users (WRDU)**
  - 최근 7일 내 2회 이상 운세를 뽑은 사용자 수

## 3) 핵심 KPI 정의

| KPI | 정의 | 목표(초기 가설) |
|---|---|---|
| 방문 -> 뽑기 전환율 | 앱 진입 대비 뽑기 완료 비율 | 60%+ |
| 결과 -> 공유 전환율 | 결과 조회 대비 공유 완료 비율 | 20%+ |
| D1 리텐션 | 첫 방문 다음날 재방문 비율 | 25%+ |
| D7 리텐션 | 7일 내 재방문 비율 | 12%+ |
| 무료 -> 유료 전환율 | 무료 경험 사용자 중 결제 비율 | 3%+ |
| 7일 streak 달성률 | 활성 사용자 중 7일 streak 달성 비율 | 8%+ |

## 4) 이벤트 택소노미

## 필수 이벤트

| 이벤트명 | 트리거 | 주요 파라미터 |
|---|---|---|
| `app_opened` | 앱 첫 로드 | source, wallet_connected |
| `draw_started` | 뽑기 버튼 클릭 | category, is_free |
| `draw_completed` | 결과 생성 완료 | category, fortune_id |
| `result_viewed` | 결과 화면 진입 | category, score_bucket |
| `share_clicked` | 공유 버튼 클릭 | share_type |
| `share_completed` | 공유 완료 | share_type |
| `paywall_viewed` | 유료 영역 노출 | product_type, price |
| `payment_started` | 결제 승인 시작 | product_type, price |
| `payment_completed` | 결제 성공 | product_type, amount, tx_hash |
| `payment_failed` | 결제 실패 | error_code, product_type |
| `streak_updated` | streak 갱신 | streak_count |

## 권장 파라미터 공통

- `user_id`
- `session_id`
- `timestamp`
- `app_version`
- `network` (base)

## 5) 퍼널 정의

### 코어 퍼널

`app_opened -> draw_started -> draw_completed -> share_completed`

### 결제 퍼널

`result_viewed -> paywall_viewed -> payment_started -> payment_completed`

## 6) 대시보드 최소 구성

1. 일별/주별 활성 사용자
2. 코어 퍼널 전환율
3. 결제 퍼널 전환율
4. 가격 포인트별 결제 성공률
5. streak 분포(1일, 3일, 7일, 14일, 30일)

## 7) 실험 설계 가이드

- 실험 단위는 1주 단위로 고정
- 한 번에 1~2개 변수만 변경
- KPI 악화 시 즉시 롤백 기준을 사전 정의

예시 실험:

1. 심화 리딩 가격: 0.3 vs 0.5 USDC
2. paywall 카피: 감성형 vs 실용형
3. 공유 CTA 위치: 상단 vs 하단

## 8) 데이터 품질 체크

- [ ] 이벤트 누락률 1% 이하
- [ ] 중복 이벤트 방지(idempotency key)
- [ ] 결제 이벤트와 tx_hash 매핑 검증
- [ ] 타임존 일관성(UTC 저장)

## 9) 가정

- 이벤트 파이프라인은 런칭 시점에 준비되어 있음
- 사용자 식별 체계(user_id/session_id)는 안정적으로 발급됨
- 대시보드는 MVP 단계에서 단일 도구로 운영
