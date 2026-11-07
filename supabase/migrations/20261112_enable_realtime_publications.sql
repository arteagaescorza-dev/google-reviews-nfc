-- ==============================================================================
-- MIGRACIÓN: HABILITACIÓN DE PUBLICACIONES SUPABASE REALTIME (WEBSOCKETS)
-- Tablas operativas de alta concurrencia para estaciones de cocina y salón
-- ==============================================================================

DO $$
BEGIN
  -- 1. Comandas a cocina y mostrador (KDS y Pickup)
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE table_orders;
  EXCEPTION 
    WHEN duplicate_object THEN NULL;
    WHEN undefined_object THEN NULL;
  END;

  -- 2. Llamadas a mesero y solicitudes de cuenta
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE table_calls;
  EXCEPTION 
    WHEN duplicate_object THEN NULL;
    WHEN undefined_object THEN NULL;
  END;

  -- 3. Personal activo y turnos de colaboradores
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE restaurant_staff;
  EXCEPTION 
    WHEN duplicate_object THEN NULL;
    WHEN undefined_object THEN NULL;
  END;
END $$;
