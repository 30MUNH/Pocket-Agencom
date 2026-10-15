-- Application uploads use the backend-only service role after app JWT authentication.
-- Public SELECT remains for image URLs; anonymous clients must not create or overwrite objects.
BEGIN;
DROP POLICY IF EXISTS "Give users authenticated access to folder 1oj01fe_1" ON storage.objects;
DROP POLICY IF EXISTS "Give users authenticated access to folder 1oj01fe_2" ON storage.objects;
COMMIT;
