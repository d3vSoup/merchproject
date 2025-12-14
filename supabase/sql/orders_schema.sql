-- Ensure the update_updated_at_column function exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- SAFELY recreate triggers without errors
DROP TRIGGER IF EXISTS update_dummy_orders_updated_at ON dummy_orders;
DROP TRIGGER IF EXISTS update_confirmed_orders_updated_at ON confirmed_orders;

CREATE TRIGGER update_dummy_orders_updated_at 
BEFORE UPDATE ON dummy_orders
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_confirmed_orders_updated_at
BEFORE UPDATE ON confirmed_orders
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
