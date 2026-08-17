ALTER TABLE "products"
ADD COLUMN "lightburn_object_key" TEXT,
ADD COLUMN "lightburn_file_name" TEXT,
ADD COLUMN "lightburn_size_bytes" INTEGER,
ADD COLUMN "lightburn_updated_at" TIMESTAMPTZ(6);

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
	'product-files',
	'product-files',
	false,
	52428800,
	ARRAY['application/octet-stream']
)
ON CONFLICT (id) DO UPDATE SET
	public = EXCLUDED.public,
	file_size_limit = EXCLUDED.file_size_limit,
	allowed_mime_types = EXCLUDED.allowed_mime_types;