
-- 0. Drop old table if exists
drop table if exists public.risk_rules_config cascade;

-- 1. Create Table (Group-Based)
create table public.risk_rules_config (
  id uuid primary key default gen_random_uuid(),
  mt5_group_name text not null unique, -- Key field
  
  -- Loss Limits
  max_daily_loss_percent numeric not null default 5.0,
  max_total_drawdown_percent numeric not null default 10.0,
  
  -- Per Trade Risk
  max_risk_per_trade_percent numeric default 2.0,
  
  -- Consistency (DISABLED)
  consistency_enabled boolean default false,
  max_single_win_percent numeric default 100.0,
  
  -- Other Rules
  max_lot_size numeric,
  trading_hours_enabled boolean default false,
  trading_start_time time,
  trading_end_time time,
  timezone text default 'UTC',
  allow_weekend_trading boolean default true,
  allow_news_trading boolean default true,
  news_buffer_minutes integer default 5,
  allow_ea_trading boolean default true,
  min_trade_duration_seconds integer default 0,
  max_trades_per_day integer,
  
  is_active boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);


alter table public.risk_rules_config enable row level security;


create policy "Risk rules are publicly readable"
  on public.risk_rules_config for select
  using (true);


insert into public.risk_rules_config (
    mt5_group_name,
    max_daily_loss_percent,
    max_total_drawdown_percent,
    max_risk_per_trade_percent,
    consistency_enabled
)
values 
  -- LITE/REGULAR ACCOUNTS
  ('demo\S\0-SF', 4.0, 8.0, 2.0, false),        -- Instant Funding (Funded -> 2% Risk)
  ('demo\S\1-SF', 4.0, 6.0, 2.0, false),        -- 1 Step (Eval -> 2% Risk)
  ('demo\S\2-SF', 4.0, 8.0, 2.0, false),        -- 2 Step (Eval -> 2% Risk)
  
  -- PRIME/PRO ACCOUNTS
  ('demo\SF\0-Pro', 5.0, 10.0, 2.0, false),     -- Instant Funding Pro (Funded -> 2% Risk)
  ('demo\SF\1-Pro', 5.0, 10.0, 2.0, false),     -- 1 Step Pro (Eval -> 2% Risk)
  ('demo\SF\2-Pro', 5.0, 10.0, 2.0, false),     -- 2 Step Pro (Eval -> 2% Risk)
  
  -- FUNDED LIVE
  ('SF Funded Live', 5.0, 10.0, 2.0, false);    -- Master Account (Funded -> 2% Risk)
