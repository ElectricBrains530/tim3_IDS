-- Grant execute permissions on helper functions used in RLS policies
grant execute on function kit.is_account_owner(uuid) to authenticated, service_role;
grant execute on function kit.has_location_access(uuid) to authenticated, service_role;
