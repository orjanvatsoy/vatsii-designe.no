CREATE TABLE "order_email_thread_references" (
  "message_id" TEXT NOT NULL,
  "order_id" BIGINT NOT NULL,
  "reply_role" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "order_email_thread_references_pkey" PRIMARY KEY ("message_id"),
  CONSTRAINT "order_email_thread_references_reply_role_check"
    CHECK ("reply_role" IN ('customer', 'admin')),
  CONSTRAINT "order_email_thread_references_order_id_fkey"
    FOREIGN KEY ("order_id") REFERENCES "place_card_orders"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "order_email_thread_references_order_id_created_at_idx"
ON "order_email_thread_references"("order_id", "created_at");
