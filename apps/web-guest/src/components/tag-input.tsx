'use client';

import { KeyboardEvent, useId, useMemo, useState } from 'react';
import { X } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface TagInputProps {
  label: string;
  value: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  maxTags?: number;
}

function normalizeTag(raw: string): string {
  return raw.trim().toLowerCase();
}

function addUniqueTags(current: string[], rawValue: string, maxTags?: number): string[] {
  if (!rawValue.trim()) return current;

  const additions = rawValue
    .split(',')
    .map(normalizeTag)
    .filter(Boolean);

  if (!additions.length) return current;

  const next = [...current];
  for (const tag of additions) {
    if (!next.includes(tag)) {
      next.push(tag);
      if (maxTags && next.length >= maxTags) {
        break;
      }
    }
  }

  return next;
}

export function TagInput({
  label,
  value,
  onChange,
  disabled = false,
  className,
  placeholder = 'Add tag',
  maxTags
}: TagInputProps) {
  const generatedId = useId();
  const inputId = useMemo(() => `tag-input-${generatedId}`, [generatedId]);
  const [inputValue, setInputValue] = useState('');

  function commitInput(): void {
    if (disabled) return;
    if (!inputValue.trim()) return;
    onChange(addUniqueTags(value, inputValue, maxTags));
    setInputValue('');
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>): void {
    if (disabled) return;

    if (event.key === 'Enter' || event.key === ',' || event.key === 'Tab') {
      if (inputValue.trim()) {
        event.preventDefault();
        commitInput();
      }
      return;
    }

    if (event.key === 'Backspace' && !inputValue && value.length) {
      event.preventDefault();
      onChange(value.slice(0, -1));
    }
  }

  function handlePaste(clipboardText: string): void {
    if (disabled) return;
    if (!clipboardText.includes(',') && !clipboardText.includes('\n')) return;
    onChange(addUniqueTags(value, clipboardText.replace(/\n/g, ','), maxTags));
    setInputValue('');
  }

  return (
    <div className={className}>
      <label htmlFor={inputId} className="block text-xs font-medium text-muted-foreground">
        {label}
      </label>
      <div
        className={cn(
          'mt-1 flex min-h-9 w-full flex-wrap items-center gap-1 rounded-md border border-input bg-transparent px-2 py-1 text-sm shadow-sm transition-colors focus-within:ring-1 focus-within:ring-ring',
          disabled ? 'cursor-not-allowed opacity-60' : ''
        )}
      >
        {value.map((tag) => (
          <Badge key={tag} variant="secondary" className="gap-1 pr-1 text-xs">
            <span>{tag}</span>
            <button
              type="button"
              className="rounded p-0.5 hover:bg-black/10"
              onClick={() => onChange(value.filter((item) => item !== tag))}
              disabled={disabled}
              aria-label={`Remove tag ${tag}`}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        <input
          id={inputId}
          className="min-w-[90px] flex-1 bg-transparent py-1 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={commitInput}
          onPaste={(event) => handlePaste(event.clipboardData.getData('text'))}
          placeholder={value.length ? '' : placeholder}
          disabled={disabled || Boolean(maxTags && value.length >= maxTags)}
        />
      </div>
    </div>
  );
}
