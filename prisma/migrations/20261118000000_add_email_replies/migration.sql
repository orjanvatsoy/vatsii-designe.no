ALTER TABLE "place_card_orders"
ADD COLUMN "customer_reply_token" TEXT,
ADD COLUMN "admin_reply_token" TEXT;

CREATE UNIQUE INDEX "place_card_orders_customer_reply_token_key"
ON "place_card_orders"("customer_reply_token");

CREATE UNIQUE INDEX "place_card_orders_admin_reply_token_key"
ON "place_card_orders"("admin_reply_token");

ALTER TABLE "order_messages"
ALTER COLUMN "sender_user_id" DROP NOT NULL;

ALTER TABLE "order_messages"
ADD COLUMN "received_email_id" TEXT;

CREATE UNIQUE INDEX "order_messages_received_email_id_key"
ON "order_messages"("received_email_id");
