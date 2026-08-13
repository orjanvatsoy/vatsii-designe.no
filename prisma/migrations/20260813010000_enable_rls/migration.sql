-- These tables are accessed only through trusted server-side Prisma APIs.
-- With no policies, PostgREST roles cannot read or mutate their rows.
ALTER TABLE "_prisma_migrations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "place_card_orders" ENABLE ROW LEVEL SECURITY;
