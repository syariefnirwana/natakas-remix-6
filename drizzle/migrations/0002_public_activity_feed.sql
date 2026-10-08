CREATE OR REPLACE FUNCTION public.recent_activity(_limit int DEFAULT 15)
RETURNS TABLE(initial text, created_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT upper(left(coalesce(nullif(trim(p.display_name), ''), 'U'), 1)) || '***' AS initial, t.created_at
  FROM public.transactions t
  LEFT JOIN public.profiles p ON p.id = t.user_id
  WHERE t.type IN ('income','expense')
  ORDER BY t.created_at DESC
  LIMIT least(greatest(_limit, 1), 20)
$$;
REVOKE ALL ON FUNCTION public.recent_activity(int) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.recent_activity(int) TO authenticated;