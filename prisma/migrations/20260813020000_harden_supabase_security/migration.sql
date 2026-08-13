-- Pin the trigger function's lookup path to prevent caller-controlled resolution.
DO $$
DECLARE
    function_signature regprocedure;
BEGIN
    FOR function_signature IN
        SELECT procedure.oid::regprocedure
        FROM pg_proc AS procedure
        JOIN pg_namespace AS namespace ON namespace.oid = procedure.pronamespace
        WHERE namespace.nspname = 'public'
          AND procedure.proname = 'set_default_role'
    LOOP
        EXECUTE format(
            'ALTER FUNCTION %s SET search_path TO public, pg_temp',
            function_signature
        );
    END LOOP;
END
$$;

-- Public buckets serve objects without a SELECT policy. Removing these policies
-- prevents anonymous clients from listing every stored object.
DO $$
BEGIN
    IF to_regclass('storage.objects') IS NOT NULL THEN
        DROP POLICY IF EXISTS "Public read carousel" ON storage.objects;
        DROP POLICY IF EXISTS "Public read products" ON storage.objects;
    END IF;
END
$$;
