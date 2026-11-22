-- ============================================================================
-- Flux — Migration Consolidada (espelho das migrations aplicadas no Supabase)
-- Projeto: luimqphsuecbelntlybg (flux-app)
-- Migrations aplicadas via Supabase MCP:
--   1. initial_flux_schema
--   2. flux_rls_and_storage
--   3. seed_demo_data
--   4. harden_trigger_function_grants
-- ============================================================================

-- +migrate Up

CREATE TYPE public.transaction_type AS ENUM ('expense', 'income');
CREATE TYPE public.card_tone AS ENUM ('white', 'lilac', 'gradient');
CREATE TYPE public.theme_preference AS ENUM ('dark', 'light', 'system');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(trim(name)) BETWEEN 1 AND 70),
  email text NOT NULL CHECK (char_length(trim(email)) BETWEEN 3 AND 254),
  avatar_url text,
  initial_balance numeric(12,2) NOT NULL DEFAULT 16840.00 CHECK (initial_balance >= 0),
  cash_adjustment numeric(12,2) NOT NULL DEFAULT 0.00,
  monthly_budget numeric(12,2) NOT NULL DEFAULT 3200.00 CHECK (monthly_budget > 0),
  hide_on_open boolean NOT NULL DEFAULT false,
  theme public.theme_preference NOT NULL DEFAULT 'dark',
  is_demo boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(trim(name)) BETWEEN 1 AND 30),
  monthly_limit numeric(12,2) NOT NULL DEFAULT 300.00 CHECK (monthly_limit > 0),
  tone text NOT NULL DEFAULT 'muted' CHECK (tone IN ('lime', 'lilac', 'white', 'muted')),
  is_default boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT categories_user_name_unique UNIQUE (user_id, name)
);

CREATE TABLE public.cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(trim(name)) BETWEEN 1 AND 24),
  last4 char(4) NOT NULL CHECK (last4 ~ '^[0-9]{4}$'),
  bill_amount numeric(12,2) NOT NULL DEFAULT 0.00 CHECK (bill_amount >= 0),
  credit_limit numeric(12,2) NOT NULL CHECK (credit_limit > 0),
  due_day smallint NOT NULL CHECK (due_day BETWEEN 1 AND 31),
  tone public.card_tone NOT NULL DEFAULT 'gradient',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.invoice_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  card_id uuid REFERENCES public.cards(id) ON DELETE SET NULL,
  file_name text NOT NULL CHECK (char_length(trim(file_name)) BETWEEN 1 AND 180),
  storage_path text,
  items_count integer NOT NULL DEFAULT 0 CHECK (items_count >= 0),
  total_amount numeric(12,2) NOT NULL DEFAULT 0.00 CHECK (total_amount >= 0),
  imported_at date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  card_id uuid REFERENCES public.cards(id) ON DELETE SET NULL,
  batch_id uuid REFERENCES public.invoice_batches(id) ON DELETE CASCADE,
  type public.transaction_type NOT NULL DEFAULT 'expense',
  name text NOT NULL CHECK (char_length(trim(name)) BETWEEN 1 AND 70),
  category text NOT NULL CHECK (char_length(trim(category)) BETWEEN 1 AND 30),
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  occurred_at date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT transactions_income_no_card CHECK (type = 'expense' OR card_id IS NULL)
);

CREATE TABLE public.goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(trim(name)) BETWEEN 1 AND 60),
  saved_amount numeric(12,2) NOT NULL DEFAULT 0.00 CHECK (saved_amount >= 0),
  target_amount numeric(12,2) NOT NULL CHECK (target_amount > 0),
  target_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT goals_saved_lte_target CHECK (saved_amount <= target_amount)
);

CREATE TABLE public.goal_contributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id uuid NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount numeric(12,2) NOT NULL CHECK (amount <> 0),
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Remover dados mockados temporários quando migrar para produção real:
-- DELETE FROM auth.users WHERE id = '00000000-0000-4000-8000-000000000001';

-- +migrate Down
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- DROP TABLE IF EXISTS public.goal_contributions, public.goals, public.transactions, public.invoice_batches, public.cards, public.categories, public.profiles CASCADE;
-- DROP FUNCTION IF EXISTS public.handle_new_user(), public.reassign_transactions_on_category_delete(), public.set_updated_at();
-- DROP TYPE IF EXISTS public.theme_preference, public.card_tone, public.transaction_type;
