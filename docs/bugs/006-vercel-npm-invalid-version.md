# Vercel 빌드 실패: npm Invalid Version

**날짜:** 2026-04-06

**증상:**
Vercel 배포 시 `npm install` 단계에서 빌드 실패.
```
npm error Invalid Version:
```
빈 문자열이 semver 파서에 전달되면서 에러 발생.

**원인:**

Vercel 기본 환경이 npm 9를 사용하는데, `rollup`의 플랫폼별 optional 바이너리(`@rollup/rollup-linux-arm-musleabihf` 등)에 빈 버전 문자열이 포함되어 있음. npm 10+에서는 이를 정상 처리하지만, npm 9의 `node-semver`는 빈 문자열을 파싱하지 못함.

로컬(npm 11)에서는 재현 안 되고, `npx npm@9 install`로 재현 확인.

**시도한 것들:**
| 시도 | 결과 |
|------|------|
| `.nvmrc`에 Node 22 지정 | Vercel이 반영 안 함 |
| `NODE_VERSION=22` 환경변수 | 효과 없음 |
| `package-lock.json` 재생성 | npm 9에서 동일 에러 |
| vitest v4 → v3 다운그레이드 | rolldown은 해결되나 rollup에서 같은 에러 |
| Install Command를 `npx npm@latest install` | npm 다운로드에 시간 소요, 타임아웃 |

**해결:**

Vercel Install Command를 다음으로 설정:
```
npm install --install-strategy=shallow
```

`--install-strategy=shallow`는 의존성 트리를 평탄화(dedupe)하지 않으므로, npm 9가 optional 바이너리의 빈 버전을 파싱하는 `canDedupe` 단계를 건너뜀.

**추가 발생 (2026-04-06 두 번째):**

리팩토링 커밋 후 동일 에러 재발. `vitest` 버전 복원, lockfile 재생성 등 시도했으나 해결 안 됨.

**최종 해결:** `package-lock.json` 삭제 후 `npm install`로 재생성.

**근본 원인:** npm 11(로컬)이 생성한 lockfile에 npm 10(Vercel Node 22)이 이해 못 하는 내부 메타데이터가 포함됨. `lockfileVersion: 3`은 동일하지만, npm 메이저 버전 간 의존성 해석 방식(resolved URL 형식, optional 필드 처리 등)이 달라서 파싱 실패. 특히 `@tanstack/react-query` 설치 시 lockfile이 npm 11 방식으로 재생성되면서 문제 발생.

**교훈:**
- Vercel의 npm 버전은 로컬과 다를 수 있음. `npx npm@9 install`로 사전 검증 가능
- `Invalid Version:` 뒤에 아무것도 안 나오면 빈 문자열 파싱 실패 — lockfile이 아니라 레지스트리의 optional 바이너리 메타데이터가 원인일 수 있음
- **npm 메이저 버전이 다르면 lockfile 호환성 문제 발생 가능** — 새 패키지 설치 후 Vercel 빌드 실패하면 `package-lock.json` 삭제 후 재생성이 가장 빠른 해결책
- 로컬 Node/npm 버전과 Vercel 환경을 일치시키는 게 근본 해결 (`.nvmrc` + Vercel Node 설정)
