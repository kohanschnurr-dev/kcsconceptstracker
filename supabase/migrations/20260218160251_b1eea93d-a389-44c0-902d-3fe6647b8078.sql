
-- 1. Add recipient_id column (NULL = message to owner, UUID = owner reply to that PM)
ALTER TABLE owner_messages ADD COLUMN IF NOT EXISTS recipient_id uuid;

-- 2. Allow owners to insert reply messages (sender = owner, recipient = PM's user_id)
CREATE POLICY "Owner can reply to messages"
ON owner_messages
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM teams
    WHERE teams.id = owner_messages.team_id
      AND teams.owner_id = auth.uid()
  )
);

-- 3. Allow PMs to see the owner's replies sent to them
CREATE POLICY "PMs can view owner replies to them"
ON owner_messages
FOR SELECT
TO authenticated
USING (recipient_id = auth.uid());
