-- ============================================================
-- RUN THIS IN A NEW SQL EDITOR TAB IN SUPABASE
-- This patch fixes the "Follow Error" and updates the schema
-- WITHOUT deleting your existing data.
-- ============================================================

-- 1. FIX THE "FOLLOW" ERROR
-- We update the function that creates notifications to run as "Administrator" (Security Definer)
-- This bypasses the permission check that was failing.
CREATE OR REPLACE FUNCTION notify_new_follower()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (user_id, type, from_user_id, message)
  VALUES (
    NEW.following_id,
    'follow',
    NEW.follower_id,
    (SELECT username FROM user_profiles WHERE id = NEW.follower_id) || ' started following you'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. ENSURE NOTIFICATIONS CAN BE INSERTED
-- Just in case, we add a policy to allow inserting notifications.
DROP POLICY IF EXISTS "Users can insert notifications" ON notifications;
CREATE POLICY "Users can insert notifications"
ON notifications FOR INSERT
WITH CHECK (true);

-- 3. ENABLE AVATARS AND WORKOUT UPLOADS (Optional, for Profile/Workout features)
-- We try to create the storage bucket. If it exists, nothing happens.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('workout-images', 'workout-images', true)
on conflict (id) do nothing;

-- Allow public access to view avatars
DROP POLICY IF EXISTS "Avatar images are publicly accessible." ON storage.objects;
create policy "Avatar images are publicly accessible."
  on storage.objects for select
  using ( bucket_id = 'avatars' );

-- Allow users to upload their own avatar
DROP POLICY IF EXISTS "Users can upload their own avatar." ON storage.objects;
create policy "Users can upload their own avatar."
  on storage.objects for insert
  with check ( bucket_id = 'avatars' AND auth.uid() = owner );

-- Allow users to update their own avatar
DROP POLICY IF EXISTS "Users can update their own avatar." ON storage.objects;
create policy "Users can update their own avatar."
  on storage.objects for update
  using ( bucket_id = 'avatars' AND auth.uid() = owner );
