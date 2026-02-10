'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  Eye,
  Filter,
  Loader2,
  RefreshCw,
  Search,
  X,
  Image
} from 'lucide-react';
import { ApiClientError, type EventDetail, type GalleryItem } from '@poveventcam/api-client';

import { organizerApi } from '../lib/organizer-api';
import { useAuth } from './AuthProvider';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';

interface OrganizerGalleryShellProps {
  eventId: string;
}

function extractErrorMessage(error: unknown): string {
  if (error instanceof ApiClientError) {
    return `${error.code}: ${error.message}`;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Request failed';
}

function bytesToHuman(sizeBytes: number): string {
  if (sizeBytes < 1024) return `${sizeBytes} B`;
  if (sizeBytes < 1024 * 1024) return `${(sizeBytes / 1024).toFixed(1)} KB`;
  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function OrganizerGalleryShell({ eventId }: OrganizerGalleryShellProps) {
  const { session, signOut } = useAuth();
  const aliveRef = useRef(true);

  const [eventDetail, setEventDetail] = useState<EventDetail | null>(null);
  const [eventError, setEventError] = useState<string | null>(null);

  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [galleryCursor, setGalleryCursor] = useState<string | null>(null);
  const [galleryTotalCount, setGalleryTotalCount] = useState(0);
  const [isGalleryLoading, setIsGalleryLoading] = useState(false);
  const [galleryError, setGalleryError] = useState<string | null>(null);
  const [downloadingMediaId, setDownloadingMediaId] = useState<string | null>(null);

  const [filterUploaderInput, setFilterUploaderInput] = useState('');
  const [filterTagsInput, setFilterTagsInput] = useState('');
  const [activeFilterUploader, setActiveFilterUploader] = useState('');
  const [activeFilterTags, setActiveFilterTags] = useState('');

  const [isBulkDownloading, setIsBulkDownloading] = useState(false);
  const [bulkDownloadMessage, setBulkDownloadMessage] = useState<string | null>(null);
  const [bulkDownloadError, setBulkDownloadError] = useState<string | null>(null);
  const [bulkDownloadLinks, setBulkDownloadLinks] = useState<string[]>([]);

  // Selection state
  const [selectedMediaIds, setSelectedMediaIds] = useState<Set<string>>(new Set());

  // Preview state
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [isPreviewDownloading, setIsPreviewDownloading] = useState(false);

  // Long press state for touch devices
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTriggeredRef = useRef(false);

  const heading = useMemo(() => {
    if (!eventDetail) return 'Image Gallery';
    return `${eventDetail.name} Gallery`;
  }, [eventDetail]);

  const previewItem = useMemo(() => {
    if (previewIndex === null || previewIndex < 0 || previewIndex >= galleryItems.length) {
      return null;
    }
    return galleryItems[previewIndex];
  }, [previewIndex, galleryItems]);

  const hasSelection = selectedMediaIds.size > 0;

  useEffect(() => {
    return () => {
      aliveRef.current = false;
    };
  }, []);

  // Keyboard navigation for preview
  useEffect(() => {
    if (previewIndex === null) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setPreviewIndex(null);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setPreviewIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : prev));
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setPreviewIndex((prev) =>
          prev !== null && prev < galleryItems.length - 1 ? prev + 1 : prev
        );
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [previewIndex, galleryItems.length]);

  // Disable body scroll when preview is open
  useEffect(() => {
    if (previewIndex !== null) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [previewIndex]);

  async function loadEvent() {
    setEventError(null);
    try {
      const payload = await organizerApi.getEvent(eventId);
      setEventDetail(payload.event);
    } catch (nextError) {
      setEventError(extractErrorMessage(nextError));
    }
  }

  async function loadGallery(reset: boolean): Promise<void> {
    setIsGalleryLoading(true);
    setGalleryError(null);

    try {
      const response = await organizerApi.getGallery(eventId, {
        cursor: reset ? undefined : galleryCursor ?? undefined,
        limit: 30,
        sort: 'newest',
        filter_uploader: activeFilterUploader || undefined,
        filter_tag: activeFilterTags || undefined
      });

      setGalleryItems((current) => (reset ? response.media : [...current, ...response.media]));
      setGalleryCursor(response.next_cursor ?? null);
      setGalleryTotalCount(response.total_count);

      // Clear selection on filter change
      if (reset) {
        setSelectedMediaIds(new Set());
      }
    } catch (nextError) {
      setGalleryError(extractErrorMessage(nextError));
    } finally {
      setIsGalleryLoading(false);
    }
  }

  useEffect(() => {
    void loadEvent();
  }, [eventId]);

  useEffect(() => {
    void loadGallery(true);
  }, [eventId, activeFilterUploader, activeFilterTags]);

  async function handleDownloadMedia(mediaId: string, isPreview = false) {
    if (isPreview) {
      setIsPreviewDownloading(true);
    } else {
      setDownloadingMediaId(mediaId);
    }
    setGalleryError(null);

    try {
      const payload = await organizerApi.getMediaDownloadUrl(eventId, mediaId);
      window.open(payload.download_url, '_blank', 'noopener,noreferrer');
    } catch (nextError) {
      setGalleryError(extractErrorMessage(nextError));
    } finally {
      if (isPreview) {
        setIsPreviewDownloading(false);
      } else {
        setDownloadingMediaId(null);
      }
    }
  }

  async function pollBulkDownloadJob(jobId: string): Promise<void> {
    for (let attempt = 0; attempt < 60; attempt += 1) {
      if (!aliveRef.current) return;
      await sleep(1500);

      const status = await organizerApi.getJobStatus(jobId);
      if (status.status === 'complete') {
        const links: string[] = [];
        if (status.download_url) links.push(status.download_url);
        if (status.download_urls?.length) links.push(...status.download_urls);
        setBulkDownloadLinks(links);
        setBulkDownloadMessage('Bulk archive is ready.');
        return;
      }

      if (status.status === 'failed') {
        throw new Error(status.error_message || 'Bulk download job failed');
      }

      setBulkDownloadMessage(`Preparing archive... (${status.status})`);
    }

    throw new Error('Bulk download timed out. Try again.');
  }

  async function handleBulkDownload() {
    setIsBulkDownloading(true);
    setBulkDownloadError(null);
    setBulkDownloadLinks([]);
    setBulkDownloadMessage('Queueing archive...');

    try {
      const created = await organizerApi.downloadAll(eventId, { exclude_hidden: true });
      await pollBulkDownloadJob(created.job_id);
    } catch (nextError) {
      setBulkDownloadError(extractErrorMessage(nextError));
      setBulkDownloadMessage(null);
    } finally {
      setIsBulkDownloading(false);
    }
  }

  async function handleDownloadSelected() {
    if (selectedMediaIds.size === 0) return;

    setIsBulkDownloading(true);
    setBulkDownloadError(null);
    setBulkDownloadLinks([]);
    setBulkDownloadMessage(`Queueing archive for ${selectedMediaIds.size} selected image(s)...`);

    try {
      const created = await organizerApi.downloadSelected(eventId, {
        media_ids: Array.from(selectedMediaIds)
      });
      await pollBulkDownloadJob(created.job_id);
    } catch (nextError) {
      setBulkDownloadError(extractErrorMessage(nextError));
      setBulkDownloadMessage(null);
    } finally {
      setIsBulkDownloading(false);
    }
  }

  function handleApplyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setActiveFilterUploader(filterUploaderInput.trim());
    setActiveFilterTags(
      filterTagsInput
        .split(',')
        .map((tag) => tag.trim().toLowerCase())
        .filter(Boolean)
        .join(',')
    );
  }

  function handleResetFilters() {
    setFilterUploaderInput('');
    setFilterTagsInput('');
    setActiveFilterUploader('');
    setActiveFilterTags('');
  }

  function toggleSelectMedia(mediaId: string) {
    setSelectedMediaIds((prev) => {
      const next = new Set(prev);
      if (next.has(mediaId)) {
        next.delete(mediaId);
      } else {
        next.add(mediaId);
      }
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedMediaIds.size === galleryItems.length) {
      setSelectedMediaIds(new Set());
    } else {
      setSelectedMediaIds(new Set(galleryItems.map((item) => item.media_id)));
    }
  }

  function clearSelection() {
    setSelectedMediaIds(new Set());
  }

  // Long press handlers for touch devices
  function handleTouchStart(mediaId: string) {
    longPressTriggeredRef.current = false;
    longPressTimerRef.current = setTimeout(() => {
      longPressTriggeredRef.current = true;
      toggleSelectMedia(mediaId);
      // Provide haptic feedback if available
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    }, 500);
  }

  function handleTouchEnd() {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }

  function handleTouchMove() {
    // Cancel long press if user moves finger
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }

  function handleImageClick(index: number, mediaId: string) {
    // Don't open preview if long press was just triggered
    if (longPressTriggeredRef.current) {
      longPressTriggeredRef.current = false;
      return;
    }
    // In selection mode, clicking toggles selection instead of opening preview
    if (hasSelection) {
      toggleSelectMedia(mediaId);
      return;
    }
    setPreviewIndex(index);
  }

  function handlePreviewClick(e: React.MouseEvent, index: number) {
    e.stopPropagation();
    setPreviewIndex(index);
  }

  const hasActiveFilters = activeFilterUploader || activeFilterTags;

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Camera className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">{heading}</h1>
              <p className="text-sm text-muted-foreground">
                {session?.user.email}
                {eventDetail ? ` • ${eventDetail.slug}` : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link href="/">
                <ArrowLeft className="h-4 w-4" />
                Dashboard
              </Link>
            </Button>
            <Button variant="ghost" onClick={() => void signOut()}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 space-y-6">
        {eventError && (
          <Alert variant="destructive">
            <AlertDescription>{eventError}</AlertDescription>
          </Alert>
        )}

        {/* Filters & Toolbar */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Image className="h-5 w-5" />
                  Gallery
                </CardTitle>
                <CardDescription>{galleryTotalCount} image(s)</CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                {hasSelection && (
                  <>
                    <Button
                      variant="secondary"
                      onClick={() => void handleDownloadSelected()}
                      disabled={isBulkDownloading}
                    >
                      {isBulkDownloading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                      Download Selected ({selectedMediaIds.size})
                    </Button>
                    <Button variant="ghost" size="sm" onClick={clearSelection}>
                      <X className="h-4 w-4" />
                      Clear
                    </Button>
                  </>
                )}
                <Button
                  onClick={() => void handleBulkDownload()}
                  disabled={isBulkDownloading}
                  variant={hasSelection ? 'outline' : 'default'}
                >
                  {isBulkDownloading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  {isBulkDownloading ? 'Preparing...' : 'Download All'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => void loadGallery(true)}
                  disabled={isGalleryLoading}
                >
                  <RefreshCw className={`h-4 w-4 ${isGalleryLoading ? 'animate-spin' : ''}`} />

                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Filters */}
            <form onSubmit={handleApplyFilters} className="flex flex-wrap items-end gap-3">
              <div className="flex-1 min-w-[200px]">
                <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
                  Filter by uploader
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Name..."
                    value={filterUploaderInput}
                    onChange={(next) => setFilterUploaderInput(next.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
                  Filter by tags
                </label>
                <Input
                  type="text"
                  placeholder="Tags (comma separated)"
                  value={filterTagsInput}
                  onChange={(next) => setFilterTagsInput(next.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" size="sm">
                  <Filter className="h-4 w-4" />
                  Apply
                </Button>
                {hasActiveFilters && (
                  <Button type="button" size="sm" variant="outline" onClick={handleResetFilters}>
                    <X className="h-4 w-4" />
                    Clear
                  </Button>
                )}
              </div>
            </form>

            {/* Active filters & Select All */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap gap-2">
                {activeFilterUploader && (
                  <Badge variant="secondary">
                    Uploader: {activeFilterUploader}
                  </Badge>
                )}
                {activeFilterTags && (
                  <Badge variant="secondary">
                    Tags: {activeFilterTags}
                  </Badge>
                )}
              </div>
              {galleryItems.length > 0 && (
                <Button variant="ghost" size="sm" onClick={toggleSelectAll}>
                  <Check className="h-4 w-4" />
                  {selectedMediaIds.size === galleryItems.length ? 'Deselect All' : 'Select All'}
                </Button>
              )}
            </div>

            {/* Bulk download status */}
            {bulkDownloadMessage && (
              <Alert variant="info">
                <AlertDescription>{bulkDownloadMessage}</AlertDescription>
              </Alert>
            )}
            {bulkDownloadError && (
              <Alert variant="destructive">
                <AlertDescription>{bulkDownloadError}</AlertDescription>
              </Alert>
            )}
            {bulkDownloadLinks.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {bulkDownloadLinks.map((link, index) => (
                  <Button key={link} variant="outline" size="sm" asChild>
                    <a href={link} target="_blank" rel="noreferrer">
                      <Download className="h-4 w-4" />
                      Download Archive {bulkDownloadLinks.length > 1 ? index + 1 : ''}
                    </a>
                  </Button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Gallery Grid */}
        {galleryError && (
          <Alert variant="destructive">
            <AlertDescription>{galleryError}</AlertDescription>
          </Alert>
        )}

        {isGalleryLoading && galleryItems.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : galleryItems.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Image className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-muted-foreground">
                No images found {hasActiveFilters ? 'for this filter' : 'yet'}.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {galleryItems.map((item, index) => {
                const isSelected = selectedMediaIds.has(item.media_id);
                return (
                  <Card
                    key={item.media_id}
                    className={`overflow-hidden group cursor-pointer transition-all ${isSelected ? 'ring-2 ring-primary ring-offset-2' : ''
                      }`}
                  >
                    <div
                      className="relative aspect-square bg-muted select-none"
                      onClick={() => handleImageClick(index, item.media_id)}
                      onTouchStart={() => handleTouchStart(item.media_id)}
                      onTouchEnd={handleTouchEnd}
                      onTouchMove={handleTouchMove}
                      onTouchCancel={handleTouchEnd}
                    >
                      <img
                        src={item.thumb_url}
                        alt="Event upload preview"
                        loading="lazy"
                        draggable={false}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                      {/* Selection mode overlay */}
                      {hasSelection && (
                        <div className="absolute inset-0 bg-black/20 pointer-events-none" />
                      )}
                      {/* Selection checkbox - top left */}
                      <div
                        className={`absolute top-2 left-2 transition-opacity ${isSelected || hasSelection ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                          }`}
                        onClick={(e) => e.stopPropagation()}
                        onTouchStart={(e) => e.stopPropagation()}
                      >

                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleSelectMedia(item.media_id)}
                          className={`h-5 w-5 shadow-md data-[state=checked]:bg-primary data-[state=checked]:border-primary ${hasSelection
                            ? 'bg-white border-2 border-gray-500'
                            : 'bg-white/90 border-2 border-gray-400'
                            }`}
                        />
                      </div>
                      {/* Preview button - top right, shows on hover */}
                      <button
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70 active:bg-black/80"
                        onClick={(e) => handlePreviewClick(e, index)}
                        onTouchStart={(e) => e.stopPropagation()}
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>
                    <CardContent className="p-3">
                      <p className="font-medium text-sm truncate">
                        {item.uploaded_by || 'Unknown'}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {new Date(item.uploaded_at).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {bytesToHuman(item.size_bytes)}
                      </p>
                      {item.tags && item.tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {item.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs py-0">
                              {tag}
                            </Badge>
                          ))}
                          {item.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs py-0">
                              +{item.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {galleryCursor && (
              <div className="flex justify-center pt-4">
                <Button
                  variant="outline"
                  onClick={() => void loadGallery(false)}
                  disabled={isGalleryLoading}
                >
                  {isGalleryLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : null}
                  {isGalleryLoading ? 'Loading...' : 'Load More'}
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Image Preview Overlay */}
      {previewItem && previewIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setPreviewIndex(null)}
        >
          {/* Close button - larger touch target for mobile */}
          <button
            className="absolute top-4 right-4 text-white/80 hover:text-white p-3 rounded-full hover:bg-white/10 active:bg-white/20 transition-colors z-10"
            onClick={(e) => {
              e.stopPropagation();
              setPreviewIndex(null);
            }}
          >
            <X className="h-7 w-7" />
          </button>

          {/* Previous button */}
          {previewIndex > 0 && (
            <button
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white p-3 rounded-full hover:bg-white/10 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setPreviewIndex(previewIndex - 1);
              }}
            >
              <ChevronLeft className="h-8 w-8" />
            </button>
          )}

          {/* Next button */}
          {previewIndex < galleryItems.length - 1 && (
            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white p-3 rounded-full hover:bg-white/10 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setPreviewIndex(previewIndex + 1);
              }}
            >
              <ChevronRight className="h-8 w-8" />
            </button>
          )}

          {/* Image and details */}
          <div
            className="max-w-[90vw] max-h-[90vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={previewItem.thumb_url}
              alt="Preview"
              className="max-h-[70vh] max-w-full object-contain rounded-lg"
            />

            {/* Image info panel */}
            <div className="mt-4 bg-white/10 backdrop-blur-sm rounded-lg px-6 py-4 text-white min-w-[300px]">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium">{previewItem.uploaded_by || 'Unknown'}</p>
                  <p className="text-sm text-white/70">
                    {new Date(previewItem.uploaded_at).toLocaleString()} • {bytesToHuman(previewItem.size_bytes)}
                  </p>
                  {previewItem.tags && previewItem.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {previewItem.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs bg-white/20 text-white border-0">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => window.open(previewItem.thumb_url, '_blank', 'noopener,noreferrer')}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => void handleDownloadMedia(previewItem.media_id, true)}
                    disabled={isPreviewDownloading}
                  >
                    {isPreviewDownloading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                    Download
                  </Button>
                </div>
              </div>

              {/* Navigation indicator */}
              <div className="mt-3 text-center text-sm text-white/50">
                {previewIndex + 1} of {galleryItems.length} • Use ← → to navigate, ESC to close
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
