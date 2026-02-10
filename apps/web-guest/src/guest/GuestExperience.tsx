'use client';

import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { Camera, Upload, User, RefreshCw, X, ImageIcon } from 'lucide-react';

import {
  guestApi,
  GuestApiError,
  type GuestSessionPayload,
  type MyUploadItem
} from '../lib/guest-api';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface GuestExperienceProps {
  slug: string;
}

type DraftStatus = 'queued' | 'uploading' | 'uploaded' | 'failed';

interface UploadDraft {
  id: string;
  file: File;
  tagsText: string;
  status: DraftStatus;
  error: string | null;
}

function formatApiError(error: unknown): string {
  if (error instanceof GuestApiError) {
    return `${error.code}: ${error.message}`;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Request failed';
}

function parseTagInput(value: string): string[] {
  if (!value.trim()) return [];
  const parsed = value
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

  return [...new Set(parsed)];
}

function generateDraftId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `draft_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

async function createThumbnailBlob(file: File): Promise<Blob | null> {
  if (!file.type.startsWith('image/')) return null;
  if (file.type.includes('heic') || file.type.includes('heif')) return null;

  return new Promise((resolve) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);
    image.onload = () => {
      const width = image.naturalWidth || image.width;
      const height = image.naturalHeight || image.height;
      if (!width || !height) {
        URL.revokeObjectURL(objectUrl);
        resolve(null);
        return;
      }

      const targetWidth = Math.min(480, width);
      const targetHeight = Math.max(Math.round((targetWidth / width) * height), 1);

      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      const context = canvas.getContext('2d');
      if (!context) {
        URL.revokeObjectURL(objectUrl);
        resolve(null);
        return;
      }

      context.drawImage(image, 0, 0, targetWidth, targetHeight);
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(objectUrl);
          resolve(blob ?? null);
        },
        'image/jpeg',
        0.72
      );
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(null);
    };
    image.src = objectUrl;
  });
}

function getStatusVariant(status: DraftStatus): 'default' | 'secondary' | 'success' | 'warning' | 'destructive' {
  switch (status) {
    case 'queued':
      return 'secondary';
    case 'uploading':
      return 'warning';
    case 'uploaded':
      return 'success';
    case 'failed':
      return 'destructive';
    default:
      return 'default';
  }
}

export function GuestExperience({ slug }: GuestExperienceProps) {
  const [sessionPayload, setSessionPayload] = useState<GuestSessionPayload | null>(null);
  const [uploads, setUploads] = useState<MyUploadItem[]>([]);
  const [drafts, setDrafts] = useState<UploadDraft[]>([]);
  const [nameTag, setNameTag] = useState('');
  const [pin, setPin] = useState('');
  const [requiresPin, setRequiresPin] = useState(false);
  const [isBooting, setIsBooting] = useState(true);
  const [isSavingName, setIsSavingName] = useState(false);
  const [isJoiningWithPin, setIsJoiningWithPin] = useState(false);
  const [isUploadingAll, setIsUploadingAll] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const uploadCountLabel = useMemo(() => {
    if (!sessionPayload) return '0 / 0';
    return `${sessionPayload.upload_count} / ${sessionPayload.max_uploads}`;
  }, [sessionPayload]);

  const refreshSession = useCallback(async () => {
    const payload = await guestApi.getMySession();
    if (payload.event.slug !== slug) {
      return null;
    }

    setSessionPayload(payload);
    setNameTag(payload.session.display_name ?? '');
    return payload;
  }, [slug]);

  const refreshUploads = useCallback(async () => {
    const payload = await guestApi.getMyUploads();
    setUploads(payload.uploads);
  }, []);

  const bootstrap = useCallback(async () => {
    setIsBooting(true);
    setError(null);
    setMessage(null);
    setRequiresPin(false);

    try {
      try {
        const existing = await guestApi.getMySession();
        if (existing.event.slug === slug) {
          setSessionPayload(existing);
          setNameTag(existing.session.display_name ?? '');
          await refreshUploads();
          return;
        }
      } catch (sessionError) {
        if (
          !(sessionError instanceof GuestApiError) ||
          (sessionError.statusCode !== 401 && sessionError.statusCode !== 403)
        ) {
          throw sessionError;
        }
      }

      const joined = await guestApi.joinEvent({ event_slug: slug });
      setSessionPayload(joined);
      setNameTag(joined.session.display_name ?? '');
      setMessage('You are checked in. Start uploading your photos.');
      await refreshUploads();
    } catch (nextError) {
      if (nextError instanceof GuestApiError && nextError.code === 'INVALID_PIN') {
        setRequiresPin(true);
        setError('This event requires a 4-digit PIN to join.');
      } else {
        setError(formatApiError(nextError));
      }
    } finally {
      setIsBooting(false);
    }
  }, [refreshUploads, slug]);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  function patchDraft(draftId: string, patch: Partial<UploadDraft>): void {
    setDrafts((current) =>
      current.map((item) => (item.id === draftId ? { ...item, ...patch } : item))
    );
  }

  async function uploadOne(draft: UploadDraft): Promise<void> {
    if (!sessionPayload) {
      setError('Session not ready. Reload and try again.');
      return;
    }

    if (!sessionPayload.session.display_name) {
      setError('Add your name tag before uploading so files are mapped to you.');
      return;
    }

    if (!draft.file.type) {
      patchDraft(draft.id, {
        status: 'failed',
        error: 'File type is missing. Please choose another file.'
      });
      return;
    }

    patchDraft(draft.id, { status: 'uploading', error: null });
    setError(null);
    setMessage(null);

    try {
      const createUpload = await guestApi.createUpload({
        file_type: draft.file.type,
        file_size: draft.file.size,
        tags: parseTagInput(draft.tagsText)
      });

      const originalUpload = await fetch(createUpload.upload_url, {
        method: 'PUT',
        headers: {
          'content-type': draft.file.type
        },
        body: draft.file
      });

      if (!originalUpload.ok) {
        throw new Error(`Storage upload failed (${originalUpload.status})`);
      }

      if (createUpload.thumb_upload_url) {
        const thumbBlob = await createThumbnailBlob(draft.file);
        if (thumbBlob) {
          await fetch(createUpload.thumb_upload_url, {
            method: 'PUT',
            headers: {
              'content-type': 'image/jpeg'
            },
            body: thumbBlob
          });
        }
      }

      await guestApi.completeUpload(createUpload.media_id);
      patchDraft(draft.id, { status: 'uploaded', error: null });

      await Promise.all([refreshSession(), refreshUploads()]);
      setMessage('Upload complete.');
    } catch (nextError) {
      patchDraft(draft.id, {
        status: 'failed',
        error: formatApiError(nextError)
      });
      setError(formatApiError(nextError));
    }
  }

  async function handleJoinWithPin(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setIsJoiningWithPin(true);
    setError(null);
    setMessage(null);

    try {
      const joined = await guestApi.joinEvent({
        event_slug: slug,
        pin: pin.trim(),
        display_name: nameTag.trim() || null
      });
      setRequiresPin(false);
      setSessionPayload(joined);
      setNameTag(joined.session.display_name ?? '');
      setMessage('Joined successfully. You can start uploading now.');
      await refreshUploads();
    } catch (nextError) {
      setError(formatApiError(nextError));
    } finally {
      setIsJoiningWithPin(false);
    }
  }

  async function handleSaveNameTag(): Promise<void> {
    if (!sessionPayload) return;

    setIsSavingName(true);
    setError(null);
    setMessage(null);

    try {
      const updated = await guestApi.patchMySession(nameTag.trim() || null);
      setSessionPayload(updated);
      setNameTag(updated.session.display_name ?? '');
      setMessage('Name tag saved. It will be attached to new uploads.');
    } catch (nextError) {
      setError(formatApiError(nextError));
    } finally {
      setIsSavingName(false);
    }
  }

  function handleSelectFiles(event: ChangeEvent<HTMLInputElement>): void {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;

    setDrafts((current) => [
      ...current,
      ...files.map((file) => ({
        id: generateDraftId(),
        file,
        tagsText: '',
        status: 'queued' as DraftStatus,
        error: null
      }))
    ]);

    event.target.value = '';
  }

  async function handleUploadAll(): Promise<void> {
    if (!drafts.length) return;

    setIsUploadingAll(true);
    for (const draft of drafts) {
      if (draft.status === 'uploaded') continue;
      await uploadOne(draft);
    }
    setIsUploadingAll(false);
  }

  if (isBooting) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <div className="mx-auto max-w-2xl">
          <Card className="mt-8">
            <CardContent className="flex min-h-[200px] flex-col items-center justify-center gap-4 p-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <div className="text-center">
                <h1 className="text-xl font-semibold">Joining event...</h1>
                <p className="mt-1 text-sm text-muted-foreground">Checking your guest session</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 pb-24">
      <div className="mx-auto max-w-2xl space-y-4">
        {/* Hero Card */}
        <Card className="border-0 bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5">
          <CardHeader className="pb-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">
              POV EventCamera
            </p>
            <CardTitle className="text-2xl">
              {sessionPayload?.event.name ?? 'Guest Upload'}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="gap-1">
              <Camera className="h-3 w-3" />
              {sessionPayload?.event.slug ?? slug}
            </Badge>
            <Badge variant="outline" className="gap-1">
              <ImageIcon className="h-3 w-3" />
              Uploads: {uploadCountLabel}
            </Badge>
          </CardContent>
        </Card>

        {/* PIN Entry */}
        {requiresPin && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Enter Event PIN</CardTitle>
              <CardDescription>
                This event requires a PIN to join
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={(event) => void handleJoinWithPin(event)} className="space-y-4">
                <Input
                  value={pin}
                  onChange={(event) => setPin(event.target.value)}
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="4-digit PIN"
                  className="text-center text-lg tracking-widest"
                  required
                />
                <Button type="submit" className="w-full" disabled={isJoiningWithPin}>
                  {isJoiningWithPin ? 'Joining...' : 'Join Event'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {sessionPayload && (
          <>
            {/* Name Tag */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="h-4 w-4" />
                  Your Name Tag
                </CardTitle>
                <CardDescription>
                  Let the organizer know who uploaded the photographs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input
                    value={nameTag}
                    onChange={(event) => setNameTag(event.target.value)}
                    maxLength={64}
                    placeholder="e.g. Priya, Family Table 3"
                    className="flex-1"
                  />
                  <Button
                    onClick={() => void handleSaveNameTag()}
                    disabled={isSavingName}
                    variant="secondary"
                  >
                    {isSavingName ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* File Picker */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Camera className="h-4 w-4" />
                  Add Photos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <label className="flex cursor-pointer flex-col items-center gap-3 rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/50 p-6 transition-colors hover:border-primary/50 hover:bg-muted">
                  <div className="rounded-full bg-primary/10 p-3">
                    <Upload className="h-6 w-6 text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="font-medium">Tap to select photos</p>
                    <p className="text-sm text-muted-foreground">From camera or gallery</p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    capture="environment"
                    onChange={handleSelectFiles}
                    className="hidden"
                  />
                </label>

                {drafts.length > 0 && (
                  <Button
                    onClick={() => void handleUploadAll()}
                    disabled={isUploadingAll}
                    className="w-full"
                  >
                    <Upload className="h-4 w-4" />
                    {isUploadingAll ? 'Uploading...' : `Upload All (${drafts.filter(d => d.status !== 'uploaded').length})`}
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Upload Queue */}
            {drafts.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Upload Queue</CardTitle>
                  <CardDescription>
                    {drafts.filter(d => d.status === 'uploaded').length} of {drafts.length} uploaded
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {drafts.map((draft) => (
                      <li
                        key={draft.id}
                        className="rounded-lg border bg-card p-4"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium text-sm">
                              {draft.file.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {Math.round(draft.file.size / 1024)} KB
                            </p>
                          </div>
                          <Badge variant={getStatusVariant(draft.status)}>
                            {draft.status}
                          </Badge>
                        </div>

                        <div className="mt-3 space-y-3">
                          <Input
                            value={draft.tagsText}
                            onChange={(event) => patchDraft(draft.id, { tagsText: event.target.value })}
                            placeholder="Tags (comma separated): stage, dance, family"
                            className="text-sm"
                          />

                          {draft.error && (
                            <Alert variant="destructive">
                              <AlertDescription>{draft.error}</AlertDescription>
                            </Alert>
                          )}

                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => void uploadOne(draft)}
                              disabled={draft.status === 'uploading' || draft.status === 'uploaded'}
                              className="flex-1"
                            >
                              {draft.status === 'uploaded'
                                ? 'Uploaded'
                                : draft.status === 'uploading'
                                  ? 'Uploading...'
                                  : 'Upload'}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                setDrafts((current) => current.filter((item) => item.id !== draft.id))
                              }
                              disabled={draft.status === 'uploading'}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* My Uploads */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">My Uploads</CardTitle>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => void refreshUploads()}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {uploads.length > 0 ? (
                  <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {uploads.map((upload) => (
                      <li
                        key={upload.media_id}
                        className="overflow-hidden rounded-lg border bg-card"
                      >
                        <div className="aspect-square">
                          <img
                            src={upload.thumb_url}
                            alt="Uploaded media preview"
                            loading="lazy"
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="p-2">
                          <p className="truncate text-xs font-medium">
                            {upload.uploader_name ?? 'No name tag'}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {upload.tags?.length ? upload.tags.join(', ') : 'No tags'}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    No uploads yet. Add some photos above.
                  </p>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* Alerts */}
        {message && (
          <Alert variant="success" className="fixed bottom-4 left-4 right-4 mx-auto max-w-2xl">
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}
        {error && (
          <Alert variant="destructive" className="fixed bottom-4 left-4 right-4 mx-auto max-w-2xl">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>
    </main>
  );
}
