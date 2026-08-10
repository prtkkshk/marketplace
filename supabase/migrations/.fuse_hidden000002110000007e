-- Migration: Phase 3 Scale & Hardening Indexes
-- Adds missing indexes for feed filters and sorts

create index if not exists idx_listings_created_at on public.listings(created_at desc);
create index if not exists idx_listings_is_pinned on public.listings(is_pinned desc);
create index if not exists idx_listings_category on public.listings(category);
create index if not exists idx_listings_status on public.listings(status);

create index if not exists idx_wanted_created_at on public.wanted_requests(created_at desc);
create index if not exists idx_wanted_is_pinned on public.wanted_requests(is_pinned desc);
create index if not exists idx_wanted_category on public.wanted_requests(category);
create index if not exists idx_wanted_status on public.wanted_requests(status);
create index if not exists idx_wanted_hall on public.wanted_requests(hall_of_residence);
