# Quickstart: 할 일 관리 (Todo Management)

이 문서는 구현 후 각 사용자 스토리가 실제로 동작하는지 수동으로 검증하는
절차다. 자동화 테스트는 이번 범위에 포함하지 않는다(research.md #5 참고).

## 사전 준비

```bash
npm install                # Prisma 등 의존성 설치 (package.json에 추가된 이후)
npx prisma migrate dev     # prisma/dev.db 생성 및 Todo 테이블 마이그레이션
npm run dev                # http://localhost:3000 에서 Next.js 개발 서버 실행
```

- 데이터 모델: [data-model.md](./data-model.md)
- API 계약 상세: [contracts/tasks-api.md](./contracts/tasks-api.md)

## 시나리오 1 — 할 일 추가 및 목록 확인 (User Story 1, P1)

```bash
curl -s -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"우유 사기"}'
# 기대: 201, { id, title: "우유 사기", completed: false, createdAt }

curl -s http://localhost:3000/api/tasks
# 기대: 200, 방금 추가한 항목을 포함한 배열
```

**빈 제목 거부 확인**:

```bash
curl -s -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"   "}'
# 기대: 400, { "error": "..." }
```

브라우저에서 `http://localhost:3000`을 열어 같은 흐름(입력 → 추가 → 목록 표시)을
UI로도 확인한다.

## 시나리오 2 — 완료 여부 토글 (User Story 2, P2)

```bash
# 위에서 생성한 todo의 id를 사용 (예: 1)
curl -s -X PATCH http://localhost:3000/api/tasks/1
# 기대: 200, completed: true

curl -s -X PATCH http://localhost:3000/api/tasks/1
# 기대: 200, completed: false (다시 토글)
```

## 시나리오 3 — 삭제 (User Story 3, P3)

```bash
curl -s -X DELETE http://localhost:3000/api/tasks/1
# 기대: 200, { "id": 1 }

curl -s http://localhost:3000/api/tasks
# 기대: 200, 방금 삭제한 id가 더 이상 목록에 없음
```

## 엣지 케이스 검증

```bash
# 존재하지 않는 id 토글/삭제 → 404
curl -s -X PATCH http://localhost:3000/api/tasks/9999
curl -s -X DELETE http://localhost:3000/api/tasks/9999

# 200자 초과 제목 → 400
curl -s -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d "{\"title\":\"$(python -c 'print("a"*201)')\"}"
```

## 완료 기준

모든 명령이 [contracts/tasks-api.md](./contracts/tasks-api.md)에 정의된 상태
코드와 JSON 형태를 반환하면 이번 기능의 Phase 1 설계가 스펙 요구사항(FR-001~
FR-008)을 충족한 것으로 간주한다.
