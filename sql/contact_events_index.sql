-- Contact Events Index (from HANDOVER.md §4)
-- This index is required because contact_events is scanned 100% sequentially by the rate limiter 
-- on every contact reveal, and it grows by 30 reveals per student per hour.

CREATE INDEX IF NOT EXISTS idx_contact_events_actor_recent
    ON public.contact_events (actor_id, created_at DESC);
