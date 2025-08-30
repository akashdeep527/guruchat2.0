-- Add download_urls to digital_products table
-- This field will contain the actual downloadable content URLs that are revealed after purchase

-- Add download_urls column to digital_products if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'digital_products' 
        AND column_name = 'download_urls'
    ) THEN
        ALTER TABLE public.digital_products 
        ADD COLUMN download_urls text[];
    END IF;
END $$;

-- Create a view for user's purchased products (library)
CREATE OR REPLACE VIEW public.user_library AS
SELECT 
    po.id as order_id,
    po.buyer_id,
    po.product_id,
    po.amount_paise,
    po.status,
    po.purchased_at,
    po.expires_at,
    dp.title,
    dp.description,
    dp.thumbnail_url,
    dp.preview_url,
    dp.download_urls,
    dp.product_type,
    dp.category_id,
    pc.name as category_name,
    pc.icon as category_icon,
    p.display_name as seller_name,
    p.avatar_url as seller_avatar
FROM public.product_orders po
JOIN public.digital_products dp ON po.product_id = dp.id
LEFT JOIN public.product_categories pc ON dp.category_id = pc.id
LEFT JOIN public.profiles p ON dp.seller_id = p.user_id
WHERE po.status = 'completed' 
AND po.buyer_id = auth.uid();

-- Grant access to the library view
GRANT SELECT ON public.user_library TO authenticated;

-- Create RLS policy for the library view
CREATE POLICY "user_library_select_own" ON public.user_library
    FOR SELECT USING (auth.uid() = buyer_id);

-- Update the purchase function to include download URLs
CREATE OR REPLACE FUNCTION public.purchase_digital_product(
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
  
  -- Create order with download URLs
  insert into public.product_orders (
    buyer_id, 
    product_id, 
    seller_id, 
    amount_paise, 
    status,
    download_urls
  )
    values (
      _buyer_id, 
      _product_id, 
      _product.seller_id, 
      _product.price_paise, 
      'completed',
      _product.download_urls
    )
    returning id into _order_id;
  
  -- Update product stats
  update public.digital_products 
    set total_sales = total_sales + 1,
        total_revenue_paise = total_revenue_paise + _product.price_paise
    where id = _product_id;
  
  return _order_id;
end;
$$;
