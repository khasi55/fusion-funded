-- Unified robust migration to create and synchronize risk-related tables
-- Run this in Supabase SQL Editor

-- 1. CORE RISK VIOLATIONS (Hard Breaches)
CREATE TABLE IF NOT EXISTS public.core_risk_violations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  violation_type text NOT NULL, 
  severity text NOT NULL DEFAULT 'breach',
  description text,
  amount numeric,
  threshold numeric,
  percentage numeric,
  trade_ticket text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Ensure all columns exist for core_risk_violations
ALTER TABLE public.core_risk_violations ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;
ALTER TABLE public.core_risk_violations ADD COLUMN IF NOT EXISTS percentage numeric;

-- 2. ADVANCED RISK FLAGS (Behavioral/Review)
CREATE TABLE IF NOT EXISTS public.advanced_risk_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  flag_type text NOT NULL,
  severity text NOT NULL DEFAULT 'warning',
  description text,
  trade_ticket text,
  symbol text,
  analysis_data jsonb DEFAULT '{}'::jsonb,
  is_reviewed boolean DEFAULT false,
  reviewed_by uuid,
  review_notes text,
  created_at timestamptz DEFAULT now()
);

-- Ensure all columns exist for advanced_risk_flags (Crucial fix for "is_reviewed" error)
ALTER TABLE public.advanced_risk_flags ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.advanced_risk_flags ADD COLUMN IF NOT EXISTS trade_ticket text;
ALTER TABLE public.advanced_risk_flags ADD COLUMN IF NOT EXISTS symbol text;
ALTER TABLE public.advanced_risk_flags ADD COLUMN IF NOT EXISTS analysis_data jsonb DEFAULT '{}'::jsonb;
ALTER TABLE public.advanced_risk_flags ADD COLUMN IF NOT EXISTS is_reviewed boolean DEFAULT false;
ALTER TABLE public.advanced_risk_flags ADD COLUMN IF NOT EXISTS reviewed_by uuid;
ALTER TABLE public.advanced_risk_flags ADD COLUMN IF NOT EXISTS review_notes text;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_core_risk_challenge ON public.core_risk_violations(challenge_id);
CREATE INDEX IF NOT EXISTS idx_adv_risk_challenge ON public.advanced_risk_flags(challenge_id);
CREATE INDEX IF NOT EXISTS idx_adv_risk_reviewed ON public.advanced_risk_flags(is_reviewed);

-- RLS
ALTER TABLE public.core_risk_violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advanced_risk_flags ENABLE ROW LEVEL SECURITY;

-- Policies (Idempotent)
DROP POLICY IF EXISTS "Admins full access to core" ON public.core_risk_violations;
CREATE POLICY "Admins full access to core" ON public.core_risk_violations USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admins full access to advanced" ON public.advanced_risk_flags;
CREATE POLICY "Admins full access to advanced" ON public.advanced_risk_flags USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Users view own core" ON public.core_risk_violations;
CREATE POLICY "Users view own core" ON public.core_risk_violations FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users view own advanced" ON public.advanced_risk_flags;
CREATE POLICY "Users view own advanced" ON public.advanced_risk_flags FOR SELECT USING (auth.uid() = user_id);
