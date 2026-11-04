-- Migración: Expandir restricción de roles en restaurant_staff para incluir 'cashier' y 'employee'
-- Fecha: 2026-11-04
-- Objetivo: Permitir sincronización real en BD de los roles de Cajero y Empleado Operativo

ALTER TABLE public.restaurant_staff 
  DROP CONSTRAINT IF EXISTS restaurant_staff_role_check;

ALTER TABLE public.restaurant_staff 
  ADD CONSTRAINT restaurant_staff_role_check 
  CHECK (role IN ('waiter', 'kitchen', 'barista', 'hostess', 'manager', 'cashier', 'employee', 'empleado'));

NOTIFY pgrst, 'reload schema';
