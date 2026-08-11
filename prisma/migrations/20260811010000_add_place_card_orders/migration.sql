-- CreateTable
CREATE TABLE "place_card_orders" (
    "id" BIGSERIAL NOT NULL,
    "user_id" UUID NOT NULL,
    "customer_email" TEXT NOT NULL,
    "customer_name" TEXT,
    "product_id" BIGINT NOT NULL,
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