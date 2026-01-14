-- Fix for 'column reference "session_id" is ambiguous' error in get_user_feed function
-- The issue is likely caused by variable shadowing in PL/pgSQL where the output parameter 'session_id'
-- conflicts with the column name 'session_id' in the subqueries.
-- Fixing by qualifying the column names in subqueries with table aliases.

CREATE OR REPLACE FUNCTION get_user_feed(user_id_param UUID, limit_param INT DEFAULT 20, offset_param INT DEFAULT 0)
RETURNS TABLE (
  session_id UUID,
  user_id UUID,
  username TEXT,
  avatar_url TEXT,
  workout_name TEXT,
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  duration_minutes INT,
  total_volume NUMERIC,
  total_sets INT,
  is_deload BOOLEAN,
  exercises JSONB,
  new_prs JSONB,
  likes_count BIGINT,
  comments_count BIGINT,
  user_has_liked BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ws.id AS session_id,
    ws.user_id,
    up.username,
    up.avatar_url,
    ws.workout_name,
    ws.started_at,
    ws.ended_at,
    ws.duration_minutes,
    ws.total_volume,
    ws.total_sets,
    ws.is_deload,
    ws.exercises,
    ws.new_prs,
    COALESCE(likes.count, 0) AS likes_count,
    COALESCE(comments.count, 0) AS comments_count,
    EXISTS(
      SELECT 1 FROM session_likes sl
      WHERE sl.session_id = ws.id AND sl.user_id = user_id_param
    ) AS user_has_liked
  FROM workout_sessions ws
  INNER JOIN user_profiles up ON ws.user_id = up.id
  INNER JOIN user_follows uf ON uf.following_id = ws.user_id
  LEFT JOIN (
    -- Qualified column names to avoid ambiguity with output parameter 'session_id'
    SELECT sl.session_id, COUNT(*) as count
    FROM session_likes sl
    GROUP BY sl.session_id
  ) likes ON ws.id = likes.session_id
  LEFT JOIN (
    -- Qualified column names to avoid ambiguity with output parameter 'session_id'
    SELECT sc.session_id, COUNT(*) as count
    FROM session_comments sc
    GROUP BY sc.session_id
  ) comments ON ws.id = comments.session_id
  WHERE uf.follower_id = user_id_param
    AND ws.is_shared = true
  ORDER BY ws.started_at DESC
  LIMIT limit_param
  OFFSET offset_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
