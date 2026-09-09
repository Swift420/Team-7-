import { useEffect, useState } from 'react';

interface ArticleRouteOptions {
  selectedArticleId?: string;
  openArticle: (id: string) => Promise<void>;
}

/** Synchronizes article URLs without adding a router dependency. */
export function useArticleRoute({ selectedArticleId, openArticle }: ArticleRouteOptions): string | undefined {
  const [pathname, setPathname] = useState(() => (typeof window === 'undefined' ? '/' : window.location.pathname));
  const articleId = pathname.match(/^\/articles\/([^/]+)$/)?.[1];

  useEffect(() => {
    const onPopState = () => setPathname(window.location.pathname);
    window.addEventListener('popstate', onPopState);
    if (articleId && selectedArticleId !== articleId) void openArticle(articleId);
    return () => window.removeEventListener('popstate', onPopState);
  }, [articleId, openArticle, selectedArticleId]);

  return articleId;
}
