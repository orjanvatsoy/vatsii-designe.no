ALTER TABLE "temperature_data"
    ADD COLUMN IF NOT EXISTS "humidity_forcast" DECIMAL;