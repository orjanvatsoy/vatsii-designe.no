ALTER TABLE "temperature_data"
    ALTER COLUMN "created_at" DROP NOT NULL,
    ALTER COLUMN "temperature" DROP NOT NULL,
    ALTER COLUMN "temperature" TYPE DECIMAL USING "temperature"::DECIMAL,
    ALTER COLUMN "temperature_forcast" TYPE DECIMAL USING "temperature_forcast"::DECIMAL,
    ADD COLUMN IF NOT EXISTS "device_id" TEXT,
    ADD COLUMN IF NOT EXISTS "humidity" DECIMAL,
    ADD COLUMN IF NOT EXISTS "outdoor_temperature" DECIMAL;