---

description: "Task list template for feature implementation"
---

# Tasks: 할 일 관리 (Todo Management)

**Input**: Design documents from `/specs/001-todo-management/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/tasks-api.md](./contracts/tasks-api.md), [quickstart.md](./quickstart.md)

**Tests**: 자동화 테스트는 스펙/계획에서 요청되지 않았으며, research.md #5의 결정에
따라 이번 범위에서 제외한다. 검증은 Polish 단계의 quickstart.md 수동 실행으로
대체한다.

**Organization**: 작업은 spec.md의 사용자 스토리(P1/P2/P3)별로 그룹화되어 있어
각 스토리를 독립적으로 구현·검증할 수 있다.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 병렬 실행 가능(다른 파일, 완료되지 않은 작업에 의존하지 않음)
- **[Story]**: 이 작업이 속한 사용자 스토리(US1, US2, US3)
- 모든 작업 설명에 정확한 파일 경로를 포함한다.

## Path Conventions

단일 Next.js App Router 프로젝트(plan.md의 Structure Decision 참고). `frontend/`·
`backend/` 분리 없음.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prisma + SQLite 의존성 및 초기 설정

- [X] T001 `npm install prisma --save-dev`와 `npm install @prisma/client`를 실행해
      package.json에 Prisma 의존성을 추가한다.
- [X] T002 `prisma/schema.prisma` 파일을 생성한다. data-model.md의 스키마를 그대로
      사용한다: `generator client { provider = "prisma-client-js" }`,
      `datasource db { provider = "sqlite", url = "file:./dev.db" }`, 그리고
      `Todo` 모델(`id Int @id @default(autoincrement())`,
      `title String`, `completed Boolean @default(false)`,
      `createdAt DateTime @default(now())`).
- [X] T003 [P] `.env` 파일에 `DATABASE_URL="file:./dev.db"`를 추가하고,
      `.gitignore`에 `/prisma/dev.db`와 `.env`가 커밋되지 않도록 항목을 추가한다.

**Checkpoint**: Prisma 스키마와 환경설정이 준비됨

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 모든 사용자 스토리가 공통으로 의존하는 DB 마이그레이션과 공유 코드

**⚠️ CRITICAL**: 이 단계가 끝나기 전에는 어떤 사용자 스토리 작업도 시작할 수 없다.

- [X] T004 `npx prisma migrate dev --name init`을 실행해 `prisma/dev.db`에
      `Todo` 테이블을 생성하고 Prisma Client를 생성한다.
      (Prisma 7 아키텍처 변경으로 `prisma.config.ts` + `@prisma/adapter-better-sqlite3`
      드라이버 어댑터를 추가로 도입했다 — 아래 구현 노트 참고.)
- [X] T005 `lib/prisma.ts`에 `PrismaClient` 싱글턴을 구현한다(research.md #2:
      `globalThis`에 캐시해 Next.js 개발 서버 HMR로 인한 클라이언트 중복 생성을
      방지). `any`를 사용하지 않고 `PrismaClient` 타입을 그대로 export한다.
- [X] T006 [P] `lib/todo.ts`에 공유 `TodoDTO` 인터페이스(`{ id: number; title: string;
      completed: boolean; createdAt: string }`, data-model.md 참고)와 JSON 에러
      응답 헬퍼(예: `jsonError(message: string, status: number)` →
      `NextResponse.json({ error: message }, { status })`)를 정의해 모든
      API 라우트에서 재사용한다(헌법 원칙 II: 통일된 JSON 에러 형식).

**Checkpoint**: DB와 공유 타입/헬퍼 준비 완료 — 이제 사용자 스토리 구현을 시작할 수 있다.

---

## Phase 3: User Story 1 - 할 일 추가 및 목록 확인 (Priority: P1) 🎯 MVP

**Goal**: 사용자가 제목을 입력해 할 일을 추가하고, 추가된 항목이 목록에 나타나는
것을 확인할 수 있다(FR-001~FR-004, FR-008).

**Independent Test**: `POST /api/tasks`로 제목을 보내 할 일을 생성한 뒤
`GET /api/tasks`로 방금 생성한 항목이 미완료 상태로 포함되어 있는지 확인하는
것만으로 독립적으로 검증할 수 있다(브라우저 UI 또는 curl 모두 가능).

### Implementation for User Story 1

- [X] T007 [US1] `app/api/tasks/route.ts`에 Route Handler를 구현한다:
  - `GET`: `prisma.todo.findMany({ orderBy: { createdAt: 'asc' } })`로 전체 목록을
    조회해 `TodoDTO[]`로 매핑 후 `NextResponse.json(...)`으로 반환한다(FR-004).
    항목이 없으면 빈 배열 `[]`을 반환한다(FR-008).
  - `POST`: 요청 바디에서 `title`을 읽어 트림한다. data-model.md 제약
    "트림 후 공백 제외 1~200자"를 위반하면(빈 문자열 또는 200자 초과)
    `jsonError("Title is required and must be 1-200 characters.", 400)`을
    반환한다(FR-002). 유효하면 `completed: false` 기본값으로 생성하고(FR-003)
    `NextResponse.json(dto, { status: 201 })`을 반환한다(FR-001).
  - 두 핸들러 모두 `lib/prisma.ts`의 싱글턴과 `lib/todo.ts`의 `TodoDTO`/에러
    헬퍼를 사용하며 `any`를 사용하지 않는다(헌법 원칙 II, III).
- [X] T008 [US1] `app/page.tsx`를 갱신해 기본 Next.js 스타터 화면을 할 일 UI로
      교체한다: 제목 입력 필드와 추가 버튼(제출 시 `POST /api/tasks` 호출),
      `GET /api/tasks`로 불러온 목록을 제목 + 완료 여부와 함께 렌더링,
      목록이 비어 있을 때 안내 문구 표시(FR-008), `POST`가 400을 반환하면
      입력 필드 아래에 에러 메시지를 표시한다(Acceptance Scenario 3).

**Checkpoint**: 이 시점에서 User Story 1은 완전히 동작하며 독립적으로 검증 가능하다.

---

## Phase 4: User Story 2 - 완료 여부 토글 (Priority: P2)

**Goal**: 사용자가 목록의 특정 할 일을 완료 ↔ 미완료로 전환할 수 있다(FR-005).

**Independent Test**: (User Story 1로 생성했거나 Prisma Studio/`prisma db seed`로
직접 넣은) 기존 할 일 하나에 `PATCH /api/tasks/{id}`를 호출해 `completed`가
반전되는지, 존재하지 않는 id에 대해 404가 반환되는지 확인하는 것만으로 독립적으로
검증할 수 있다.

### Implementation for User Story 2

- [X] T009 [US2] `app/api/tasks/[id]/route.ts`를 생성하고 `PATCH` 핸들러를
      구현한다: `RouteContext<'/api/tasks/[id]'>`로 `params`를 타입 안전하게
      받아 `await ctx.params`에서 `id`를 꺼내 정수로 파싱한다(파싱 실패 시
      `jsonError("Invalid id.", 400)`). 해당 id의 `Todo`를 조회해 없으면
      `jsonError("Todo not found.", 404)`를 반환한다(FR-005,
      Clarifications 2026-09-16 Q1). 존재하면 현재 `completed` 값을 반전시켜
      저장하고(바디 없이 서버가 직접 토글 — research.md #4) 갱신된 `TodoDTO`를
      `NextResponse.json(dto, { status: 200 })`으로 반환한다. `any`를
      사용하지 않는다(헌법 원칙 III).
- [X] T010 [US2] `app/page.tsx`의 목록 항목마다 완료 토글 컨트롤(체크박스 또는
      버튼)을 추가해 클릭 시 `PATCH /api/tasks/{id}`를 호출하고, 응답으로 받은
      `completed` 값으로 해당 항목의 UI 상태를 갱신한다(Acceptance Scenarios 1-2).
      404 응답을 받으면 해당 항목을 목록에서 제거하고 에러를 표시한다.

**Checkpoint**: User Story 1과 2가 모두 독립적으로 동작한다.

---

## Phase 5: User Story 3 - 할 일 삭제 (Priority: P3)

**Goal**: 사용자가 목록에서 특정 할 일을 삭제할 수 있다(FR-006).

**Independent Test**: 기존 할 일 하나에 `DELETE /api/tasks/{id}`를 호출한 뒤
`GET /api/tasks` 목록에서 더 이상 나타나지 않는지, 존재하지 않는 id에 대해 404가
반환되는지 확인하는 것만으로 독립적으로 검증할 수 있다.

### Implementation for User Story 3

- [X] T011 [US3] `app/api/tasks/[id]/route.ts`(T009에서 생성된 파일)에 `DELETE`
      핸들러를 추가한다: `PATCH`와 동일한 방식으로 `id`를 파싱하고, 대상이
      없으면 `jsonError("Todo not found.", 404)`를 반환한다(FR-006,
      Clarifications 2026-09-16 Q1). 존재하면 `prisma.todo.delete(...)`로
      영구 삭제한 뒤 `NextResponse.json({ id }, { status: 200 })`을 반환한다.
- [X] T012 [US3] `app/page.tsx`의 목록 항목마다 삭제 버튼을 추가해 클릭 시
      `DELETE /api/tasks/{id}`를 호출하고, 성공하면 해당 항목을 UI 목록에서
      즉시 제거한다(Acceptance Scenario 1).

**Checkpoint**: 세 사용자 스토리가 모두 독립적으로 동작한다.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: 전체 기능에 대한 헌법 준수 확인 및 종단 간 검증

- [X] T013 [P] `npm run lint`을 실행해 ESLint 경고/오류(특히
      `no-explicit-any`)가 없는지 확인하고 발견된 문제를 수정한다.
- [X] T014 [P] `npx tsc --noEmit`(또는 `next build`)을 실행해 타입 오류 없이
      통과하는지 확인한다(헌법 "기술 스택 및 품질 기준").
- [X] T015 [quickstart.md](./quickstart.md)의 모든 시나리오(User Story 1~3 및
      엣지 케이스: 빈 제목, 200자 초과, 존재하지 않는 id)를 개발 서버에서
      실행해 [contracts/tasks-api.md](./contracts/tasks-api.md)에 정의된 상태
      코드/JSON 형태와 일치하는지 확인한다.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 의존성 없음 — 즉시 시작 가능
- **Foundational (Phase 2)**: Setup 완료 후 시작 — 모든 사용자 스토리를 막는다(BLOCKS)
- **User Story 1 (Phase 3)**: Foundational 완료 후 시작 가능, 다른 스토리에 의존하지 않음
- **User Story 2 (Phase 4)**: Foundational 완료 후 시작 가능. T009는 새 파일
  `app/api/tasks/[id]/route.ts`를 생성한다(US1과 파일을 공유하지 않음).
- **User Story 3 (Phase 5)**: Foundational 완료 후 시작 가능하지만, T011은 T009가
  생성한 `app/api/tasks/[id]/route.ts`에 `DELETE` 핸들러를 추가하므로 **T009 이후에
  진행**해야 한다(같은 파일에 대한 편집 충돌 방지).
- **Polish (Phase 6)**: 구현하기로 한 모든 사용자 스토리 완료 후 진행

### Within Each User Story

- Route Handler 구현(API) → UI 연동 순서로 진행한다(예: T007 → T008).

### Parallel Opportunities

- Setup 단계의 T003은 T001/T002와 파일이 달라 병렬 가능.
- Foundational 단계의 T006은 T004/T005와 파일이 달라 병렬 가능(단, T005의
  `lib/prisma.ts`가 먼저 존재해야 US1~US3 라우트가 이를 import할 수 있음).
- User Story 1과 User Story 2는 서로 다른 파일(`app/api/tasks/route.ts` vs
  `app/api/tasks/[id]/route.ts`)을 다루므로 Foundational 완료 후 병렬로 진행할
  수 있다. 단, User Story 3(T011)은 User Story 2(T009)가 만든 파일에 이어서
  작업해야 하므로 US2 이후에 진행한다.
- Polish 단계의 T013, T014는 서로 다른 도구를 실행하므로 병렬 가능.

---

## Parallel Example: Setup + Foundational

```bash
# Setup 단계
Task: "npm install prisma --save-dev / @prisma/client 추가 (package.json)"
Task: ".env에 DATABASE_URL 추가 및 .gitignore 갱신"   # T003, T001/T002와 병렬 가능

# Foundational 단계 (T004, T005 완료 후)
Task: "lib/todo.ts에 TodoDTO/jsonError 헬퍼 정의"      # T006, T004/T005와 병렬 가능
```

---

## Implementation Strategy

### MVP First (User Story 1만)

1. Phase 1: Setup 완료
2. Phase 2: Foundational 완료 (필수 — 모든 스토리를 막음)
3. Phase 3: User Story 1 완료
4. **중단 후 검증**: quickstart.md 시나리오 1로 User Story 1을 독립적으로 테스트
5. 여기까지가 MVP — 할 일 추가/조회만으로도 가치를 제공한다.

### Incremental Delivery

1. Setup + Foundational 완료 → 기반 준비
2. User Story 1 추가 → 독립 검증 → MVP 데모 가능
3. User Story 2 추가 → 독립 검증 → 완료 토글까지 지원
4. User Story 3 추가 → 독립 검증 → 삭제까지 지원해 스펙 전체 충족
5. Polish 단계로 헌법 준수(lint/타입체크) 및 전체 quickstart 재검증

## Notes

- `[P]` 작업 = 서로 다른 파일, 완료되지 않은 작업에 의존하지 않음
- `[Story]` 라벨은 작업을 특정 사용자 스토리에 매핑해 추적성을 제공한다
- 각 사용자 스토리는 독립적으로 완료·검증 가능해야 한다
- 작업 완료 후 또는 논리적 단위별로 커밋한다
- 각 체크포인트에서 멈춰 해당 스토리를 독립적으로 검증할 수 있다
