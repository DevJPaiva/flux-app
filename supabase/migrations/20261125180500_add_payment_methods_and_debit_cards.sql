-- ============================================================================
-- Flux — Suporte a Cartões de Débito e Formas de Pagamento (Pix, Dinheiro, Débito, Crédito)
-- ============================================================================

-- +migrate Up
ALTER TABLE public.cards
  ADD COLUMN IF NOT EXISTS card_type text NOT NULL DEFAULT 'credit'
    CHECK (card_type IN ('credit', 'debit'));

ALTER TABLE public.cards
  DROP CONSTRAINT IF EXISTS cards_credit_limit_check;

ALTER TABLE public.cards
  ADD CONSTRAINT cards_credit_limit_check
    CHECK ((card_type = 'debit' AND credit_limit >= 0) OR (card_type = 'credit' AND credit_limit > 0));

ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS payment_method text
    CHECK (payment_method IS NULL OR payment_method IN ('credit', 'debit', 'pix', 'cash'));

UPDATE public.transactions
SET payment_method = CASE
  WHEN type = 'income' THEN NULL
  WHEN card_id IS NOT NULL THEN 'credit'
  ELSE 'pix'
END
WHERE payment_method IS NULL;

-- +migrate Down
-- ALTER TABLE public.transactions DROP COLUMN IF EXISTS payment_method;
-- ALTER TABLE public.cards DROP CONSTRAINT IF EXISTS cards_credit_limit_check;
-- ALTER TABLE public.cards ADD CONSTRAINT cards_credit_limit_check CHECK (credit_limit > 0);
-- ALTER TABLE public.cards DROP COLUMN IF EXISTS card_type;
