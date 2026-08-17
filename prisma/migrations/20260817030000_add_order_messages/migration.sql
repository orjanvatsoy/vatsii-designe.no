CREATE TABLE "order_messages" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "order_id" BIGINT NOT NULL,
  "sender_role" TEXT NOT NULL,
  "sender_user_id" UUID NOT NULL,
  "body" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "customer_read_at" TIMESTAMPTZ(6),
  "admin_read_at" TIMESTAMPTZ(6),
  CONSTRAINT "order_messages_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "order_messages_order_id_fkey"
    FOREIGN KEY ("order_id") REFERENCES "place_card_orders"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "order_messages_sender_role_check"
    CHECK ("sender_role" IN ('customer', 'admin')),
  CONSTRAINT "order_messages_body_length_check"
    CHECK (char_length("body") BETWEEN 1 AND 2000)
);

CREATE INDEX "order_messages_order_id_created_at_idx"
ON "order_messages"("order_id", "created_at");

ALTER TABLE "order_messages" ENABLE ROW LEVEL SECURITY;