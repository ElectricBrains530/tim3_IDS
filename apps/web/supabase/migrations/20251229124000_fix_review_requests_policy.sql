
-- Fix IDOR in review_requests update policy
-- The existing policy "Review Requests Updateable by House" lacked a WITH CHECK clause,
-- allowing users to transfer review requests to locations they do not own.

drop policy if exists "Review Requests Updateable by House" on public.review_requests;

create policy "Review Requests Updateable by House"
    on public.review_requests
    for update
    to authenticated
    using ( kit.has_location_access(location_id) )
    with check ( kit.has_location_access(location_id) );
