-- Disable the default personal account creation trigger to unblock user creation during testing
drop trigger if exists on_auth_user_created on auth.users;
