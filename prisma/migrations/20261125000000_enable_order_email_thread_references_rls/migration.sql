-- Email thread references are accessed only through trusted server-side Prisma APIs.
-- With no policies, PostgREST roles cannot read or mutate their rows.
ALTER TABLE "order_email_thread_references" ENABLE ROW LEVEL SECURITY;
