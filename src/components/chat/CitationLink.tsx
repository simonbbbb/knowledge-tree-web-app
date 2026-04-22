import { ExternalLink } from 'lucide-react';
import type { Citation } from '@/lib/api';

interface CitationLinkProps {
  citation: Citation;
}

export function CitationLink({ citation }: CitationLinkProps) {
  const href =
    citation.resourceType === 'service'
      ? `/services/${citation.resourceName}`
      : `/graph`;

  return (
    <a
      href={href}
      className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-xs text-primary hover:bg-primary/20 transition-colors"
    >
      <ExternalLink className="h-3 w-3" />
      {citation.resourceName}
      <span className="text-primary/60">({citation.resourceType})</span>
    </a>
  );
}
