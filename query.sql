-- ============================================================
-- 충청 증차 우선순위 존 산출 통합 쿼리
-- 목적  : 적정 대수(수요 기반) vs 현재 대수 Gap + 배차 실패율 교차
-- 기준  : 목표 가동률 40%, 연간 CVR (2025.01.01~2026.03.15)
-- 실패율: 최근 4주 (2026.02.09~2026.03.08)
-- 작성  : 충청사업팀 / 2026.03.16
-- ============================================================

WITH

-- ① 존별 일평균 클릭자수 (연간 기준)
clicks AS (
  SELECT
    zone_id,
    date,
    COUNT(DISTINCT member_id) AS daily_unique_clickers
  FROM `socar-data.service_metrics.aggregate_zone_funnel`
  WHERE date BETWEEN '2025-01-01' AND '2026-03-15'
    AND agg_dim  = 'start_at'
    AND region   = '충청도'
  GROUP BY zone_id, date
),
clicks_agg AS (
  SELECT
    zone_id,
    ROUND(AVG(daily_unique_clickers), 1) AS avg_daily_clickers,
    COUNT(DISTINCT date)                  AS days_cnt
  FROM clicks
  GROUP BY zone_id
),

-- ② 존별 완료 예약수 + 건당 평균 이용시간
reservations AS (
  SELECT
    r.zone_id,
    COUNT(DISTINCT r.id)                                              AS total_rsv,
    ROUND(AVG(TIMESTAMP_DIFF(
      IFNULL(r.reserved_end_at, r.end_at), r.start_at, MINUTE
    ) / 60.0), 1)                                                     AS avg_utime_h
  FROM `socar-data.tianjin_replica.reservation_info` r
  JOIN `socar-data.tianjin_replica.carzone_info`     cz ON r.zone_id = cz.id
  WHERE cz.region1 IN ('대전광역시','세종특별자치시','충청남도','충청북도')
    AND r.state            IN (3, 5)       -- 완료 예약
    AND r.member_imaginary IN (0, 9)       -- 실제 회원
    AND DATE(r.start_at, 'Asia/Seoul') BETWEEN '2025-01-01' AND '2026-03-15'
  GROUP BY r.zone_id
),

-- ③ 현재 운영 중인 차량 대수 (실시간)
current_cars AS (
  SELECT
    ci.zone_id,
    COUNT(DISTINCT ci.id) AS cur_cars
  FROM `socar-data.tianjin_replica.car_info`    ci
  JOIN `socar-data.tianjin_replica.carzone_info` cz ON ci.zone_id = cz.id
  WHERE ci.state        = 5         -- 운영 중
    AND ci.imaginary    = 0         -- 실차량
    AND ci.sharing_type = 'socar'
    AND cz.state        = 1         -- 운영 중인 존
    AND cz.region1 IN ('대전광역시','세종특별자치시','충청남도','충청북도')
  GROUP BY ci.zone_id
),

-- ④ 존 마스터 (운영 중인 존만)
zone_info AS (
  SELECT id AS zone_id, name AS zone_name, region1
  FROM `socar-data.tianjin_replica.carzone_info`
  WHERE state    = 1
    AND imaginary = 0
    AND region1 IN ('대전광역시','세종특별자치시','충청남도','충청북도')
),

-- ⑤ 배차 실패율 (최근 4주)
demand_fails AS (
  SELECT
    zone_id,
    COUNT(*)                                                          AS total_attempts,
    COUNTIF(available_car_count = 0)                                 AS fail_count,
    ROUND(SAFE_DIVIDE(
      COUNTIF(available_car_count = 0), COUNT(*)) * 100, 1)          AS fail_rate
  FROM `socar-data.service_metrics.log_get_car_classes`
  WHERE DATE(event_timestamp, 'Asia/Seoul') BETWEEN '2026-02-09' AND '2026-03-08'
  GROUP BY zone_id
),

-- ⑥ 적정 대수 계산
calc AS (
  SELECT
    z.region1,
    z.zone_id,
    z.zone_name,
    cc.cur_cars,
    c.avg_daily_clickers,
    c.days_cnt,
    ROUND(SAFE_DIVIDE(r.total_rsv,
      c.avg_daily_clickers * c.days_cnt), 3)                         AS cvr,
    r.avg_utime_h,

    -- 소수점 산출값
    ROUND(SAFE_DIVIDE(
      c.avg_daily_clickers
        * SAFE_DIVIDE(r.total_rsv, c.avg_daily_clickers * c.days_cnt)
        * r.avg_utime_h,
      0.4 * 24), 2)                                                   AS raw_opt,

    -- 올림 적정 대수 (목표 가동률 40%)
    CAST(CEIL(SAFE_DIVIDE(
      c.avg_daily_clickers
        * SAFE_DIVIDE(r.total_rsv, c.avg_daily_clickers * c.days_cnt)
        * r.avg_utime_h,
      0.4 * 24)) AS INT64)                                            AS opt_cars

  FROM zone_info     z
  JOIN current_cars  cc ON z.zone_id = cc.zone_id
  JOIN clicks_agg    c  ON z.zone_id = c.zone_id
  JOIN reservations  r  ON z.zone_id = r.zone_id

  -- 노이즈 제거 필터
  WHERE c.avg_daily_clickers >= 3    -- 일평균 클릭 3명 이상
    AND c.days_cnt            >= 60  -- 60일 이상 데이터
    AND r.avg_utime_h         <= 72  -- 장기이용 왜곡 제외 (72h 초과)
)

-- ⑦ 최종 출력: Gap + 실패율 교차 + 우선순위 등급
SELECT
  c.region1,
  c.zone_id,
  c.zone_name,
  c.cur_cars                                      AS 현재대수,
  c.opt_cars                                      AS 적정대수,
  (c.opt_cars - c.cur_cars)                       AS gap,
  c.avg_daily_clickers                            AS 일평균클릭,
  ROUND(c.cvr * 100, 1)                           AS cvr_pct,
  c.avg_utime_h                                   AS 건당이용h,
  c.raw_opt                                       AS 산출값_소수,
  COALESCE(df.total_attempts, 0)                  AS 배차조회수,
  COALESCE(df.fail_count, 0)                      AS 배차실패수,
  COALESCE(df.fail_rate, 0)                       AS 배차실패율,

  -- 우선순위 등급
  CASE
    WHEN (c.opt_cars - c.cur_cars) >= 3
      AND COALESCE(df.fail_rate, 0) >= 40                             THEN 'S — 즉시 증차'
    WHEN (c.opt_cars - c.cur_cars) >= 2
      AND COALESCE(df.fail_rate, 0) >= 40                             THEN 'A — 적극 증차'
    WHEN (c.opt_cars - c.cur_cars) >= 3
      AND COALESCE(df.fail_rate, 0) >= 20                             THEN 'A — 적극 증차'
    WHEN (c.opt_cars - c.cur_cars) >= 1
      AND COALESCE(df.fail_rate, 0) >= 55                             THEN 'A — 적극 증차'
    WHEN (c.opt_cars - c.cur_cars) >= 2
      AND COALESCE(df.fail_rate, 0) >= 20                             THEN 'B — 증차 검토'
    WHEN (c.opt_cars - c.cur_cars) >= 1
      AND COALESCE(df.fail_rate, 0) >= 40                             THEN 'B — 증차 검토'
    ELSE 'C — 모니터링'
  END                                             AS 우선순위등급

FROM calc c
LEFT JOIN demand_fails df ON c.zone_id = df.zone_id

WHERE c.opt_cars > c.cur_cars        -- 증차 필요 존만
  AND c.raw_opt   > 1.5              -- 산출값 1.5 초과 (확실한 신호)
  AND COALESCE(df.total_attempts, 0) >= 100  -- 실패율 신뢰도 확보

ORDER BY
  CASE 우선순위등급
    WHEN 'S — 즉시 증차' THEN 1
    WHEN 'A — 적극 증차' THEN 2
    WHEN 'B — 증차 검토' THEN 3
    ELSE 4
  END,
  gap DESC,
  배차실패율 DESC
