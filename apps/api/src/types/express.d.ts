import 'express';

declare global {
  namespace Express {
    interface Request {
      requestId: string;
      organizer?: {
        id: string;
        email: string | null;
      };
    }
  }
}

export {};
