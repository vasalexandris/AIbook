import React from 'react';
import { AlertTriangle, Check, CheckCircle2, GitCompare, X } from 'lucide-react';
import { t } from '../../i18n/translations';
import { RippleAnalysisResult, RippleImpactItem, UILanguage } from '../../types/book';

interface RippleEffectModalProps {
  lang: UILanguage;
  result: RippleAnalysisResult;
  onApproveImpact: (impact: RippleImpactItem) => void;
  onDismissImpact: (impact: RippleImpactItem) => void;
  onClose: () => void;
}

export const RippleEffectModal: React.FC<RippleEffectModalProps> = ({
  lang,
  result,
  onApproveImpact,
  onDismissImpact,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-[2px]">
      <div
        className="flex max-h-[88vh] w-full max-w-3xl flex-col rounded-2xl border shadow-2xl"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-start justify-between gap-4 border-b px-6 py-4"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <div className="flex items-start gap-3">
            <span
              className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
              style={{
                backgroundColor:
                  result.impacts.length > 0 ? 'var(--amber-soft)' : 'var(--sage-soft)',
                color: result.impacts.length > 0 ? 'var(--amber)' : 'var(--sage)',
              }}
            >
              {result.impacts.length > 0 ? (
                <GitCompare className="h-5 w-5" />
              ) : (
                <CheckCircle2 className="h-5 w-5" />
              )}
            </span>
            <div>
              <h2 className="font-editorial text-xl font-semibold">{t(lang, 'rippleTitle')}</h2>
              <p className="mt-0.5 text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {t(lang, 'rippleSubtitle')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 hover:opacity-80 cursor-pointer"
            style={{ color: 'var(--text-muted)' }}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {result.summary && (
            <div
              className="rounded-xl p-3.5 text-xs leading-relaxed"
              style={{
                backgroundColor: 'var(--bg-subtle)',
                color: 'var(--text-primary)',
              }}
            >
              <strong>{lang === 'el' ? 'Σύνοψη Ελέγχου:' : 'Audit Summary:'}</strong> {result.summary}
              {result.bibleUpdatesSuggested && (
                <div className="mt-1.5" style={{ color: 'var(--text-secondary)' }}>
                  <strong>Book Bible:</strong> {result.bibleUpdatesSuggested}
                </div>
              )}
            </div>
          )}

          {result.impacts.length === 0 ? (
            <div
              className="rounded-xl border p-6 text-center text-sm"
              style={{
                backgroundColor: 'var(--sage-soft)',
                borderColor: 'var(--sage)',
                color: 'var(--sage)',
              }}
            >
              {t(lang, 'rippleNoImpacts')}
            </div>
          ) : (
            result.impacts.map((imp, idx) => {
              const severityColor =
                imp.severity === 'high'
                  ? 'var(--danger)'
                  : imp.severity === 'medium'
                  ? 'var(--amber)'
                  : 'var(--sage)';
              const severityBg =
                imp.severity === 'high'
                  ? 'var(--danger-soft)'
                  : imp.severity === 'medium'
                  ? 'var(--amber-soft)'
                  : 'var(--sage-soft)';

              return (
                <div
                  key={`${imp.chapterId}-${idx}`}
                  className="rounded-xl border p-4 transition-opacity"
                  style={{
                    backgroundColor: 'var(--bg-canvas)',
                    borderColor: imp.applied ? 'var(--sage)' : 'var(--border-strong)',
                    opacity: imp.dismissed ? 0.5 : 1,
                  }}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" style={{ color: severityColor }} />
                      <span className="font-semibold text-sm">
                        {lang === 'el' ? `Κεφάλαιο ${imp.chapterNumber}` : `Chapter ${imp.chapterNumber}`}:{' '}
                        {imp.chapterTitle}
                      </span>
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase"
                        style={{ backgroundColor: severityBg, color: severityColor }}
                      >
                        {imp.severity}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {imp.applied ? (
                        <span
                          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold"
                          style={{ backgroundColor: 'var(--sage-soft)', color: 'var(--sage)' }}
                        >
                          <Check className="h-3.5 w-3.5" />
                          {t(lang, 'rippleApplied')}
                        </span>
                      ) : imp.dismissed ? (
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {t(lang, 'rippleDismiss')}
                        </span>
                      ) : (
                        <>
                          <button
                            onClick={() => onDismissImpact(imp)}
                            className="rounded-lg border px-2.5 py-1 text-xs font-medium cursor-pointer"
                            style={{
                              borderColor: 'var(--border-strong)',
                              color: 'var(--text-secondary)',
                            }}
                          >
                            {t(lang, 'rippleDismiss')}
                          </button>
                          <button
                            onClick={() => onApproveImpact(imp)}
                            className="inline-flex items-center gap-1 rounded-lg px-3 py-1 text-xs font-semibold text-white cursor-pointer"
                            style={{ backgroundColor: 'var(--sage)' }}
                          >
                            <Check className="h-3.5 w-3.5" />
                            <span>{t(lang, 'rippleApprove')}</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <p className="mt-2 text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    {imp.reason}
                  </p>

                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <div
                      className="rounded-lg border p-2.5 text-xs"
                      style={{
                        backgroundColor: 'var(--bg-surface)',
                        borderColor: 'var(--border-subtle)',
                      }}
                    >
                      <div className="mb-1 text-[10px] font-semibold uppercase" style={{ color: 'var(--danger)' }}>
                        {t(lang, 'rippleBefore')}
                      </div>
                      <p className="whitespace-pre-wrap leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                        {imp.originalExcerpt || '—'}
                      </p>
                    </div>

                    <div
                      className="rounded-lg border p-2.5 text-xs"
                      style={{
                        backgroundColor: 'var(--bg-surface)',
                        borderColor: 'var(--sage)',
                      }}
                    >
                      <div className="mb-1 text-[10px] font-semibold uppercase" style={{ color: 'var(--sage)' }}>
                        {t(lang, 'rippleAfter')}
                      </div>
                      <p className="whitespace-pre-wrap leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                        {imp.suggestedReplacement}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div
          className="flex justify-end border-t px-6 py-3.5"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-xs font-semibold text-white cursor-pointer"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            {t(lang, 'close')}
          </button>
        </div>
      </div>
    </div>
  );
};
