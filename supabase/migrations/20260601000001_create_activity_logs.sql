-- Migration: Create activity_logs table for admin audit trail
-- Catat semua aktivitas admin: CRUD anggota, alumni, kelas, jabatan
-- Run this in Supabase SQL Editor

create table if not exists public.activity_logs (
  id            uuid default gen_random_uuid() primary key,
  admin_email   text not null,
  action        text not null,      -- e.g. 'CREATE_MEMBER', 'DELETE_CLASS'
  entity_type   text,               -- e.g. 'member', 'class', 'alumni', 'position'
  entity_id     uuid,               -- ID baris yang diubah (nullable, karena bisa text key)
  detail        text,               -- Deskripsi bebas: nama anggota yg dihapus, dll
  ip_address    text,               -- IPv4/IPv6 dari ipify.org
  device_info   text,               -- User-Agent string (truncated 250 chars)
  device_id     text,               -- Fingerprint stabil dari browser
  created_at    timestamptz default now() not null
);

-- Index untuk query cepat (filter by admin, action, waktu)
create index if not exists idx_activity_logs_admin_email on public.activity_logs (admin_email);
create index if not exists idx_activity_logs_action      on public.activity_logs (action);
create index if not exists idx_activity_logs_created_at  on public.activity_logs (created_at desc);

-- RLS: hanya admin (authenticated) yang bisa INSERT dan SELECT
alter table public.activity_logs enable row level security;

drop policy if exists "Admins can insert logs"  on public.activity_logs;
drop policy if exists "Admins can read logs"    on public.activity_logs;

create policy "Admins can insert logs"
  on public.activity_logs for insert
  to authenticated
  with check (true);

create policy "Admins can read logs"
  on public.activity_logs for select
  to authenticated
  using (true);
