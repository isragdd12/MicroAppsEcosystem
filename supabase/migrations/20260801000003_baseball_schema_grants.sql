-- Grant schema-level access so PostgREST can route requests
GRANT USAGE ON SCHEMA baseball TO anon, authenticated, service_role;

-- Ensure all existing tables in the schema are accessible
GRANT ALL ON ALL TABLES IN SCHEMA baseball TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA baseball TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA baseball TO authenticated;
