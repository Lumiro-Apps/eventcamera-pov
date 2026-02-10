import { createOrganizerApiClient } from '@poveventcam/api-client';

import { supabase } from './supabase';

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

export const organizerApi = createOrganizerApiClient({
  baseUrl,
  credentials: 'include',
  getAccessToken: async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  }
});
