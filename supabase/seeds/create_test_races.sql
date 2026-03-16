-- ============================================================
-- 検証レース複製スクリプト
-- 対象: 中山記念 / 報知杯弥生賞ディープインパクト記念
--
-- 実行場所: Supabase ダッシュボード > SQL Editor
-- 冪等性: すでに同名の検証レースが存在する場合はスキップ
-- 本番レース: 一切変更しない（SELECT のみ）
-- ============================================================

DO $$
DECLARE
  v_race          RECORD;
  v_new_race_id   UUID;
  v_test_name     TEXT;
BEGIN

  -- 複製対象レース名のリストをループ
  FOR v_race IN
    SELECT *
    FROM   races
    WHERE  is_test IS NOT TRUE
      AND  race_name IN (
             '中山記念',
             '報知杯弥生賞ディープインパクト記念'
           )
    ORDER BY date DESC
  LOOP

    v_test_name := v_race.race_name || '（検証）';

    -- すでに同名の検証レースがあればスキップ
    IF EXISTS (
      SELECT 1 FROM races
      WHERE race_name = v_test_name AND is_test = TRUE
    ) THEN
      RAISE NOTICE 'スキップ（既存）: %', v_test_name;
      CONTINUE;
    END IF;

    -- ── races 複製 ─────────────────────────────────────────
    INSERT INTO races (
      race_name,
      date,
      venue,
      grade,
      surface,
      distance_m,
      start_time,
      is_test,
      parent_race_id
    )
    VALUES (
      v_test_name,
      v_race.date,
      v_race.venue,
      v_race.grade,
      v_race.surface,
      v_race.distance_m,
      v_race.start_time,
      TRUE,
      v_race.id
    )
    RETURNING id INTO v_new_race_id;

    RAISE NOTICE '作成: % → %', v_race.race_name, v_new_race_id;

    -- ── entries 複製 ────────────────────────────────────────
    -- ※ entries テーブルに ai_rank / ai_score など追加カラムがある場合は
    --    以下の SELECT に列を追加してください
    INSERT INTO entries (
      race_id,
      horse_id,
      horse_number,
      popularity_rank
    )
    SELECT
      v_new_race_id,
      horse_id,
      horse_number,
      popularity_rank
    FROM entries
    WHERE race_id = v_race.id;

    -- ── race_results 複製 ───────────────────────────────────
    -- ※ テーブル名が "results" の場合は以下を変更してください
    --   finish_pos → finish_position など列名も合わせて調整
    INSERT INTO race_results (
      race_id,
      horse_id,
      finish_pos
    )
    SELECT
      v_new_race_id,
      horse_id,
      finish_pos
    FROM race_results
    WHERE race_id = v_race.id;

    RAISE NOTICE '完了: %（entries + race_results をコピー）', v_test_name;

  END LOOP;

END $$;
