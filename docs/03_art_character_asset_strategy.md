# 03. Art, Character, Asset Strategy

## 1) 아트 디렉션

- 핵심 톤: **신비한 귀여움**
- 감정 키워드: 따뜻함, 위로, 호기심, 몽환
- 금지 방향: 과도한 호러, 극단적 다크 톤, 과한 장식

## 2) 비주얼 시스템

## 컬러(초안)

| 역할 | 색상 | 비고 |
|---|---|---|
| Primary Night | `#1D2A52` | 우주/밤 배경 |
| Mystic Blue | `#4D6FFF` | 버튼/강조 |
| Moon Glow | `#F4E7C5` | 하이라이트 |
| Lucky Mint | `#8FE7C1` | 긍정 포인트 |
| Rose Dust | `#F2B8C6` | 감성 포인트 |

## 타이포(초안)

- 제목: SUIT Bold 또는 Pretendard Bold
- 본문: SUIT Regular 또는 Pretendard Regular
- 숫자/지표: 동일 패밀리 Medium로 통일

## 3) 캐릭터 전략

- MVP 범위: 마스코트 1종 + 표정팩 8~12종
- 캐릭터 역할
  - 홈: 사용자 초대
  - 결과: 감정 반응 강화
  - 결제: 부담 완화/가치 전달 보조

## 표정팩 권장 목록

1. 기본 미소
2. 눈감은 미소
3. 놀람
4. 응원
5. 장난기
6. 진지함
7. 축하
8. 위로
9. 반짝임
10. 졸림(야간 테마)

## 4) 에셋 체크리스트

| 에셋 | 규격 | 수량 |
|---|---|---|
| 앱 아이콘 | 1024x1024 | 1 |
| 커버/OG | 1200x630 | 1~2 |
| 결과 카드 템플릿 | 1080x1920 기준 | 3 |
| 카테고리 배경 | 4종 | 4 |
| 캐릭터 기본 포즈 | 투명 배경 PNG/WebP | 1 |
| 캐릭터 표정팩 | 동일 캔버스/정렬 규칙 | 8~12 |

## 5) 제작 파이프라인

1. 스타일 가이드 문서화(색/선굵기/눈코입 규칙)
2. AI 러프 대량 생성(50~100장)
3. 후보 선정(5~10장)
4. 디자이너 리터치(일관성/저작권/완성도)
5. 내보내기 규칙 적용(WebP 우선, PNG 보조)
6. 실제 UI 합성 후 QA

## 6) 파일 규칙

- 폴더: `assets/characters`, `assets/cards`, `assets/brand`
- 네이밍: `char_orbit_v1_smile.webp`, `card_love_v1.webp`
- 버전 태그 포함: `v1`, `v2` 등

## 7) 캐릭터 생성 프롬프트 샘플 10개

아래 프롬프트는 스타일 일관성을 위해 공통 접두어를 유지합니다.

공통 접두어:

"cute mystical fortune mascot, soft moonlight glow, clean line art, pastel cosmic palette, mobile app sticker style, simple background, high readability"

1. 기본 미소
   - `... smiling gently, front view, hands together, star sparkles around`
2. 놀람
   - `... surprised expression, wide eyes, tiny floating stars`
3. 응원
   - `... cheering pose, one hand up, warm encouraging vibe`
4. 진지함
   - `... calm serious face, looking at crystal orb`
5. 축하
   - `... joyful expression with confetti-like stardust`
6. 위로
   - `... empathetic expression, soft glow, comforting posture`
7. 장난기
   - `... playful wink, small moon icon floating`
8. 반짝임
   - `... magical sparkle burst, confident smile`
9. 졸림
   - `... sleepy cute face, crescent moon pillow motif`
10. 집중
   - `... focused eyes, drawing constellation lines`

## 8) 품질 기준(QA)

- 작은 화면에서도 얼굴/표정 식별 가능
- 결과 카드 위 텍스트와 충돌하지 않음
- 색상 대비 기준 충족
- 용량 최적화(핵심 에셋 300KB 이하 목표)

## 9) 가정

- 초기에는 정적 에셋 중심으로 시작
- 애니메이션은 1~2개 핵심 모션만 도입
- 스타일 최종 결정권자는 PM+디자인 리드
