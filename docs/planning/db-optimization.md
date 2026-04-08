# DB 최적화 계획

> 현재 MVP 스키마 기준. 사용자/데이터 증가 시 순서대로 적용.

---

## 1. 집계 로직을 DB로 이전

현재 모든 집계가 앱(JS)에서 돌고 있음. DB로 옮겨야 하는 항목:

### 1-1. XP/포인트 합계 → DB function

**현재:** `fetchTotals()`가 xp_ledger 전체 fetch → JS reduce
**변경:** Supabase RPC로 교체

```sql
CREATE OR REPLACE FUNCTION fn_user_totals(uid uuid)
RETURNS TABLE(type text, total bigint) AS $$
  SELECT type, COALESCE(SUM(delta), 0) AS total
  FROM xp_ledger
  WHERE client_id = uid
  GROUP BY type;
$$ LANGUAGE sql STABLE SECURITY DEFINER;
```

**앱 코드:** `supabase.rpc("fn_user_totals", { uid: clientId })`

### 1-2. 스트릭 계산 → DB function

**현재:** `fetchStreakFromLedger()`가 전체 ledger fetch → JS로 날짜 비교
**변경:**

```sql
CREATE OR REPLACE FUNCTION fn_user_streak(uid uuid)
RETURNS integer AS $$
  WITH daily AS (
    SELECT DISTINCT (created_at AT TIME ZONE 'Asia/Seoul')::date AS d
    FROM xp_ledger
    WHERE client_id = uid
      AND reason IN ('퀘스트 완료', '회고 작성')
      AND delta > 0
    ORDER BY d DESC
  ),
  gaps AS (
    SELECT d, d - (ROW_NUMBER() OVER (ORDER BY d DESC))::int AS grp
    FROM daily
  )
  SELECT COUNT(*)::int
  FROM gaps
  WHERE grp = (SELECT grp FROM gaps LIMIT 1);
$$ LANGUAGE sql STABLE SECURITY DEFINER;
```

### 1-3. 대시보드 집계 → DB view

**현재:** `/api/dashboard` route에서 4개 테이블 full scan → Node.js 150줄 집계
**변경:** view로 분리

```sql
CREATE VIEW view_daily_summary AS
SELECT
  client_id,
  (started_at AT TIME ZONE 'Asia/Seoul')::date AS date,
  status,
  COUNT(*) AS count
FROM survey_sessions
GROUP BY client_id, date, status;
```

---

## 2. 시간 기반 인덱스 추가

스트릭, 대시보드, 일일 제한 등 시간 필터 쿼리에 인덱스가 없음.

```sql
-- 스트릭 / 일일 보상 제한 쿼리용
CREATE INDEX idx_xp_ledger_client_created
  ON xp_ledger (client_id, created_at DESC);

-- 스트릭 reason 필터용 (partial index)
CREATE INDEX idx_xp_ledger_reward_reasons
  ON xp_ledger (client_id, created_at DESC)
  WHERE reason IN ('퀘스트 완료', '회고 작성') AND delta > 0;

-- 대시보드 세션 조회용
CREATE INDEX idx_sessions_started_at
  ON survey_sessions (client_id, started_at DESC);

-- 감정/생각 시계열 조회용
CREATE INDEX idx_emotions_created_at
  ON survey_emotions (client_id, created_at DESC);

CREATE INDEX idx_thought_created_at
  ON survey_thought (client_id, created_at DESC);
```

---

## 3. FK ON DELETE 정책 정의

현재 FK에 ON DELETE 동작이 없어서, 부모 row 삭제 시 에러 발생.

| FK | 추천 동작 | 이유 |
|---|---|---|
| reflections.quest_id → quests | SET NULL | 퀘스트 삭제해도 회고 기록은 보존 |
| reflections.session_id → survey_sessions | SET NULL | 세션 삭제해도 회고 보존 |
| xp_ledger.quest_id → quests | SET NULL | XP 기록은 원장이므로 삭제하면 안 됨 |
| xp_ledger.session_id → survey_sessions | SET NULL | 동일 |
| quests.parent_id → quests | SET NULL | 장기 퀘스트 삭제 시 단기는 독립 유지 |
| survey_actions.action_id → action_catalog | SET NULL | 카탈로그 항목 비활성화 시 기록 보존 |

```sql
-- 예시: reflections.quest_id
ALTER TABLE reflections
  DROP CONSTRAINT reflections_quest_id_fkey,
  ADD CONSTRAINT reflections_quest_id_fkey
    FOREIGN KEY (quest_id) REFERENCES quests(id) ON DELETE SET NULL;
```

---

## 4. 보상 지급 원자성 확보

현재 퀘스트 완료 시 앱에서 3번 순차 호출:
1. `fetchTodayCount()` — 오늘 지급 횟수 확인
2. `insertTransaction()` — XP 적립
3. `checkAndAwardStreakBonus()` — 스트릭 보너스

→ 중간에 실패하면 부분 지급 가능.

```sql
CREATE OR REPLACE FUNCTION fn_grant_quest_reward(
  uid uuid,
  qid uuid,
  base_xp int,
  base_points int
) RETURNS jsonb AS $$
DECLARE
  today_count int;
  streak int;
  result jsonb;
BEGIN
  -- 오늘 지급 횟수 확인 (감쇠 적용)
  SELECT COUNT(*) INTO today_count
  FROM xp_ledger
  WHERE client_id = uid
    AND reason = '퀘스트 완료'
    AND delta > 0
    AND created_at >= (NOW() AT TIME ZONE 'Asia/Seoul')::date;

  -- XP 적립
  INSERT INTO xp_ledger (client_id, type, delta, reason, quest_id)
  VALUES (uid, 'xp', base_xp, '퀘스트 완료', qid);

  -- 포인트 적립
  INSERT INTO xp_ledger (client_id, type, delta, reason, quest_id)
  VALUES (uid, 'points', base_points, '퀘스트 완료', qid);

  -- 스트릭 보너스 체크 + 지급은 앱에서 결과 받아서 처리
  streak := fn_user_streak(uid);

  result := jsonb_build_object(
    'today_count', today_count + 1,
    'streak', streak
  );
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 우선순위

| 순서 | 항목 | 난이도 | 효과 |
|---|---|---|---|
| 1 | 시간 기반 인덱스 추가 | 낮음 | 즉시 쿼리 성능 개선 |
| 2 | XP 합계 DB function | 낮음 | 매 페이지 로드 개선 |
| 3 | 스트릭 DB function | 중간 | 프로필 페이지 로드 개선 |
| 4 | FK ON DELETE 정책 | 낮음 | 삭제 시 에러 방지 |
| 5 | 보상 지급 원자성 | 중간 | 데이터 정합성 확보 |
| 6 | 대시보드 view | 중간 | 대시보드 응답 속도 개선 |
