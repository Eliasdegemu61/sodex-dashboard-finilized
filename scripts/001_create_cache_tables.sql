-- Create cache table for storing API data
CREATE TABLE IF NOT EXISTS public.cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create index on key for faster lookups
CREATE INDEX IF NOT EXISTS idx_cache_key ON public.cache(key);

-- Create index on expires_at for cleanup queries
CREATE INDEX IF NOT EXISTS idx_cache_expires_at ON public.cache(expires_at);

-- Enable RLS (disable for public cache table)
ALTER TABLE public.cache DISABLE ROW LEVEL SECURITY;

-- Create a function to clean up expired cache entries
CREATE OR REPLACE FUNCTION public.cleanup_expired_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM public.cache
  WHERE expires_at < TIMEZONE('utc'::text, NOW());
END;
$$ LANGUAGE plpgsql;

-- Create stats table for storing leaderboard data
CREATE TABLE IF NOT EXISTS public.leaderboard_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key TEXT NOT NULL UNIQUE,
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create index on cache_key
CREATE INDEX IF NOT EXISTS idx_leaderboard_cache_key ON public.leaderboard_cache(cache_key);

-- Create index on expires_at
CREATE INDEX IF NOT EXISTS idx_leaderboard_cache_expires_at ON public.leaderboard_cache(expires_at);

-- Disable RLS for public cache
ALTER TABLE public.leaderboard_cache DISABLE ROW LEVEL SECURITY;
