-- Quita a los roles públicos de Supabase (anon y authenticated) todo permiso sobre las tablas.
--
-- Por qué: la app NO usa la API REST de Supabase ni su anon key; entra con Prisma como
-- `postgres`. RLS ya está activado sin políticas (supabase-rls.sql), lo que deja a anon sin
-- filas, pero Supabase les concede SELECT/INSERT/UPDATE/DELETE/TRUNCATE por defecto. Si
-- algún día se desactivara RLS en una tabla (o se creara una tabla nueva sin RLS), quedaría
-- abierta a cualquiera con la anon key. Esto es la segunda capa (defensa en profundidad).
--
-- Seguro: no borra ni modifica datos; la app (rol postgres) no se ve afectada.
-- Se puede correr varias veces. Aplicar con:
--   npx.cmd prisma db execute --file prisma/supabase-privilegios.sql --schema prisma/schema.prisma
--
-- Revertir (volver a lo que trae Supabase por defecto):
--   GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
--   GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
--   ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated;

REVOKE ALL ON ALL TABLES    IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon, authenticated;

-- Tablas que se creen en el futuro (db push) tampoco darán permisos a esos roles.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON TABLES    FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM anon, authenticated;
