# Database backup and restore notes

The application JSON backup (`backend/scripts/backup-real-db.js`) is a verified export of selected application tables. It is useful for inspection but is **not** a full PostgreSQL recovery image.

For the 2026-10-13 acceptance run, PostgreSQL 17.11 `pg_dump` produced this custom-format archive outside the repository:

`/tmp/pocket-agencom-db-backups/pocket-agencom-acceptance-2026-10-13.dump`

The archive is 286,321 bytes with SHA-256 `6fe7b34da1651283652eefdf11538da50527d709a5a259967b4acb04afa93db0`. `pg_restore --list` verified that it contains the `public` and `storage` schemas and their table data. The command used `--no-owner --no-privileges`, so the archive does not carry the source project's grants or role assignments.

This archive is still **partial**. Supabase Storage object bytes live outside PostgreSQL; `storage.objects` contains metadata only. Supabase Auth users and other managed schemas were not selected. Project settings, secrets, and external provider assets are also absent. A full disaster recovery plan needs a separate export of Storage object bytes and Supabase project configuration and should use a Supabase-supported full database backup for managed schemas.

## Restore rehearsal on a separate target

1. Provision a separate, disposable PostgreSQL or Supabase target with compatible extensions and managed schemas. Never point the restore command at the configured application database.
2. Run `pg_restore --list /path/to/archive.dump` and inspect the entries and checksum before restoration.
3. Set the target connection through standard `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`, and `PGSSLMODE` environment variables, then run `pg_restore --no-owner --no-privileges --dbname="$PGDATABASE" /path/to/archive.dump` against the disposable target. Existing Supabase-managed `storage` objects may need a schema-aware restore plan; resolve conflicts on the disposable target only.
4. Restore Storage object bytes from their separate export and check application, Auth, Storage, and RLS behavior before considering the target usable.

The acceptance run verified archive readability only. No restore was performed.
