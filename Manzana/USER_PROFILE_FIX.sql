-- Fix for user profile creation issue
-- The users table was missing an INSERT policy, preventing users from creating their own profiles

-- Add INSERT policy for users table
CREATE POLICY "Users can create own profile" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Also need to modify the users table to remove the DEFAULT uuid_generate_v4()
-- since we want to use auth.uid() as the primary key
ALTER TABLE users ALTER COLUMN id DROP DEFAULT;

-- Optional: Add a trigger to automatically set the user ID to auth.uid() on insert
CREATE OR REPLACE FUNCTION set_user_id_from_auth()
RETURNS TRIGGER AS $$
BEGIN
    NEW.id = auth.uid();
    RETURN NEW;
END;
$$ language plpgsql;

CREATE TRIGGER set_user_id_trigger
    BEFORE INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION set_user_id_from_auth();