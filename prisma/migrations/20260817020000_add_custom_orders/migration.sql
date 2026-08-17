ALTER TABLE "place_card_orders"
ADD COLUMN "custom_dimensions" TEXT,
ADD COLUMN "custom_budget" INTEGER,
ADD COLUMN "desired_delivery_date" DATE;

CREATE TABLE "inquiry_attachments" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "order_id" BIGINT NOT NULL,
  "object_key" TEXT NOT NULL,
  "file_name" TEXT NOT NULL,
  "content_type" TEXT NOT NULL,
  "size_bytes" INTEGER NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "inquiry_attachments_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "inquiry_attachments_order_id_fkey"
    FOREIGN KEY ("order_id") REFERENCES "place_card_orders"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "inquiry_attachments_order_id_idx"
ON "inquiry_attachments"("order_id");

ALTER TABLE "inquiry_attachments" ENABLE ROW LEVEL SECURITY;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'inquiry-attachments',
  'inquiry-attachments',
  false,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

INSERT INTO "products" (
  "id",
  "name",
  "description",
  "category",
  "inquiry_input_mode",
  "active"
)
VALUES (
  '44444444-4444-4444-8444-444444444444',
  'Spesiallaget produkt',
  'Har du en idé, skisse eller et problem du ønsker løst? Beskriv produktet, oppgi omtrentlige mål og legg gjerne ved bilder. Jeg vurderer mulighetene og sender forslag, pris og estimert leveringstid. Forespørselen er uforpliktende.',
  'Spesialbestilling',
  'custom_order',
  true
)
ON CONFLICT ("id") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "category" = EXCLUDED."category",
  "inquiry_input_mode" = EXCLUDED."inquiry_input_mode",
  "active" = EXCLUDED."active";