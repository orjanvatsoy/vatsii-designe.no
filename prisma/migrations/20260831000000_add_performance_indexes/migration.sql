CREATE INDEX "temperature_data_created_at_idx"
ON "temperature_data"("created_at");

CREATE INDEX "place_card_orders_archived_at_created_at_idx"
ON "place_card_orders"("archived_at", "created_at");