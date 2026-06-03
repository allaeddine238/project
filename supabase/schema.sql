

create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null,
  email text,
  age integer,
  weight numeric(5,1),
  height numeric(5,1),
  gender text check (gender in ('male','female')),
  goal text check (goal in ('lose','maintain','gain')),
  daily_calorie_goal integer,
  token_balance integer default 10,
  token_daily_allowance integer default 10,
  token_last_refresh date default current_date,
  token_total_spent integer default 0,
  active_plan_id text,
  active_plan_name text,
  active_plan_period text check (active_plan_period in ('daily','monthly','yearly')),
  active_plan_tokens integer,
  active_plan_renews_at timestamptz,
  active_plan_payment_method text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table profiles
  add column if not exists token_balance integer default 10,
  add column if not exists token_daily_allowance integer default 10,
  add column if not exists token_last_refresh date default current_date,
  add column if not exists token_total_spent integer default 0,
  add column if not exists active_plan_id text,
  add column if not exists active_plan_name text,
  add column if not exists active_plan_period text,
  add column if not exists active_plan_tokens integer,
  add column if not exists active_plan_renews_at timestamptz,
  add column if not exists active_plan_payment_method text;

create table if not exists meals (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  calories integer not null default 0,
  protein numeric(6,1) default 0,
  carbs numeric(6,1) default 0,
  fat numeric(6,1) default 0,
  meal_type text default 'lunch' check (meal_type in ('breakfast','lunch','dinner','snack')),
  log_date date default current_date,
  created_at timestamptz default now()
);

create table if not exists weight_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  weight numeric(5,1) not null,
  log_date date default current_date,
  created_at timestamptz default now(),
  unique (user_id, log_date)
);

drop table if exists water_logs;

create table if not exists conversations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  title text default 'New Chat',
  created_at timestamptz default now()
);

create table if not exists messages (
  id uuid default gen_random_uuid() primary key,
  conversation_id uuid references conversations on delete cascade not null,
  role text check (role in ('user','assistant')) not null,
  content text not null,
  created_at timestamptz default now()
);

create table if not exists user_workouts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  muscle_group text not null,
  location text not null,
  notes text default '',
  items jsonb not null default '[]'::jsonb,
  created_at timestamptz default now()
);

create table if not exists token_purchase_requests (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  purchase_type text not null check (purchase_type in ('pack','plan')),
  package_id text not null,
  package_name text not null,
  billing_period text,
  tokens integer not null,
  price_dzd integer not null,
  price_usd numeric(8,2) not null,
  payment_method text not null,
  status text not null default 'approved' check (status in ('pending','approved','rejected')),
  created_at timestamptz default now()
);

create table if not exists token_transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  change_amount integer not null,
  balance_after integer,
  reason text not null,
  source_type text not null check (source_type in ('daily_refresh','usage','purchase','plan_renewal')),
  source_label text,
  created_at timestamptz default now()
);

alter table profiles enable row level security;
alter table meals enable row level security;
alter table weight_logs enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;
alter table user_workouts enable row level security;
alter table token_purchase_requests enable row level security;
alter table token_transactions enable row level security;

drop policy if exists "own_profile_select" on profiles;
drop policy if exists "own_profile_insert" on profiles;
drop policy if exists "own_profile_update" on profiles;
create policy "own_profile_select" on profiles for select using (auth.uid() = id);
create policy "own_profile_insert" on profiles for insert with check (auth.uid() = id);
create policy "own_profile_update" on profiles for update using (auth.uid() = id);

drop policy if exists "own_meals_select" on meals;
drop policy if exists "own_meals_insert" on meals;
drop policy if exists "own_meals_delete" on meals;
create policy "own_meals_select" on meals for select using (auth.uid() = user_id);
create policy "own_meals_insert" on meals for insert with check (auth.uid() = user_id);
create policy "own_meals_delete" on meals for delete using (auth.uid() = user_id);

drop policy if exists "own_weight_logs_all" on weight_logs;
create policy "own_weight_logs_all" on weight_logs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own_convs_all" on conversations;
create policy "own_convs_all" on conversations for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own_messages_all" on messages;
create policy "own_messages_all" on messages for all using (auth.uid() = (select user_id from conversations where id = conversation_id));

drop policy if exists "own_workouts_all" on user_workouts;
create policy "own_workouts_all" on user_workouts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own_token_requests_all" on token_purchase_requests;
create policy "own_token_requests_all" on token_purchase_requests for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own_token_transactions_all" on token_transactions;
create policy "own_token_transactions_all" on token_transactions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on profiles;
create trigger profiles_updated_at before update on profiles for each row execute function handle_updated_at();
