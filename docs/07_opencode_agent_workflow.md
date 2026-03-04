# 07. OpenCode Agent Workflow

이 문서는 Daily Orbit 문서/개발 작업을 OpenCode에서 병렬 에이전트로 안정적으로 운영하기 위한 실행 가이드입니다.

## 1) 역할 분리

| Agent | 책임 범위 | 출력물 |
|---|---|---|
| Agent A (Product) | 제품 요구사항/플로우 | PRD, 화면 요구사항 |
| Agent B (Art) | 비주얼/캐릭터 전략 | 아트 가이드, 에셋 계획 |
| Agent C (Biz+Data) | 수익화/온체인/KPI | 결제 전략, 이벤트, 로드맵 |
| Integrator | 문서 통합/일관성 | README, 용어/수치 통합본 |

## 2) 공통 입력 템플릿

```text
[Context]
- Repo: <repo_url>
- Branch: <branch_name>
- Goal: <한 줄 목표>

[Task]
- 해야 할 일 1
- 해야 할 일 2

[In Scope]
- ...

[Out of Scope]
- ...

[Deliverables]
- path/to/file1
- path/to/file2

[Acceptance Criteria]
- [ ] 기준 1
- [ ] 기준 2

[Output Format]
- changed files
- 5-line summary
- unresolved risks
```

## 3) Agent별 완료 조건

## Agent A

- [ ] 문제/해결/범위 정의 완료
- [ ] 화면별 CTA/상태 정의 완료
- [ ] 예외 시나리오 포함

## Agent B

- [ ] "신비한 귀여움" 스타일 정의
- [ ] 에셋 체크리스트/규격 확정
- [ ] 제작 파이프라인 문서화

## Agent C

- [ ] 무료/유료 경계 및 가격 가설 작성
- [ ] 결제/가스 UX 실패 시나리오 포함
- [ ] KPI 및 이벤트 스키마 작성

## Integrator

- [ ] 문서 간 용어/수치 충돌 제거
- [ ] README 인덱스/읽는 순서 정리
- [ ] 실행 체크리스트 통합

## 4) 핸드오프 규칙

1. 각 Agent는 자신의 문서에서 가정/결정/미결 항목을 분리 기록
2. Integrator는 중복 섹션을 제거하고 기준 문서를 확정
3. 최종 머지 전, KPI와 가격 표기 일관성 재검증

## 5) 검증 명령(권장)

```bash
git status
git diff -- README.md docs/
```

문서 품질 검증 포인트:

- 파일 경로와 문서 인덱스 일치
- 체크리스트 항목이 실행 가능한 문장인지 확인
- 모호한 문장에 "가정" 태그 존재 여부 확인

## 6) 결과 보고 포맷

```text
1) Changed files
2) Summary (5 lines)
3) Remaining risks (max 3)
4) Next actions (max 3)
```

## 7) 운영 팁

- 처음부터 큰 범위를 주지 말고, P0부터 확정
- 에이전트 간 중복 작성을 허용하되 Integrator 단계에서 정리
- 결제/온체인 영역은 항상 실패 케이스부터 설계
