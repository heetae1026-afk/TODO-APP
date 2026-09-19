<!--
Sync Impact Report
- Version change: [TEMPLATE] → 1.0.0 (initial ratification)
- Modified principles: n/a (first adoption; template placeholders replaced)
- Added sections:
  - I. Next.js App Router + TypeScript
  - II. 일관된 JSON API 응답
  - III. any 타입 금지
  - 기술 스택 및 품질 기준 (Section 2)
  - 개발 워크플로우 (Section 3)
  - Governance
- Removed sections: none (template scaffold only)
- Deferred / TODO placeholders: none
-->

# mini-todo-sqlite Constitution

## Core Principles

### I. Next.js App Router + TypeScript
프로젝트의 모든 코드는 Next.js App Router(`app/` 디렉터리) 구조와 TypeScript로
작성해야 한다. Pages Router(`pages/` 디렉터리) 방식은 사용하지 않는다. 모든 소스
파일은 `.ts` 또는 `.tsx` 확장자를 사용하며, 신규 코드에 순수 JavaScript 파일
(`.js`/`.jsx`)을 추가하지 않는다.
**Rationale**: App Router와 TypeScript로 스택을 고정하면 라우팅 방식과 타입
시스템이 프로젝트 전반에서 일관되게 유지되어, 서버 컴포넌트/클라이언트 컴포넌트
경계와 타입 계약을 예측 가능하게 관리할 수 있다.

### II. 일관된 JSON API 응답
`app/api/**`의 모든 API 라우트 핸들러는 성공과 실패를 가리지 않고 항상 JSON
형식으로만 응답해야 한다(`NextResponse.json` 또는 동등한 방식 사용). 에러 응답도
HTML이나 플레인 텍스트가 아닌 JSON 객체(예: `{ error: string }` 형태)로 반환하며,
적절한 HTTP 상태 코드를 함께 설정한다.
**Rationale**: 응답 형식을 JSON으로 통일하면 클라이언트가 성공/실패 케이스를
분기 없이 동일한 방식으로 파싱할 수 있고, 예외적인 HTML 에러 페이지가 API
소비자에게 노출되는 것을 방지한다.

### III. any 타입 금지 (NON-NEGOTIABLE)
TypeScript 코드에서 `any` 타입을 사용하지 않는다. 타입을 알 수 없는 값은
`unknown`으로 선언한 뒤 타입 가드나 스키마 검증을 통해 좁혀야 하며, 외부
라이브러리나 SQLite 쿼리 결과처럼 타입이 불명확한 경우에도 명시적인 인터페이스나
타입 단언(근거가 있는 경우)을 사용한다. `tsconfig.json`의 `strict` 옵션은 항상
활성 상태를 유지해야 한다.
**Rationale**: `any`는 TypeScript의 타입 검사를 무력화시켜 런타임 오류를
컴파일 타임에 잡아낼 기회를 없앤다. `unknown`과 타입 가드를 강제하면 타입
안정성이라는 프로젝트의 핵심 목표가 코드 전반에서 실제로 지켜진다.

## 기술 스택 및 품질 기준

- 런타임/프레임워크: Next.js(App Router), React, TypeScript(strict 모드 고정).
- 데이터 저장소: SQLite. DB 접근 계층에는 쿼리 결과에 대한 명시적 타입/인터페이스를
  정의하여 사용처에서 `any`가 발생하지 않도록 한다.
- 린트: `npm run lint`(ESLint)를 통과해야 하며, `no-explicit-any` 규칙 위반은
  허용하지 않는다.
- 타입 검사: 빌드 전 `tsc --noEmit` 또는 `next build`가 타입 오류 없이
  통과해야 한다.

## 개발 워크플로우

- API 라우트를 추가하거나 수정하는 모든 변경은 성공/에러 응답이 모두 JSON
  형식인지 확인한 뒤 병합한다.
- 코드 리뷰(또는 자체 점검) 시 위 세 가지 핵심 원칙(App Router/TypeScript,
  JSON 응답 통일, any 금지) 준수 여부를 체크리스트로 확인한다.
- 원칙을 위반해야 하는 불가피한 예외가 발생하면, 이유와 대안을 코드 주석 또는
  PR 설명에 명시하고 이 문서(Governance 절차)에 따라 개정을 검토한다.

## Governance

본 헌법은 이 프로젝트의 다른 모든 관행과 문서보다 우선한다. 개발 관행이나 다른
가이드 문서가 본 헌법과 충돌하는 경우, 본 헌법을 따른다.

- **개정 절차**: 원칙 추가/변경/삭제는 변경 사유와 영향 범위를 명시한 뒤 이
  파일을 직접 수정하고, 아래 버전 정보와 Sync Impact Report를 함께 갱신한다.
- **버전 정책**: 시맨틱 버저닝을 따른다.
  - MAJOR: 기존 원칙의 제거 또는 하위 호환되지 않는 재정의.
  - MINOR: 새로운 원칙 또는 실질적인 지침 추가.
  - PATCH: 표현 수정, 오타 수정 등 비의미적 변경.
- **준수 검토**: 신규 기능 스펙(`/speckit-specify`), 계획(`/speckit-plan`),
  작업 목록(`/speckit-tasks`) 및 구현(`/speckit-implement`) 단계에서 본 헌법의
  원칙 준수 여부를 확인해야 한다.

**Version**: 1.0.0 | **Ratified**: 2026-09-16 | **Last Amended**: 2026-09-16
