# Phase 0 Research: 할 일 관리 (Todo Management)

Technical Context에 `NEEDS CLARIFICATION`으로 남은 항목은 없다. 아래는 사용자가
지정한 기술 스택(Next.js Route Handlers + Prisma + SQLite)을 이 프로젝트에
적용하기 위해 확인이 필요했던 결정 사항들이다.

## 1. Route Handler 동적 파라미터 타이핑 (any 금지 대응)

- **Decision**: `app/api/tasks/[id]/route.ts`에서 컨텍스트 파라미터는
  `RouteContext<'/api/tasks/[id]'>` 헬퍼 타입을 사용하고, `params`는
  `Promise<{ id: string }>`이므로 `await ctx.params`로 값을 꺼낸다.
- **Rationale**: 설치된 Next.js 버전(16.3.5) 문서
  (`node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/route.md`)
  기준으로 `context.params`는 v15부터 Promise이며, `RouteContext<'경로literal'>`
  전역 헬퍼로 별도 import 없이 타입 안전하게 사용할 수 있다. 이는 헌법 원칙
  III(any 금지)을 자동 생성 타입만으로 만족시킨다.
- **Alternatives considered**: `{ params }: { params: any }` — 헌법 위반으로 제외.
  수동으로 `{ params: Promise<{ id: string }> }` 타입을 직접 작성하는 방법도
  가능하지만, `RouteContext` 헬퍼가 타입 생성기와 동기화되어 더 안전하므로 채택.

## 2. ORM 및 데이터베이스 연결

- **Decision**: Prisma ORM + SQLite datasource(`prisma/schema.prisma`,
  파일 경로 `file:./dev.db`). `@prisma/client`를 `lib/prisma.ts`에서 싱글턴으로
  생성해 재사용한다.
- **Rationale**: 사용자가 명시적으로 지정한 스택. Prisma는 SQLite 쿼리 결과에
  대해 자동으로 타입을 생성하므로 `any` 없이 타입 안전한 DB 접근 계층을 구현할
  수 있다. Next.js 개발 서버의 HMR로 인해 모듈이 재평가될 때마다 새
  `PrismaClient`가 생성되어 연결이 누적되는 문제를 막기 위해, `globalThis`에
  캐시하는 표준 싱글턴 패턴을 사용한다.
- **Alternatives considered**: `better-sqlite3`를 직접 사용하는 방법은 쿼리
  결과 타입을 수작업으로 선언해야 해서 `any` 유입 위험이 커지고, 사용자가 이미
  Prisma를 명시했으므로 채택하지 않는다.

## 3. API 응답 형식 및 에러 처리

- **Decision**: 성공 응답은 `NextResponse.json(data, { status })`로, 실패 응답은
  `NextResponse.json({ error: string }, { status })`로 통일한다. 상태 코드는
  검증 실패 400, 대상 없음 404, 그 외 서버 오류 500을 사용한다.
- **Rationale**: 헌법 원칙 II(일관된 JSON 응답)를 만족시키며, 클라이언트가 항상
  동일한 JSON 형태를 파싱하도록 보장한다.
- **Alternatives considered**: 에러 시 HTML 오류 페이지나 상태 코드만 반환하는
  방식은 헌법에 위배되어 제외.

## 4. 완료 여부 토글 동작 방식

- **Decision**: `PATCH /api/tasks/[id]`는 요청 바디 없이 서버에서 현재
  `completed` 값을 읽어 반전시킨 뒤 저장한다(진짜 "토글").
- **Rationale**: 스펙(User Story 2, FR-005)이 명시적으로 "토글"을 요구하며,
  클라이언트가 현재 상태를 알 필요 없이 버튼 클릭 한 번으로 전환할 수 있어
  SC-003("한 번의 조작으로 전환")을 가장 단순하게 만족시킨다.
- **Alternatives considered**: 바디로 `{ completed: boolean }`를 받아 명시적으로
  설정하는 방식은 클라이언트가 현재 상태를 함께 추적해야 하므로 더 복잡하고,
  스펙의 "토글" 표현과 정확히 일치하지 않아 채택하지 않는다.

## 5. 테스트 전략

- **Decision**: 이번 기능에서는 자동화 테스트 프레임워크(Jest/Vitest 등)를
  새로 도입하지 않는다. `quickstart.md`에 정리된 수동 검증 절차(curl 명령 또는
  브라우저 조작)로 각 사용자 스토리의 인수 시나리오를 확인한다.
- **Rationale**: 헌법에 테스트 우선(TDD) 원칙이 없고, 사용자 요청 범위도 REST
  엔드포인트 구현과 Prisma/SQLite 연동에 한정되어 있다. 테스트 프레임워크
  도입은 범위를 벗어나는 결정이므로 이번 계획에서는 제외하고, 필요 시 별도
  기능/작업으로 다룬다.
- **Alternatives considered**: Vitest + Supertest 도입은 향후 고려할 수 있으나,
  현재 요청 범위 밖이라 채택하지 않는다.

## 6. 제목 유효성 검증 위치

- **Decision**: 제목 트림·빈 문자열·200자 초과 검증은 API 핸들러(서버) 레벨에서
  수행하며, Prisma 스키마에는 `title String`(길이 제약은 애플리케이션 레벨에서
  처리)으로 정의한다.
- **Rationale**: SQLite는 컬럼 길이 제약을 강제하지 않으므로, 스펙의 FR-002(빈
  제목/200자 초과 거부)를 만족시키려면 애플리케이션 코드에서 검증해야 한다.
  서버 측 검증은 클라이언트를 신뢰하지 않는 원칙과도 일치한다.
- **Alternatives considered**: DB 트리거로 강제하는 방법은 SQLite/Prisma
  조합에서 불필요하게 복잡하여 채택하지 않는다.
