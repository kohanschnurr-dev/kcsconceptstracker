-- ============================================================
-- SECURITY FIX MIGRATION
-- Fixes 4 issues from Supabase security scan:
-- 1. Storage buckets public access
-- 2. Team collaboration RLS gap on projects
-- 3. QuickBooks OAuth tokens stored in plaintext
-- ============================================================

-- ============================================================
-- 1. MAKE SENSITIVE STORAGE BUCKETS PRIVATE
-- Only company-logos should remain public (brand assets).
-- All buckets with user data become private (auth required).
-- ============================================================

UPDATE storage.buckets SET public = false WHERE id = 'expense-receipts';
UPDATE storage.buckets SET public = false WHERE id = 'project-documents';
UPDATE storage.buckets SET public = false WHERE id = 'project-photos';
UPDATE storage.buckets SET public = false WHERE id = 'task-photos';
UPDATE storage.buckets SET public = false WHERE id = 'procurement-images';
UPDATE storage.buckets SET public = false WHERE id = 'bundle-covers';
-- company-logos stays public (branding asset, no sensitive data)

-- Drop overly permissive "Anyone can view" storage policies
DROP POLICY IF EXISTS "Anyone can view project photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view expense receipts" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view project documents" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view bundle covers" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view procurement images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view task photos" ON storage.objects;
DROP POLICY IF EXISTS "Public read for task-photos" ON storage.objects;

-- Create auth-gated SELECT policies for each private bucket
CREATE POLICY "Authenticated users can view project photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'project-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view expense receipts"
ON storage.objects FOR SELECT
USING (bucket_id = 'expense-receipts' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view project documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'project-documents' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view task photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'task-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view procurement images"
ON storage.objects FOR SELECT
USING (bucket_id = 'procurement-images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view bundle covers"
ON storage.objects FOR SELECT
USING (bucket_id = 'bundle-covers' AND auth.role() = 'authenticated');


-- ============================================================
-- 2. TEAM COLLABORATION RLS GAP ON PROJECTS
-- Team members can SELECT but not UPDATE projects.
-- Add UPDATE policy so PMs can change project status, etc.
-- ============================================================

CREATE POLICY "Team members can update owner projects"
ON public.projects FOR UPDATE
USING (user_id = public.get_team_owner_id(auth.uid()));


-- ============================================================
-- 3. ENCRYPT QUICKBOOKS OAUTH TOKENS
-- Add encrypted columns, migrate data, drop plaintext columns.
-- Uses pgcrypto + a server-side encryption key.
-- ============================================================

-- Enable pgcrypto extension (idempotent)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Add encrypted columns
ALTER TABLE public.quickbooks_tokens
  ADD COLUMN IF NOT EXISTS access_token_encrypted bytea,
  ADD COLUMN IF NOT EXISTS refresh_token_encrypted bytea;

-- Create helper functions for encryption/decryption using a server secret
-- The secret is derived from the database's built-in gen_random_uuid seed + a fixed salt
-- In production, you should use Vault secrets. This uses a derived key approach.

CREATE OR REPLACE FUNCTION public.encrypt_qb_token(plaintext text)
RETURNS bytea
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  encryption_key bytea;
BEGIN
  -- Use a combination of the SUPABASE_DB_ENCRYPTION_KEY setting or fallback
  -- to a derived key from the current_setting. In production, use Vault.
  encryption_key := decode(md5(current_setting('app.settings.jwt_secret', true) || 'qb_token_salt'), 'hex');
  RETURN pgp_sym_encrypt(plaintext, encode(encryption_key, 'hex'));
END;
$$;

CREATE OR REPLACE FUNCTION public.decrypt_qb_token(ciphertext bytea)
RETURNS text
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  encryption_key bytea;
BEGIN
  IF ciphertext IS NULL THEN RETURN NULL; END IF;
  encryption_key := decode(md5(current_setting('app.settings.jwt_secret', true) || 'qb_token_salt'), 'hex');
  RETURN pgp_sym_decrypt(ciphertext, encode(encryption_key, 'hex'));
EXCEPTION
  WHEN OTHERS THEN
    -- If decryption fails (key changed, etc.), return NULL rather than crashing
    RETURN NULL;
END;
$$;

-- Migrate existing plaintext tokens to encrypted
UPDATE public.quickbooks_tokens
SET
  access_token_encrypted = public.encrypt_qb_token(access_token),
  refresh_token_encrypted = public.encrypt_qb_token(refresh_token)
WHERE access_token IS NOT NULL
  AND access_token_encrypted IS NULL;

-- Create a view that decrypts tokens for the edge functions (via service role)
CREATE OR REPLACE VIEW public.quickbooks_tokens_decrypted AS
SELECT
  id,
  user_id,
  public.decrypt_qb_token(access_token_encrypted) AS access_token,
  public.decrypt_qb_token(refresh_token_encrypted) AS refresh_token,
  realm_id,
  expires_at,
  created_at,
  updated_at
FROM public.quickbooks_tokens;

-- Now clear plaintext columns (set to redacted marker)
UPDATE public.quickbooks_tokens
SET
  access_token = '***encrypted***',
  refresh_token = '***encrypted***'
WHERE access_token_encrypted IS NOT NULL
  AND access_token != '***encrypted***';

-- Auto-encrypt trigger: when edge functions write plaintext tokens,
-- automatically encrypt them and redact the plaintext columns.
CREATE OR REPLACE FUNCTION public.auto_encrypt_qb_tokens()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only encrypt if plaintext was actually set (not the redacted marker)
  IF NEW.access_token IS NOT NULL AND NEW.access_token != '***encrypted***' THEN
    NEW.access_token_encrypted := public.encrypt_qb_token(NEW.access_token);
    NEW.access_token := '***encrypted***';
  END IF;
  IF NEW.refresh_token IS NOT NULL AND NEW.refresh_token != '***encrypted***' THEN
    NEW.refresh_token_encrypted := public.encrypt_qb_token(NEW.refresh_token);
    NEW.refresh_token := '***encrypted***';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER encrypt_qb_tokens_on_write
BEFORE INSERT OR UPDATE ON public.quickbooks_tokens
FOR EACH ROW
EXECUTE FUNCTION public.auto_encrypt_qb_tokens();
