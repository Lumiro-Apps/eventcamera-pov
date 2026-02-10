/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@poveventcam/api-client'],
  env: {
    NEXT_PUBLIC_SUPABASE_URL:
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? '',
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
      process.env.VITE_SUPABASE_ANON_KEY ??
      '',
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ??
      process.env.VITE_SUPABASE_ANON_KEY ??
      '',
    NEXT_PUBLIC_ORGANIZER_REDIRECT_URL:
      process.env.NEXT_PUBLIC_ORGANIZER_REDIRECT_URL ??
      process.env.VITE_ORGANIZER_REDIRECT_URL ??
      '',
    NEXT_PUBLIC_API_BASE_URL:
      process.env.NEXT_PUBLIC_API_BASE_URL ?? process.env.VITE_API_BASE_URL ?? ''
  }
};

export default nextConfig;
