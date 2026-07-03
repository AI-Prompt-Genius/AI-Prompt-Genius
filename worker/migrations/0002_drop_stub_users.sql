-- Auth moved to WorkOS AuthKit: identity comes from the access-token JWT `sub`, validated against
-- the WorkOS JWKS. The stub users/token table (smoke-test rows only) is no longer used.
-- Apply: npx wrangler d1 execute aipromptgenius --remote --file=migrations/0002_drop_stub_users.sql
DROP TABLE IF EXISTS users;
