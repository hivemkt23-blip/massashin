-- ============================================================
-- PARTE 1: TABELAS + SEGURANÇA
-- Cole este arquivo primeiro e execute
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  display_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  original_price DECIMAL(10,2),
  image_url TEXT,
  serves INTEGER DEFAULT 1,
  active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE option_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  required BOOLEAN DEFAULT false,
  min_selections INTEGER DEFAULT 0,
  max_selections INTEGER DEFAULT 1,
  display_order INTEGER DEFAULT 0
);

CREATE TABLE option_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID REFERENCES option_groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price_add DECIMAL(10,2) DEFAULT 0,
  active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0
);

CREATE TABLE delivery_zones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  radius_km_max DECIMAL(5,2) NOT NULL,
  delivery_time_min INTEGER NOT NULL,
  delivery_fee DECIMAL(10,2) NOT NULL
);

CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  label TEXT DEFAULT 'Casa',
  street TEXT NOT NULL,
  number TEXT NOT NULL,
  complement TEXT,
  neighborhood TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT 'Dourados',
  state TEXT NOT NULL DEFAULT 'MS',
  zip_code TEXT,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number SERIAL,
  user_id UUID REFERENCES user_profiles(id),
  address_id UUID REFERENCES addresses(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','confirmed','preparing','delivering','delivered','cancelled')),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('pix','credit_card','debit_card','cash')),
  subtotal DECIMAL(10,2) NOT NULL,
  delivery_fee DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  delivery_time_min INTEGER,
  customer_notes TEXT,
  whatsapp_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  product_name TEXT NOT NULL,
  product_price DECIMAL(10,2) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  item_notes TEXT,
  subtotal DECIMAL(10,2) NOT NULL
);

CREATE TABLE order_item_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_item_id UUID REFERENCES order_items(id) ON DELETE CASCADE,
  option_group_name TEXT NOT NULL,
  option_item_name TEXT NOT NULL,
  price_add DECIMAL(10,2) DEFAULT 0
);

-- RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_item_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE option_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE option_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_zones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_profile" ON user_profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "users_own_addresses" ON addresses FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_own_orders" ON orders FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_own_order_items" ON order_items FOR ALL
  USING (order_id IN (SELECT id FROM orders WHERE user_id = auth.uid()));
CREATE POLICY "users_own_order_options" ON order_item_options FOR ALL
  USING (order_item_id IN (
    SELECT oi.id FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    WHERE o.user_id = auth.uid()
  ));

CREATE POLICY "public_categories" ON categories FOR SELECT USING (true);
CREATE POLICY "public_products" ON products FOR SELECT USING (true);
CREATE POLICY "public_option_groups" ON option_groups FOR SELECT USING (true);
CREATE POLICY "public_option_items" ON option_items FOR SELECT USING (true);
CREATE POLICY "public_delivery_zones" ON delivery_zones FOR SELECT USING (true);

-- Trigger para criar perfil ao cadastrar
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
