-- Update the handle_new_user function to properly handle helper role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Insert profile with is_helper flag from metadata
  INSERT INTO public.profiles (user_id, display_name, is_helper)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Anonymous User'),
    COALESCE((NEW.raw_user_meta_data->>'is_helper')::boolean, false)
  );
  
  -- Assign role based on is_helper flag
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id, 
    CASE 
      WHEN COALESCE((NEW.raw_user_meta_data->>'is_helper')::boolean, false) = true 
      THEN 'user'::app_role 
      ELSE 'user'::app_role 
    END
  );
  
  RETURN NEW;
END;
$$;

-- Update existing user to be a helper
UPDATE public.profiles 
SET is_helper = true, hourly_rate = 50 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'akashd527@gmail.com');