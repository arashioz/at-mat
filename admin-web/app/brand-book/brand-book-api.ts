import { API_URL, apiFetch, ApiError } from '../../lib/api';

export type SourceId = 'market' | 'story' | 'strategy';
export type Reference = { source: SourceId; location: string };
export type Source = { id: SourceId; title: string; label: string; detail: string };
export type Chapter = { id: string; title: string; summary: string; sections: { title: string; body: string }[]; references: Reference[] };
export type BrandBook = {
  cover: { title: string; tagline: string };
  chapters: Chapter[];
  assetCaptions: { key: string; caption: string }[];
  revision: number;
  updatedAt: string | null;
  sources: Source[];
};
export type Answer = { chapterId: string; chapterTitle: string; title: string; text: string; references: Reference[] };

const sourceFiles: Record<SourceId, string> = { market: 'atmat-market-plan.pdf', story: 'atmat-story.docx', strategy: 'atmat-strategy-v2.pdf' };

export async function downloadSource(token: string, id: SourceId) {
  const response = await fetch(`${API_URL}/brand-book/sources/${id}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new ApiError(data?.message ?? 'دریافت فایل انجام نشد.', response.status);
  }
  const url = URL.createObjectURL(await response.blob());
  const link = document.createElement('a');
  link.href = url;
  link.download = sourceFiles[id];
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function saveBook(token: string, { revision, cover, chapters, assetCaptions }: BrandBook) {
  return apiFetch<Pick<BrandBook, 'revision' | 'updatedAt'>>('/brand-book', token, {
    method: 'PUT', body: JSON.stringify({ revision, cover, chapters, assetCaptions }),
  });
}
