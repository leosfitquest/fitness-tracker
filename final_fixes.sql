-- 1. Fix Notifications RLS by making the trigger function SECURITY DEFINER
-- This allows the trigger to bypass RLS checks when inserting the notification.
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

-- 2. (Optional backup) Policy to allow inserting notifications
CREATE POLICY "Users can insert notifications"
ON notifications FOR INSERT
WITH CHECK (true);

-- 3. Storage for Avatars (Preparation for Custom Images)
-- Note: This requires the storage schema to be enabled in Supabase
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "Avatar images are publicly accessible."
  on storage.objects for select
  using ( bucket_id = 'avatars' );

create policy "Users can upload their own avatar."
  on storage.objects for insert
  with check ( bucket_id = 'avatars' );
