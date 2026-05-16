// Source: RESEARCH.md §"Pattern Map — src/ui/CitationFooter.tsx"
// VIZ-06: visible source citations tracing displayed defaults to named research
import type { SourceRecord } from '../core/types.js';

interface Props {
  citations: SourceRecord[];
}

export function CitationFooter({ citations }: Props) {
  return (
    <footer className="mt-12 text-sm text-slate-600 font-normal border-t border-slate-200 pt-6">
      <p>
        Default parameters sourced from:{' '}
        {citations.map((c, i) => (
          <span key={c.sourceName}>
            {c.url ? (
              <a
                href={c.url}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-slate-800"
              >
                {c.sourceName}
              </a>
            ) : (
              <span>{c.sourceName}</span>
            )}
            {i < citations.length - 1 ? '; ' : '.'}
          </span>
        ))}
        {' '}See sources for definitions and caveats.
      </p>
    </footer>
  );
}
