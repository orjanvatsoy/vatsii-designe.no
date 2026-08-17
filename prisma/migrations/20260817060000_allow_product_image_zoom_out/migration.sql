ALTER TABLE "products"
DROP CONSTRAINT "products_image_zoom_check",
ADD CONSTRAINT "products_image_zoom_check"
  CHECK ("image_zoom" BETWEEN 50 AND 250);