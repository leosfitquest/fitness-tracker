-- Allow authenticated users to insert notifications (e.g., for follows)
create policy "Allow insert for authenticated users"
on "public"."notifications"
as permissive
for insert
to authenticated
with check (true);
