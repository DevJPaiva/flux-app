-- ============================================================================
-- Flux — Migration: Role de Administrador + Políticas RLS + Proteção de Role
-- Projeto: luimqphsuecbelntlybg (flux-app)
-- ============================================================================

-- +migrate Up

-- 1. Enum de roles de usuário
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role' AND typnamespace = 'public'::regnamespace) THEN
    CREATE TYPE public.user_role AS ENUM ('user', 'admin');
  END IF;
END $$;

-- 2. Coluna role na tabela profiles (padrão: 'user')
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role public.user_role NOT NULL DEFAULT 'user';

-- 3. Função auxiliar segura para verificar se o usuário autenticado é admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin',
    false
  )
  OR EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = (SELECT auth.uid())
      AND role = 'admin'
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- 4. Trigger para impedir auto-escalação de privilégio em profiles.role
CREATE OR REPLACE FUNCTION public.protect_profile_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF current_setting('role', true) = 'authenticated' AND NOT public.is_admin() THEN
    IF TG_OP = 'INSERT' AND NEW.role <> 'user' THEN
      RAISE EXCEPTION 'Insufficient privileges to assign admin role';
    END IF;
    IF TG_OP = 'UPDATE' AND NEW.role IS DISTINCT FROM OLD.role THEN
      RAISE EXCEPTION 'Insufficient privileges to change user role';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.protect_profile_role() FROM PUBLIC;

CREATE TRIGGER trg_protect_profile_role
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_role();

-- 5. Atualizar handle_new_user para sincronizar role a partir de app_metadata (padrão 'user')
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_name text;
  v_role public.user_role;
BEGIN
  v_name := COALESCE(
    NULLIF(trim(NEW.raw_user_meta_data ->> 'name'), ''),
    NULLIF(split_part(COALESCE(NEW.email, ''), '@', 1), ''),
    'Usuário'
  );

  v_role := CASE
    WHEN (NEW.raw_app_meta_data ->> 'role') = 'admin' THEN 'admin'::public.user_role
    ELSE 'user'::public.user_role
  END;

  INSERT INTO public.profiles (id, name, email, avatar_url, role)
  VALUES (
    NEW.id,
    left(v_name, 70),
    COALESCE(NEW.email, 'usuario@flux.app'),
    NEW.raw_user_meta_data ->> 'avatar_url',
    v_role
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.categories (user_id, name, monthly_limit, tone, is_default, sort_order)
  VALUES
    (NEW.id, 'Moradia', 936.00, 'lime', true, 1),
    (NEW.id, 'Alimentação', 1132.00, 'lilac', true, 2),
    (NEW.id, 'Transporte', 1170.00, 'white', true, 3),
    (NEW.id, 'Lazer', 228.00, 'muted', true, 4),
    (NEW.id, 'Assinaturas', 150.00, 'lilac', true, 5),
    (NEW.id, 'Outros', 300.00, 'muted', true, 6)
  ON CONFLICT (user_id, name) DO NOTHING;

  RETURN NEW;
END;
$$;

-- 6. Políticas RLS de acesso completo para administradores
CREATE POLICY "profiles_admin_all"
  ON public.profiles FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "categories_admin_all"
  ON public.categories FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "cards_admin_all"
  ON public.cards FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "invoice_batches_admin_all"
  ON public.invoice_batches FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "transactions_admin_all"
  ON public.transactions FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "goals_admin_all"
  ON public.goals FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "goal_contributions_admin_all"
  ON public.goal_contributions FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "storage_admin_all"
  ON storage.objects FOR ALL TO authenticated
  USING (bucket_id IN ('invoices', 'avatars') AND public.is_admin())
  WITH CHECK (bucket_id IN ('invoices', 'avatars') AND public.is_admin());

-- +migrate Down
-- DROP POLICY IF EXISTS "storage_admin_all" ON storage.objects;
-- DROP POLICY IF EXISTS "goal_contributions_admin_all" ON public.goal_contributions;
-- DROP POLICY IF EXISTS "goals_admin_all" ON public.goals;
-- DROP POLICY IF EXISTS "transactions_admin_all" ON public.transactions;
-- DROP POLICY IF EXISTS "invoice_batches_admin_all" ON public.invoice_batches;
-- DROP POLICY IF EXISTS "cards_admin_all" ON public.cards;
-- DROP POLICY IF EXISTS "categories_admin_all" ON public.categories;
-- DROP POLICY IF EXISTS "profiles_admin_all" ON public.profiles;
-- DROP TRIGGER IF EXISTS trg_protect_profile_role ON public.profiles;
-- DROP FUNCTION IF EXISTS public.protect_profile_role();
-- DROP FUNCTION IF EXISTS public.is_admin();
-- ALTER TABLE public.profiles DROP COLUMN IF EXISTS role;
-- DROP TYPE IF EXISTS public.user_role;
