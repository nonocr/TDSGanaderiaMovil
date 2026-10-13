-- Activa Row Level Security en todas las tablas de la app.
--
-- Supabase publica automáticamente las tablas del esquema `public` en su API REST
-- (con la "anon key"). Esta app NO usa esa API: entra con Prisma como usuario `postgres`,
-- que ignora RLS. Activar RLS sin políticas deja la API REST sin acceso a los datos,
-- y la app sigue funcionando igual.
--
-- Se aplica una vez por base nueva, tras `npm run db:push`, con:
--   npx.cmd prisma db execute --file prisma/supabase-rls.sql --schema prisma/schema.prisma
-- (o pegándolo en el SQL Editor de Supabase). Es seguro correrlo varias veces.

ALTER TABLE "Animal"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Monta"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Parto"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Cria"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RegistroLeche" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RegistroPeso"  ENABLE ROW LEVEL SECURITY;
ALTER TABLE "EtapaTernero"  ENABLE ROW LEVEL SECURITY;
ALTER TABLE "IntentoLogin"  ENABLE ROW LEVEL SECURITY;
