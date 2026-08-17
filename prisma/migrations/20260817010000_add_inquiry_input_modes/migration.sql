ALTER TABLE "products"
ADD COLUMN "inquiry_input_mode" TEXT NOT NULL DEFAULT 'comment';

UPDATE "products"
SET "inquiry_input_mode" = 'name_list'
WHERE LOWER(TRIM("category")) = 'bordkort';

ALTER TABLE "place_card_orders"
ADD COLUMN "input_mode" TEXT NOT NULL DEFAULT 'name_list';