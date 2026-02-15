import 'express';

declare global {
  namespace Express {
    interface Request {
      requestId: string;
      organizer?: {
        id: string;
        email: string | null;
        name?: string | null;
        auth_method?: 'bearer' | 'session';
        session_expires_at?: string | null;
      };
    }
  }
}

export {};
