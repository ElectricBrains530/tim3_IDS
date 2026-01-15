-- Run this in the Supabase SQL Editor to manually create a personal account for your user
-- (Since the auto-create trigger was disabled)

-- Look up user by email
WITH new_user AS (
    SELECT id, email, raw_user_meta_data
    FROM auth.users
    WHERE email = 'desmondbristow@gmail.com'
),
inserted_account AS (
    INSERT INTO public.accounts (id, name, picture_url, email)
    SELECT 
        id, 
        COALESCE(raw_user_meta_data->>'full_name', 'My Account'), 
        raw_user_meta_data->>'avatar_url', 
        email
    FROM new_user
    RETURNING id
)
INSERT INTO public.memberships (account_id, user_id, role)
SELECT inserted_account.id, new_user.id, 'owner'
FROM inserted_account, new_user;
