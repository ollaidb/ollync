-- =========================================================
-- FIX: Candidatures emploi (CV + lettre) + demandes categories
-- Objectif:
-- 1) garantir les colonnes match_requests utilisees par le front
-- 2) garantir le bucket storage `match_request_documents`
-- 3) garantir les policies d'upload/lecture/suppression
-- =========================================================

begin;

-- ---------------------------------------------------------
-- 1) Colonnes match_requests (idempotent)
-- ---------------------------------------------------------
alter table if exists public.match_requests
  add column if not exists request_document_url text,
  add column if not exists request_document_name text,
  add column if not exists request_cover_letter_url text,
  add column if not exists request_cover_letter_name text,
  add column if not exists request_intent text,
  add column if not exists reservation_date date,
  add column if not exists reservation_time time,
  add column if not exists reservation_duration_minutes integer;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'match_requests_request_intent_check'
  ) THEN
    ALTER TABLE public.match_requests
      ADD CONSTRAINT match_requests_request_intent_check
      CHECK (
        request_intent IS NULL
        OR request_intent IN ('request', 'apply', 'buy', 'reserve', 'ticket')
      );
  END IF;
END $$;

create index if not exists idx_match_requests_request_intent
  on public.match_requests(request_intent);

create index if not exists idx_match_requests_related_post_status
  on public.match_requests(related_post_id, status);

-- ---------------------------------------------------------
-- 2) Bucket documents candidature (CV/lettre)
-- ---------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'match_request_documents',
  'match_request_documents',
  true,
  10485760,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- ---------------------------------------------------------
-- 3) Policies storage.objects pour ce bucket
-- ---------------------------------------------------------
-- Lecture publique des documents uploadés
DROP POLICY IF EXISTS "Public Access match_request_documents" ON storage.objects;
CREATE POLICY "Public Access match_request_documents" ON storage.objects
  FOR SELECT USING (bucket_id = 'match_request_documents');

-- Upload authentifie
DROP POLICY IF EXISTS "Authenticated users can upload match request docs" ON storage.objects;
CREATE POLICY "Authenticated users can upload match request docs" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'match_request_documents'
    AND auth.role() = 'authenticated'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Update propre fichier
DROP POLICY IF EXISTS "Users can update their own match request docs" ON storage.objects;
CREATE POLICY "Users can update their own match request docs" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'match_request_documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  )
  WITH CHECK (
    bucket_id = 'match_request_documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Delete propre fichier
DROP POLICY IF EXISTS "Users can delete their own match request docs" ON storage.objects;
CREATE POLICY "Users can delete their own match request docs" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'match_request_documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

commit;

-- ---------------------------------------------------------
-- Verification (optionnel):
-- ---------------------------------------------------------
-- select column_name from information_schema.columns
-- where table_schema='public' and table_name='match_requests'
-- and column_name in (
--   'request_document_url','request_document_name',
--   'request_cover_letter_url','request_cover_letter_name',
--   'request_intent','reservation_date','reservation_time','reservation_duration_minutes'
-- ) order by 1;
--
-- select id, name, public, file_size_limit
-- from storage.buckets where id='match_request_documents';
