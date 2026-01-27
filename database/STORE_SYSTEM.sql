-- ================================================================
-- SPINERGY STORE SYSTEM
-- Products, Categories, and Cart Management
-- ================================================================

-- Product Categories Enum
-- balls, blades, rubbers, accessories

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  category TEXT NOT NULL CHECK (category IN ('balls', 'blades', 'rubbers', 'accessories')),
  brand TEXT,
  description TEXT,
  specifications JSONB DEFAULT '{}', -- Flexible specs like speed, spin, control ratings
  price DECIMAL(10, 2) NOT NULL,
  sale_price DECIMAL(10, 2), -- Optional discounted price
  currency TEXT DEFAULT 'PKR',
  stock_quantity INTEGER DEFAULT 0,
  is_available BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Product images table (multiple images per product)
CREATE TABLE IF NOT EXISTS product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL, -- Google Drive or other image links
  is_primary BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Shopping cart table
CREATE TABLE IF NOT EXISTS cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_id TEXT, -- For guest users
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, product_id),
  UNIQUE(session_id, product_id)
);

-- Orders table (for tracking checkout requests)
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES users(id),
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  customer_address TEXT,
  items JSONB NOT NULL, -- Snapshot of cart items at checkout
  subtotal DECIMAL(10, 2) NOT NULL,
  total DECIMAL(10, 2) NOT NULL,
  notes TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_available ON products(is_available);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured);
CREATE INDEX IF NOT EXISTS idx_product_images_product ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_user ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_session ON cart_items(session_id);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- Function to generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
BEGIN
  RETURN 'SPG-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Trigger for order number
CREATE OR REPLACE FUNCTION set_order_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number IS NULL THEN
    NEW.order_number := generate_order_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_order_number ON orders;
CREATE TRIGGER trigger_set_order_number
  BEFORE INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION set_order_number();

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Products policies (public read, admin write)
DROP POLICY IF EXISTS "Products are viewable by everyone" ON products;
CREATE POLICY "Products are viewable by everyone" ON products FOR SELECT USING (true);

DROP POLICY IF EXISTS "Products are manageable by admins" ON products;
CREATE POLICY "Products are manageable by admins" ON products FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- Product images policies
DROP POLICY IF EXISTS "Product images are viewable by everyone" ON product_images;
CREATE POLICY "Product images are viewable by everyone" ON product_images FOR SELECT USING (true);

DROP POLICY IF EXISTS "Product images are manageable by admins" ON product_images;
CREATE POLICY "Product images are manageable by admins" ON product_images FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- Cart policies
DROP POLICY IF EXISTS "Users can manage their own cart" ON cart_items;
CREATE POLICY "Users can manage their own cart" ON cart_items FOR ALL USING (
  user_id = auth.uid() OR session_id IS NOT NULL
);

-- Orders policies
DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
CREATE POLICY "Users can view their own orders" ON orders FOR SELECT USING (
  user_id = auth.uid() OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Anyone can create orders" ON orders;
CREATE POLICY "Anyone can create orders" ON orders FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can manage orders" ON orders;
CREATE POLICY "Admins can manage orders" ON orders FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- ================================================================
-- SUCCESS MESSAGE
-- ================================================================

DO $$ 
BEGIN 
  RAISE NOTICE '';
  RAISE NOTICE '================================================================';
  RAISE NOTICE '✅ SPINERGY STORE SYSTEM CREATED!';
  RAISE NOTICE '================================================================';
  RAISE NOTICE 'Tables created:';
  RAISE NOTICE '  - products (name, category, price, specs, etc.)';
  RAISE NOTICE '  - product_images (multiple images per product)';
  RAISE NOTICE '  - cart_items (user shopping cart)';
  RAISE NOTICE '  - orders (checkout records)';
  RAISE NOTICE '';
  RAISE NOTICE 'Product Categories:';
  RAISE NOTICE '  - balls';
  RAISE NOTICE '  - blades (rackets)';
  RAISE NOTICE '  - rubbers';
  RAISE NOTICE '  - accessories';
  RAISE NOTICE '================================================================';
END $$;
