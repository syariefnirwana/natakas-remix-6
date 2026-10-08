CREATE POLICY "users read announcements" ON public.announcements FOR SELECT TO authenticated USING (true);

CREATE TABLE public.announcement_reads (
  user_id uuid NOT NULL DEFAULT auth.uid(),
  announcement_id uuid NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
  read_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, announcement_id)
);
GRANT SELECT, INSERT ON public.announcement_reads TO authenticated;
GRANT ALL ON public.announcement_reads TO service_role;
ALTER TABLE public.announcement_reads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own reads select" ON public.announcement_reads FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "own reads insert" ON public.announcement_reads FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());