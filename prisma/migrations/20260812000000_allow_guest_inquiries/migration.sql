ALTER TABLE "place_card_orders" ALTER COLUMN "user_id" DROP NOT NULL;

CREATE INDEX "place_card_orders_customer_email_idx" ON "place_card_orders"("customer_email");