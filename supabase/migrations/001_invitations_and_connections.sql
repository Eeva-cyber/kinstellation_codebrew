-- ============================================================
-- Kinstellation: invitations + user_connections tables
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- 1. Invitations table
-- Stores pending/accepted/declined invite links
create table if not exists public.invitations (
  id uuid primary key default gen_random_uuid(),
  inviter_user_id uuid not null references auth.users(id) on delete cascade,
  inviter_person_id uuid not null,
  inviter_display_name text not null,
  token uuid not null unique default gen_random_uuid(),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days')
);

-- 2. User connections table
-- Stores accepted connections between two users
create table if not exists public.user_connections (
  id uuid primary key default gen_random_uuid(),
  user_a_id uuid not null references auth.users(id) on delete cascade,
  person_a_id uuid not null,
  user_b_id uuid not null references auth.users(id) on delete cascade,
  person_b_id uuid not null,
  relationship_type text not null,
  created_at timestamptz not null default now()
);

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================

alter table public.invitations enable row level security;
alter table public.user_connections enable row level security;

-- Invitations: anyone can SELECT by token (the token IS the auth)
create policy "Anyone can read invitation by token"
  on public.invitations for select
  using (true);

-- Invitations: only the inviter can insert
create policy "Inviter can create invitations"
  on public.invitations for insert
  with check (auth.uid() = inviter_user_id);

-- Invitations: any authenticated user can update (inviter cancels, acceptor accepts)
create policy "Authenticated users can update invitations"
  on public.invitations for update
  using (auth.uid() is not null);

-- User connections: both parties can read their connections
create policy "Users can read own connections"
  on public.user_connections for select
  using (auth.uid() = user_a_id or auth.uid() = user_b_id);

-- User connections: authenticated users can insert
create policy "Authenticated users can create connections"
  on public.user_connections for insert
  with check (auth.uid() is not null);

-- ============================================================
-- Cross-user person visibility for connections
-- ============================================================

-- Allow users to read connected partners' person rows
create policy "Users can read connected persons"
  on public.persons for select
  using (
    owner_id = auth.uid()
    or id in (
      select person_a_id from public.user_connections where user_b_id = auth.uid()
      union
      select person_b_id from public.user_connections where user_a_id = auth.uid()
    )
  );

-- ============================================================
-- Indexes
-- ============================================================

create index if not exists idx_invitations_token on public.invitations(token);
create index if not exists idx_invitations_inviter on public.invitations(inviter_user_id);
create index if not exists idx_connections_user_a on public.user_connections(user_a_id);
create index if not exists idx_connections_user_b on public.user_connections(user_b_id);
