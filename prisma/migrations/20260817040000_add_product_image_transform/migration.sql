ALTER TABLE "products"
ADD COLUMN "image_position_x" INTEGER NOT NULL DEFAULT 50,
ADD COLUMN "image_position_y" INTEGER NOT NULL DEFAULT 50,
ADD COLUMN "image_rotation" INTEGER NOT NULL DEFAULT 0,
ADD CONSTRAINT "products_image_position_x_check"
  CHECK ("image_position_x" BETWEEN 0 AND 100),
ADD CONSTRAINT "products_image_position_y_check"
  CHECK ("image_position_y" BETWEEN 0 AND 100),
ADD CONSTRAINT "products_image_rotation_check"
  CHECK ("image_rotation" IN (0, 90, 180, 270));