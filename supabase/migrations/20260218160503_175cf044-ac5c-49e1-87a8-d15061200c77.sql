
-- Enable realtime for owner_messages table so thread panels update live
ALTER PUBLICATION supabase_realtime ADD TABLE public.owner_messages;
