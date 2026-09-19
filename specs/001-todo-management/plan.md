# Implementation Plan: 할 일 관리 (Todo Management)

**Branch**: `001-todo-management` | **Date**: 2026-09-16 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-todo-management/spec.md`

## Summary

사용자가 할 일을 추가, 목록 조회, 완료 여부 토글, 삭제할 수 있는 기능. Next.js App
Router의 Route Handlers(`app/api/tasks/route.ts`, `app/api/tasks/[id]/route.ts`)로
REST 엔드포인트를 구현하고, Prisma ORM을 통해 로컬 SQLite 파일(`prisma/dev.db`)에
할 일을 저장한다. 모든 API 응답은 JSON으로 통일하고, TypeScript에서 `any`를 쓰지
않는다(헌법 원칙 I~III 준수). 외부 서비스 가입이나 별도 서버 설정은 필요 없다.

## Technical Context

**Language/Version**: TypeScript 5.x (strict 모드), Next.js 16.3.5 (App Router), React 19.2.8

**Primary Dependencies**: Next.js Route Handlers, Prisma ORM(`@prisma/client` + `prisma` CLI)

**Storage**: 로컬 SQLite 파일(`prisma/dev.db`), Prisma가 스키마·마이그레이션·쿼리를 관리

**Testing**: 자동화 테스트 프레임워크는 이번 기능 범위에 포함하지 않는다.
`quickstart.md`의 수동 검증 절차(curl/브라우저)로 종단 간 동작을 확인한다.
(헌법에 테스트 우선 원칙이 없고, 사용자 요청 범위에도 테스트 프레임워크 도입이
없으므로 범위 밖으로 명시한다.)

**Target Platform**: Node.js 서버 런타임(Next.js dev/build)에서 실행되며, 최신
웹 브라우저에서 사용

**Project Type**: 웹 애플리케이션 — 별도의 frontend/backend 레포 분리 없이 단일
Next.js 프로젝트(App Router)로 구성

**Performance Goals**: 해당 없음 — 단일 사용자, 소규모 데이터셋을 대상으로 하는
로컬 앱이므로 별도의 처리량/지연시간 목표를 두지 않는다. 일반적인 CRUD 조작이
사용자에게 즉각적으로 느껴지면 충분하다.

**Constraints**: 외부 서비스 가입이나 별도 서버 프로비저닝 없이 로컬 SQLite 파일만
사용(사용자 명시 제약). 인증/인가 없음(스펙의 Assumptions와 일치).

**Scale/Scope**: 단일 사용자, 소규모 데이터(수십~수백 건의 할 일) 기준으로 설계

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| 원칙 | 적용 여부 | 판정 |
|---|---|---|
| I. Next.js App Router + TypeScript | 모든 라우트를 `app/` 디렉터리의 Route Handler(`route.ts`)와 페이지(`.tsx`)로 구현하고, Pages Router나 `.js`/`.jsx` 파일을 추가하지 않는다. | PASS |
| II. 일관된 JSON API 응답 | `app/api/tasks/**`의 모든 핸들러는 성공/실패 모두 `NextResponse.json`으로 응답하고, 에러는 `{ error: string }` 형태 + 적절한 HTTP 상태 코드로 반환한다. | PASS |
| III. any 타입 금지 | 동적 라우트 파라미터는 `RouteContext<'/api/tasks/[id]'>`로 타입을 얻고, 요청 바디는 명시적 인터페이스로 검증하며, Prisma가 생성하는 타입을 그대로 사용해 `any`를 도입하지 않는다. | PASS |

위반 사항 없음 — Complexity Tracking 섹션은 비워 둔다.

## Project Structure

### Documentation (this feature)

```text
specs/001-todo-management/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
│   └── tasks-api.md
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
app/
├── api/
│   └── tasks/
│       ├── route.ts          # GET(목록 조회) / POST(할 일 추가)
│       └── [id]/
│           └── route.ts      # PATCH(완료 토글) / DELETE(삭제)
├── layout.tsx                 # 기존 루트 레이아웃 (변경 없음)
├── page.tsx                   # 할 일 추가 폼 + 목록 UI (API 연동으로 갱신)
└── globals.css                # 기존 스타일 (변경 없음)

lib/
└── prisma.ts                  # PrismaClient 싱글턴(HMR 재사용)

prisma/
└── schema.prisma              # Todo 모델 정의 (SQLite datasource → prisma/dev.db)
```

**Structure Decision**: 별도의 `frontend/`·`backend/` 분리 없이 기존 Next.js
App Router 프로젝트 구조를 그대로 확장한다. API 로직은 `app/api/tasks` 하위
Route Handler에, 데이터 접근 계층은 `lib/prisma.ts` + `prisma/schema.prisma`에
둔다. 자동화 테스트 디렉터리(`tests/`)는 이번 범위에서 생성하지 않는다(위 Testing
항목 참고).

## Complexity Tracking

*해당 없음 — Constitution Check에서 위반 사항이 발견되지 않았다.*
