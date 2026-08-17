ALTER TABLE "products"
ADD COLUMN "image_zoom" INTEGER NOT NULL DEFAULT 100,
ADD CONSTRAINT "products_image_zoom_check"
  CHECK ("image_zoom" BETWEEN 100 AND 250);