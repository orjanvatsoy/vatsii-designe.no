ALTER TABLE "place_card_orders" ADD COLUMN "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "place_card_orders" SET "updated_at" = "created_at";

ALTER TABLE "place_card_orders" ADD COLUMN "customer_updated_at" TIMESTAMPTZ(6);