"use client";

import { useEffect } from "react";

interface Props {
  slug: string;
}

interface StoredViewRequest {
  id: string;
  createdAt: number;
}

const VIEW_WINDOW_MS = 60 * 60 * 1000;

function requestFor(slug: string): StoredViewRequest {
  const storageKey = `j4y_view_request_${slug}`;
  let stored: string | null = null;
  try {
    stored = sessionStorage.getItem(storageKey);
  } catch {
    // Some privacy modes disable Web Storage; cookie deduplication still applies.
  }

  if (stored) {
    try {
      const parsed = JSON.parse(stored) as StoredViewRequest;
      if (parsed.id && Date.now() - parsed.createdAt < VIEW_WINDOW_MS) return parsed;
    } catch {
      // Replace malformed or outdated session data below.
    }
  }

  const request = { id: crypto.randomUUID(), createdAt: Date.now() };
  try {
    sessionStorage.setItem(storageKey, JSON.stringify(request));
  } catch {
    // The server-issued cookie remains the primary reload guard.
  }
  return request;
}

export default function ViewTracker({ slug }: Props) {
  useEffect(() => {
    const viewRequest = requestFor(slug);
    void fetch(`/api/views/${encodeURIComponent(slug)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        viewId: viewRequest.id,
        referrer: document.referrer,
      }),
      keepalive: true,
    }).catch(() => {
      // Analytics must never interrupt the invitation experience.
    });
  }, [slug]);

  return null;
}