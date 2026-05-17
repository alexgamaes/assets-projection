// Source: RESEARCH.md §"Pattern Map — src/ui/CitationFooter.tsx"
// VIZ-06: visible source citations tracing displayed defaults to named research
import type { SourceRecord } from '../core/types.js';

// NEUT-02 / criterion 4: JST survivorship-bias caveat — §1-compliant condensation of
// SOURCES.jst2019.note (:173-182). No alarm punctuation, no banned verbs/adjectives.
// Traceable claims: ~0.5pp upward bias from restricting to markets that survived without
// revolution/expropriation; conservative shading below JST headlines (jst2019.note verbatim).
const JST_SURVIVORSHIP_CAVEAT =
  'The long-run historical return figures (Jordà, Schularick, Taylor 2019) are drawn from' +
  ' markets that survived without revolution or expropriation, introducing an estimated ~0.5pp' +
  ' upward survivorship bias in reported real equity and housing returns.' +
  ' The default parameters are shaded conservatively below the JST headline figures to account' +
  ' for this adjustment.';

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
      <p className="text-sm text-slate-600 mt-2">{JST_SURVIVORSHIP_CAVEAT}</p>
    </footer>
  );
}
