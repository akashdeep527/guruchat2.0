-- Marketplace System for GuruChat 2.0
-- Digital goods marketplace where professionals can sell products

-- 1) Product Categories
create table if not exists public.product_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  icon text,
  created_at timestamptz not null default now()
);

-- Insert default categories
insert into public.product_categories (name, description, icon) values
  ('Digital Art', 'Digital paintings, illustrations, and graphics', '🎨'),
  ('Photography', 'Professional photos and image packs', '📸'),
  ('Video Content', 'Video tutorials, courses, and clips', '🎥'),
  ('Templates', 'Design templates and layouts', '📋'),
  ('Documents', 'PDFs, guides, and written content', '📄'),
  ('Audio', 'Music, podcasts, and sound effects', '🎵'),
  ('Software', 'Apps, scripts, and tools', '💻'),
  ('Other', 'Miscellaneous digital products', '📦')
on conflict (name) do nothing;

-- 2) Digital Products
create table if not exists public.digital_products (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  price_paise bigint not null check (price_paise > 0),
  category_id uuid references public.product_categories(id),
  product_type text not null, -- 'single', 'pack', 'subscription'
  file_urls text[], -- Array of file URLs
  thumbnail_url text,
  preview_url text,
  tags text[],
  is_active boolean not null default true,
  total_sales integer not null default 0,
  total_revenue_paise bigint not null default 0,
  rating numeric(3,2) check (rating >= 0 and rating <= 5),
  review_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3) Product Orders
create table if not exists public.product_orders (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.digital_products(id) on delete cascade,
  seller_id uuid not null references auth.users(id) on delete cascade,
  amount_paise bigint not null check (amount_paise > 0),
  status text not null default 'pending' check (status in ('pending', 'completed', 'failed', 'refunded')),
  download_urls text[], -- Array of download URLs
  purchased_at timestamptz not null default now(),
  expires_at timestamptz, -- For time-limited products
  transaction_id text -- Reference to wallet transaction
);

-- 4) Product Reviews
create table if not exists public.product_reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.digital_products(id) on delete cascade,
  reviewer_id uuid not null references auth.users(id) on delete cascade,
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text,
  created_at timestamptz not null default now(),
  unique(product_id, reviewer_id) -- One review per user per product
);

-- 5) Indexes for performance
create index if not exists digital_products_seller_id_idx on public.digital_products(seller_id);
create index if not exists digital_products_category_id_idx on public.digital_products(category_id);
create index if not exists digital_products_is_active_idx on public.digital_products(is_active);
create index if not exists product_orders_buyer_id_idx on public.product_orders(buyer_id);
create index if not exists product_orders_product_id_idx on public.product_orders(product_id);
create index if not exists product_reviews_product_id_idx on public.product_reviews(product_id);

-- 6) RLS Policies
alter table public.product_categories enable row level security;
alter table public.digital_products enable row level security;
alter table public.product_orders enable row level security;
alter table public.product_reviews enable row level security;

-- Product Categories: Readable by all
create policy "product_categories_select_all" on public.product_categories
  for select using (true);

-- Digital Products: Readable by all, manageable by seller
create policy "digital_products_select_all" on public.digital_products
  for select using (true);

create policy "digital_products_insert_own" on public.digital_products
  for insert with check (auth.uid() = seller_id);

create policy "digital_products_update_own" on public.digital_products
  for update using (auth.uid() = seller_id);

create policy "digital_products_delete_own" on public.digital_products
  for delete using (auth.uid() = seller_id);

-- Product Orders: Readable by buyer and seller
create policy "product_orders_select_own" on public.product_orders
  for select using (auth.uid() = buyer_id or auth.uid() = seller_id);

create policy "product_orders_insert_authenticated" on public.product_orders
  for insert with check (auth.uid() = buyer_id);

-- Product Reviews: Readable by all, manageable by reviewer
create policy "product_reviews_select_all" on public.product_reviews
  for select using (true);

create policy "product_reviews_insert_own" on public.product_reviews
  for insert with check (auth.uid() = reviewer_id);

create policy "product_reviews_update_own" on public.product_reviews
  for update using (auth.uid() = reviewer_id);

create policy "product_reviews_delete_own" on public.product_reviews
  for delete using (auth.uid() = reviewer_id);

-- 7) Helper Functions
create or replace function public.purchase_digital_product(
  _product_id uuid,
  _buyer_id uuid
)
returns uuid
language plpgsql
security definer
as $$
declare
  _order_id uuid;
  _product record;
  _current_balance bigint;
begin
  -- Get product details
  select * into _product from public.digital_products where id = _product_id and is_active = true;
  if not found then
    raise exception 'Product not found or inactive';
  end if;
  
  -- Check if buyer is not the seller
  if _buyer_id = _product.seller_id then
    raise exception 'Cannot purchase your own product';
  end if;
  
  -- Check buyer's wallet balance
  select balance into _current_balance from public.wallets where user_id = _buyer_id;
  if _current_balance is null or _current_balance < _product.price_paise then
    raise exception 'Insufficient wallet balance';
  end if;
  
  -- Deduct from buyer's wallet
  perform public.debit_wallet(_buyer_id, _product.price_paise, 'Digital product purchase', _product_id::text);
  
  -- Credit seller's wallet
  perform public.credit_wallet(_product.seller_id, _product.price_paise, 'Digital product sale', _product_id::text);
  
  -- Create order
  insert into public.product_orders (buyer_id, product_id, seller_id, amount_paise, status)
    values (_buyer_id, _product_id, _product.seller_id, _product.price_paise, 'completed')
    returning id into _order_id;
  
  -- Update product stats
  update public.digital_products 
    set total_sales = total_sales + 1,
        total_revenue_paise = total_revenue_paise + _product.price_paise
    where id = _product_id;
  
  return _order_id;
end;
$$;

-- Grant execute permissions
grant execute on function public.purchase_digital_product(uuid, uuid) to anon, authenticated, service_role;

-- 8) Update trigger for product rating calculation
create or replace function public.update_product_rating()
returns trigger
language plpgsql
as $$
begin
  update public.digital_products
  set rating = (
    select avg(rating)::numeric(3,2)
    from public.product_reviews
    where product_id = new.product_id
  ),
  review_count = (
    select count(*)
    from public.product_reviews
    where product_id = new.product_id
  )
  where id = new.product_id;
  
  return new;
end;
$$;

create trigger trigger_update_product_rating
  after insert or update or delete on public.product_reviews
  for each row
  execute function public.update_product_rating();
