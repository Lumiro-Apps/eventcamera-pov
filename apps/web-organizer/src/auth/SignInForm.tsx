'use client';

import { FormEvent, useState } from 'react';
import { Camera, Mail, Lock, Loader2 } from 'lucide-react';

import { supabase } from '../lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

type AuthMode = 'password' | 'magic-link';
type AuthIntent = 'sign-in' | 'sign-up';

export function SignInForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [intent, setIntent] = useState<AuthIntent>('sign-in');
  const [mode, setMode] = useState<AuthMode>('password');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setIsLoading(true);

    try {
      if (intent === 'sign-up') {
        const redirectTo =
          process.env.NEXT_PUBLIC_ORGANIZER_REDIRECT_URL ?? window.location.origin;

        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectTo
          }
        });

        if (signUpError) throw signUpError;
        setMessage('Sign-up successful. Check your inbox to verify your account.');
      } else if (mode === 'password') {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (signInError) throw signInError;
        setMessage('Signed in successfully.');
      } else {
        const redirectTo =
          process.env.NEXT_PUBLIC_ORGANIZER_REDIRECT_URL ?? window.location.origin;

        const { error: magicLinkError } = await supabase.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: redirectTo }
        });

        if (magicLinkError) throw magicLinkError;
        setMessage('Magic link sent. Check your inbox.');
      }
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Authentication failed.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setError(null);
    setMessage(null);

    const redirectTo =
      process.env.NEXT_PUBLIC_ORGANIZER_REDIRECT_URL ?? window.location.origin;

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo }
    });

    if (oauthError) {
      setError(oauthError.message);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Camera className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-2xl">
          {intent === 'sign-up' ? 'Create Account' : 'Welcome Back'}
        </CardTitle>
        <CardDescription>
          POV EventCamera Organizer Dashboard
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Intent Toggle */}
        <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted p-1" role="tablist" aria-label="Auth intent">
          <button
            type="button"
            role="tab"
            aria-selected={intent === 'sign-in'}
            className={cn(
              'rounded-md px-3 py-2 text-sm font-medium transition-colors',
              intent === 'sign-in'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
            onClick={() => setIntent('sign-in')}
          >
            Sign In
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={intent === 'sign-up'}
            className={cn(
              'rounded-md px-3 py-2 text-sm font-medium transition-colors',
              intent === 'sign-up'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
            onClick={() => {
              setIntent('sign-up');
              setMode('password');
            }}
          >
            Sign Up
          </button>
        </div>

        {/* Mode Toggle (only for sign-in) */}
        {intent === 'sign-in' && (
          <div className="grid grid-cols-2 gap-2" role="tablist" aria-label="Sign in mode">
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'password'}
              className={cn(
                'rounded-md border px-3 py-2 text-sm font-medium transition-colors',
                mode === 'password'
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
              )}
              onClick={() => setMode('password')}
            >
              <Lock className="mr-2 inline-block h-4 w-4" />
              Password
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'magic-link'}
              className={cn(
                'rounded-md border px-3 py-2 text-sm font-medium transition-colors',
                mode === 'magic-link'
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
              )}
              onClick={() => setMode('magic-link')}
            >
              <Mail className="mr-2 inline-block h-4 w-4" />
              Magic Link
            </button>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="email"
              placeholder="organizer@example.com"
            />
          </div>

          {(mode === 'password' || intent === 'sign-up') && (
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                autoComplete="current-password"
                placeholder="Enter your password"
              />
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading
              ? 'Please wait...'
              : intent === 'sign-up'
                ? 'Create Account'
                : mode === 'password'
                  ? 'Sign In'
                  : 'Send Magic Link'}
          </Button>
        </form>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator className="w-full" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
          </div>
        </div>

        {/* Google Sign In */}
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => void handleGoogleSignIn()}
        >
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continue with Google
        </Button>

        {/* Messages */}
        {message && (
          <Alert variant="success">
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
