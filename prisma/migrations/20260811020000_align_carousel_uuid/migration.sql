-- The legacy Supabase table already uses UUID. This only aligns fresh databases
-- that were created from the original baseline migration.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'carousel_images'
          AND column_name = 'id'
          AND data_type = 'bigint'
    ) THEN
        ALTER TABLE "carousel_images" ALTER COLUMN "id" DROP DEFAULT;
        ALTER TABLE "carousel_images" ALTER COLUMN "id" TYPE UUID USING gen_random_uuid();
        ALTER TABLE "carousel_images" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
    END IF;
END $$;