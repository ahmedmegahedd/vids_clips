-- Billing: checkout, subscriptions, invoices
create table if not exists public.checkout_sessions (
  id uuid primary key,
  user_id uuid,
  email text not null,
  name text not null,
  phone text,
  plan_id text not null,
  interval text not null,
  currency text not null default 'EGP',
  amount numeric not null,
  tax numeric not null default 0,
  total numeric not null,
  status text not null,
  failure_reason text,
  paymob_checkout_url text,
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  next_billing_date timestamptz
);

create table if not exists public.subscriptions (
  user_id uuid primary key,
  plan_id text not null default 'free',
  status text not null default 'free',
  interval text,
  currency text not null default 'EGP',
  amount numeric not null default 0,
  renews_at timestamptz,
  cancel_at timestamptz,
  payment_method text,
  videos_limit integer not null default 1,
  updated_at timestamptz not null default now()
);

create table if not exists public.invoices (
  id uuid primary key,
  user_id uuid not null,
  plan_id text not null,
  amount numeric not null,
  currency text not null default 'EGP',
  status text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.payment_events (
  provider_event_id text primary key,
  checkout_id uuid,
  created_at timestamptz not null default now()
);

alter table public.checkout_sessions enable row level security;
alter table public.subscriptions enable row level security;
alter table public.invoices enable row level security;

create policy "Users read own subscription"
  on public.subscriptions for select
  using (auth.uid() = user_id);

create policy "Users read own invoices"
  on public.invoices for select
  using (auth.uid() = user_id);
