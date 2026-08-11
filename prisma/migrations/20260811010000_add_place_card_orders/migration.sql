-- Recover cleanly if an earlier attempt created the table before the foreign key failed.
DROP TABLE IF EXISTS "place_card_orders";

-- Fresh databases created from the baseline used BIGSERIAL for products.id.
-- Existing Supabase databases already use UUID, so this block is a no-op there.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'products'
          AND column_name = 'id'
          AND data_type = 'bigint'
    ) THEN
        ALTER TABLE "products" ALTER COLUMN "id" DROP DEFAULT;
        ALTER TABLE "products" ALTER COLUMN "id" TYPE UUID USING gen_random_uuid();
        ALTER TABLE "products" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
    END IF;
END $$;

-- CreateTable
CREATE TABLE "place_card_orders" (
    "id" BIGSERIAL NOT NULL,
    "user_id" UUID NOT NULL,
    "customer_email" TEXT NOT NULL,
    "customer_name" TEXT,
    "product_id" UUID NOT NULL,
    "names" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'new',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "place_card_orders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "place_card_orders_user_id_idx" ON "place_card_orders"("user_id");

-- CreateIndex
CREATE INDEX "place_card_orders_product_id_idx" ON "place_card_orders"("product_id");

-- AddForeignKey
ALTER TABLE "place_card_orders" ADD CONSTRAINT "place_card_orders_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;