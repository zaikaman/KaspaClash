-- Add avatar_url column to players table
ALTER TABLE public.players
ADD COLUMN avatar_url text;

-- Add comment for documentation
COMMENT ON COLUMN public.players.avatar_url IS 'URL to player avatar image stored on Cloudinary';
