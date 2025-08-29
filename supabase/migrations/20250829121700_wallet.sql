-- Wallet schema
create type wallet_tx_type as enum ('credit','debit');

create table if not exists public.wallets (
  user_id uuid primary key references auth.users(id) on delete cascade,
  balance bigint not null default 0, -- amount in paise
  updated_at timestamptz not null default now()
);

create table if not exists public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tx_type wallet_tx_type not null,
  amount bigint not null check (amount > 0),
  reason text,
  reference text,
  created_at timestamptz not null default now()
);

create index if not exists wallet_transactions_user_id_idx on public.wallet_transactions(user_id);

-- Update helper function exists: public.has_role(role, user_id) returns boolean

-- RLS
alter table public.wallets enable row level security;
alter table public.wallet_transactions enable row level security;

-- Owners can view own wallet and transactions
create policy if not exists "wallets_select_own" on public.wallets
  for select using (auth.uid() = user_id or has_role('admin', auth.uid()));
create policy if not exists "wallets_update_own" on public.wallets
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy if not exists "wallet_txs_select_own" on public.wallet_transactions
  for select using (auth.uid() = user_id or has_role('admin', auth.uid()));
create policy if not exists "wallet_txs_insert_self" on public.wallet_transactions
  for insert with check (auth.uid() = user_id);

-- RPC helpers to perform atomic credit/debit with proper checks
create or replace function public.credit_wallet(_user_id uuid, _amount bigint, _reason text default null, _reference text default null)
returns void
language plpgsql
security definer
as $$
begin
  if _amount <= 0 then
    raise exception 'amount must be positive';
  end if;
  insert into public.wallets as w(user_id, balance)
    values (_user_id, _amount)
  on conflict (user_id) do update set balance = w.balance + excluded.balance, updated_at = now();
  insert into public.wallet_transactions(user_id, tx_type, amount, reason, reference)
    values (_user_id, 'credit', _amount, _reason, _reference);
end;
$$;

create or replace function public.debit_wallet(_user_id uuid, _amount bigint, _reason text default null, _reference text default null)
returns void
language plpgsql
security definer
as $$
declare _current bigint;
begin
  if _amount <= 0 then
    raise exception 'amount must be positive';
  end if;
  select balance into _current from public.wallets where user_id = _user_id for update;
  if _current is null or _current < _amount then
    raise exception 'insufficient_funds';
  end if;
  update public.wallets set balance = balance - _amount, updated_at = now() where user_id = _user_id;
  insert into public.wallet_transactions(user_id, tx_type, amount, reason, reference)
    values (_user_id, 'debit', _amount, _reason, _reference);
end;
$$;


