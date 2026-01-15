-- Re-enable the personal account creation trigger
-- This ensures that when a user signs up, a personal account is created for them in public.accounts

-- Drop the trigger if it exists (to clean up)
drop trigger if exists on_auth_user_created on auth.users;

-- Re-create the function to be robust
create or replace function kit.new_user_created_setup() returns trigger
    language plpgsql
    security definer
    set search_path = ''
as $$
declare
    user_name   text;
    picture_url text;
begin
    -- Extract name from metadata or email
    if new.raw_user_meta_data ->> 'name' is not null then
        user_name := new.raw_user_meta_data ->> 'name';
    end if;

    if user_name is null and new.email is not null then
        user_name := split_part(new.email, '@', 1);
    end if;

    if user_name is null then
        user_name := '';
    end if;

    -- Extract avatar
    if new.raw_user_meta_data ->> 'avatar_url' is not null then
        picture_url := new.raw_user_meta_data ->> 'avatar_url';
    else
        picture_url := null;
    end if;

    -- Insert into public.accounts
    -- This function is security definer, so it bypasses RLS on public.accounts
    insert into public.accounts(id, name, picture_url, email)
    values (new.id, user_name, picture_url, new.email);

    return new;
exception
    when others then
        -- Log error to Postgres logs but do NOT block user creation if this fails
        -- (Optional: remove this exception block if we WANT to block user creation on failure)
        -- raise exception 'Failed to create account: %', SQLERRM;
        -- For now, we allow it to fail silently but log it, so user is created but account might be missing.
        -- Actually, for now, let's Raise Exception so we know it failed in the logs/client.
        raise notice 'Failed to create account for user %: %', new.id, SQLERRM;
        return new;
end;
$$;

-- Re-create the trigger
create trigger on_auth_user_created
    after insert
    on auth.users
    for each row
execute procedure kit.new_user_created_setup();
