# API Contract: /api/tasks

Next.js Route Handlers로 구현되는 REST 엔드포인트. 모든 응답은 JSON이다
(헌법 원칙 II). 에러 응답은 항상 `{ "error": string }` 형태다.

Base path: `/api/tasks`

---

## GET /api/tasks

목록 조회 (FR-004, User Story 1).

**Request**: 바디 없음.

**Response 200**:

```json
[
  { "id": 1, "title": "우유 사기", "completed": false, "createdAt": "2026-09-16T10:00:00.000Z" }
]
```

- 항목이 없으면 `[]`를 반환한다(FR-008 — 빈 배열이 곧 "비어있음" 상태를 나타내며,
  클라이언트가 빈 상태 UI를 렌더링한다).
- 정렬: `createdAt` 오름차순(추가된 순서).

**Response 5xx**: `{ "error": "Internal Server Error" }`

---

## POST /api/tasks

할 일 추가 (FR-001, FR-002, FR-003, User Story 1).

**Request body**:

```json
{ "title": "우유 사기" }
```

**Response 201** (성공):

```json
{ "id": 1, "title": "우유 사기", "completed": false, "createdAt": "2026-09-16T10:00:00.000Z" }
```

**Response 400** (검증 실패 — 빈 제목/공백/200자 초과, FR-002):

```json
{ "error": "Title is required and must be 1-200 characters." }
```

---

## PATCH /api/tasks/{id}

완료 여부 토글 (FR-005, User Story 2). 요청 바디 없이 현재 `completed` 값을
서버에서 반전시킨다(진짜 "토글" — research.md #4 참고).

**Path params**: `id` — 정수.

**Request body**: 없음(무시됨).

**Response 200** (성공, 토글된 최신 상태 반환):

```json
{ "id": 1, "title": "우유 사기", "completed": true, "createdAt": "2026-09-16T10:00:00.000Z" }
```

**Response 404** (대상 없음, FR-005 · Clarifications 2026-09-16 Q1):

```json
{ "error": "Todo not found." }
```

---

## DELETE /api/tasks/{id}

삭제 (FR-006, User Story 3).

**Path params**: `id` — 정수.

**Response 200** (성공):

```json
{ "id": 1 }
```

**Response 404** (대상 없음, FR-006 · Clarifications 2026-09-16 Q1):

```json
{ "error": "Todo not found." }
```

---

## 공통 규칙

- 모든 성공/에러 응답은 `Content-Type: application/json`이며 `NextResponse.json`으로
  생성한다(헌법 원칙 II).
- `id` 경로 파라미터가 정수로 파싱되지 않으면 400 `{ "error": "Invalid id." }`를
  반환한다.
