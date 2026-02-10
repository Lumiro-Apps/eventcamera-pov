import { Camera, QrCode } from 'lucide-react';

export default function GuestHomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="w-full max-w-md">
        <div className="rounded-xl border bg-card p-8 text-center shadow-sm">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Camera className="h-8 w-8 text-primary" />
          </div>

          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary">
            POV EventCamera
          </p>
          <h1 className="text-2xl font-bold tracking-tight">
            Guest Upload Portal
          </h1>

          <div className="mt-6 rounded-lg bg-muted/50 p-4">
            <div className="mb-3 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <QrCode className="h-4 w-4" />
              <span>Scan a QR code to get started</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Your event link will look like:
            </p>
            <code className="mt-2 inline-block rounded-md bg-background px-3 py-1.5 text-sm font-mono">
              /e/your-event-slug
            </code>
          </div>
        </div>
      </div>
    </main>
  );
}
