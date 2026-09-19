# Phase 1 Data Model: 할 일 관리 (Todo Management)

## Entity: Todo

스펙의 Key Entities(`할 일`)에 대응하는 단일 엔티티. 관계된 다른 엔티티는 없다.

| 필드 | 타입 | 제약/기본값 | 설명 |
|---|---|---|---|
| `id` | `Int` (autoincrement) | Primary Key | 할 일의 고유 식별자. 완료 토글·삭제 시 이 값으로 대상을 지정한다(FR-005, FR-006). |
| `title` | `String` | 필수. 트림 후 공백 제외 1~200자(FR-002) | 할 일 제목. |
| `completed` | `Boolean` | 기본값 `false`(FR-003) | 완료 여부. |
| `createdAt` | `DateTime` | 기본값 `now()` | 생성 시각. 목록 정렬 기준(Assumptions: 추가된 순서)으로 사용. |

### Prisma 스키마 정의

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}

model Todo {
  id        Int      @id @default(autoincrement())
  title     String
  completed Boolean  @default(false)
  createdAt DateTime @default(now())
}
```

### 검증 규칙 (애플리케이션 레벨, FR-002 대응)

- `title`은 트림 후 빈 문자열이면 거부 (400).
- `title`은 트림 후 200자를 초과하면 거부 (400).
- `completed`, `id`, `createdAt`은 클라이언트가 생성 시 지정할 수 없다(서버가 관리).

### 상태 전이 (Lifecycle)

```text
(생성) → completed = false
   completed = false ⇄ completed = true   (PATCH /api/tasks/[id] 로 토글, FR-005)
   completed = false | true → (삭제됨, 복구 불가)   (DELETE /api/tasks/[id], FR-006)
```

### 조회 정렬

- `GET /api/tasks`는 `createdAt` 오름차순(추가된 순서, Assumptions)으로 정렬해
  반환한다.

### API 응답 DTO

클라이언트에 노출되는 형태는 Prisma 모델과 동일한 필드를 사용하되, 날짜는
ISO 8601 문자열로 직렬화한다(JSON에는 `Date` 타입이 없으므로).

```ts
interface TodoDTO {
  id: number
  title: string
  completed: boolean
  createdAt: string // ISO 8601
}
```
