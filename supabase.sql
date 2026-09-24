-- rizzup paywall store — paste into Supabase SQL editor (Dashboard → SQL Editor → New query)

create table if not exists users (
  device_id text primary key,
  ip text,
  trial_used int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists subscriptions (
  dodo_subscription_id text primary key,
  device_id text references users(device_id) on delete set null,
  status text not null default 'pending',
  active boolean not null default false,
  current_period_end timestamptz,
  email text,
  updated_at timestamptz not null default now()
);

-- Block ALL direct table access from anon/publishable keys.
-- Every read/write goes through the security definer functions below,
-- which run as the table owner and bypass RLS safely.
alter table public.users enable row level security;
alter table public.subscriptions enable row level security;

create or replace function get_access(p_device_id text, p_ip text)
returns table (active boolean, trial_used int)
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into users (device_id, ip)
  values (p_device_id, coalesce(p_ip, ''))
  on conflict (device_id)
  do update set ip = excluded.ip;

  return query
  select
    exists(
      select 1 from subscriptions s
      where s.device_id = p_device_id and s.active
    ),
    (select u.trial_used from users u where u.device_id = p_device_id);
end;
$$;

create or replace function claim_trial(p_device_id text, p_ip text)
returns int
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into users (device_id, ip)
  values (p_device_id, coalesce(p_ip, ''))
  on conflict (device_id)
  do update set ip = excluded.ip;

  update users
  set trial_used = trial_used + 1
  where device_id = p_device_id
    and trial_used < 3;

  return (select trial_used from users where device_id = p_device_id);
end;
$$;

create or replace function upsert_subscription(
  p_sub_id text,
  p_device_id text,
  p_status text,
  p_active boolean,
  p_period_end timestamptz,
  p_email text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if nullif(p_device_id, '') is not null then
    insert into users (device_id) values (p_device_id)
    on conflict (device_id) do nothing;
  end if;

  insert into subscriptions (
    dodo_subscription_id, device_id, status, active, current_period_end, email, updated_at
  ) values (
    p_sub_id,
    nullif(p_device_id, ''),
    coalesce(nullif(p_status, ''), 'pending'),
    coalesce(p_active, false),
    p_period_end,
    nullif(p_email, ''),
    now()
  )
  on conflict (dodo_subscription_id)
  do update set
    device_id = coalesce(nullif(excluded.device_id, ''), subscriptions.device_id),
    status = excluded.status,
    active = excluded.active,
    current_period_end = coalesce(excluded.current_period_end, subscriptions.current_period_end),
    email = coalesce(excluded.email, subscriptions.email),
    updated_at = now();
end;
$$;

create or replace function deactivate_subscription(
  p_sub_id text,
  p_status text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_device text;
begin
  select device_id into v_device
  from subscriptions
  where dodo_subscription_id = p_sub_id;

  update subscriptions
  set status = coalesce(nullif(p_status, ''), 'inactive'),
      active = false,
      updated_at = now()
  where dodo_subscription_id = p_sub_id;

  if v_device is not null then
    update users set trial_used = 0 where device_id = v_device;
  end if;
end;
$$;