import React, { useState } from 'react';
import {
  CheckCircle2,
  ExternalLink,
  KeyRound,
  RefreshCw,
  ShieldCheck,
  X,
  AlertCircle,
} from 'lucide-react';
import { t } from '../../i18n/translations';
import {
  GEMINI_MODELS,
  listAvailableGeminiModels,
  testGeminiConnection,
} from '../../services/ai';
import { AIProviderConfig, UILanguage } from '../../types/book';

interface SettingsModalProps {
  lang: UILanguage;
  config: AIProviderConfig;
  onSave: (config: AIProviderConfig) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  lang,
  config,
  onSave,
  onClose,
}) => {
  const [apiKey, setApiKey] = useState(config.apiKey);
  const [model, setModel] = useState(config.model);
  const [modelsList, setModelsList] = useState(GEMINI_MODELS);
  const [loadingModels, setLoadingModels] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const handleLoadModels = async () => {
    if (!apiKey.trim()) return;
    setLoadingModels(true);
    setTestResult(null);
    try {
      const live = await listAvailableGeminiModels(apiKey.trim());
      if (live.length > 0) {
        setModelsList(live);
        if (!live.some((m) => m.id === model)) {
          const preferred =
            live.find((m) => m.id.includes('flash')) || live[0];
          setModel(preferred.id);
        }
        setTestResult({
          ok: true,
          msg:
            lang === 'el'
              ? `Βρέθηκαν ${live.length} διαθέσιμα μοντέλα Gemini για το κλειδί σου.`
              : `Loaded ${live.length} available Gemini models for your API key.`,
        });
      }
    } catch (err) {
      setTestResult({
        ok: false,
        msg: `${t(lang, 'connectionFailed')} ${err instanceof Error ? err.message : 'Error'}`,
      });
    } finally {
      setLoadingModels(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      await testGeminiConnection({ provider: 'gemini', apiKey: apiKey.trim(), model });
      setTestResult({ ok: true, msg: t(lang, 'connectionOk') });
    } catch (err) {
      setTestResult({
        ok: false,
        msg: `${t(lang, 'connectionFailed')} ${err instanceof Error ? err.message : 'Error'}`,
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    onSave({ provider: 'gemini', apiKey: apiKey.trim(), model });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]">
      <div
        className="w-full max-w-lg rounded-2xl border p-6 shadow-xl"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        <div className="flex items-center justify-between pb-4 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
          <div className="flex items-center gap-2.5">
            <KeyRound className="h-5 w-5" style={{ color: 'var(--accent)' }} />
            <h2 className="font-editorial text-xl font-semibold">{t(lang, 'settingsTitle')}</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 hover:opacity-80 cursor-pointer"
            style={{ color: 'var(--text-muted)' }}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              {t(lang, 'geminiApiKeyLabel')}
            </label>
            <input
              id="input-gemini-key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={t(lang, 'geminiApiKeyPlaceholder')}
              className="w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none focus:ring-2"
              style={{
                backgroundColor: 'var(--bg-canvas)',
                borderColor: 'var(--border-strong)',
                color: 'var(--text-primary)',
              }}
            />
            <div className="mt-1.5 flex items-center justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
              <span>{t(lang, 'getFreeKeyHint')}</span>
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 font-medium underline"
                style={{ color: 'var(--accent)' }}
              >
                Google AI Studio <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
                {t(lang, 'modelLabel')}
              </label>
              <button
                type="button"
                onClick={handleLoadModels}
                disabled={loadingModels || !apiKey.trim()}
                className="inline-flex items-center gap-1 text-[11px] font-semibold cursor-pointer disabled:opacity-50"
                style={{ color: 'var(--accent)' }}
              >
                <RefreshCw className={`h-3 w-3 ${loadingModels ? 'animate-spin' : ''}`} />
                <span>
                  {lang === 'el' ? 'Φόρτωση διαθέσιμων μοντέλων' : 'Fetch available models'}
                </span>
              </button>
            </div>
            <select
              id="select-gemini-model"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none"
              style={{
                backgroundColor: 'var(--bg-canvas)',
                borderColor: 'var(--border-strong)',
                color: 'var(--text-primary)',
              }}
            >
              {!modelsList.some((m) => m.id === model) && (
                <option value={model}>{model}</option>
              )}
              {modelsList.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <div
            className="flex items-start gap-2.5 rounded-xl p-3.5 text-xs leading-relaxed"
            style={{
              backgroundColor: 'var(--bg-subtle)',
              color: 'var(--text-secondary)',
            }}
          >
            <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5" style={{ color: 'var(--sage)' }} />
            <span>{t(lang, 'localFirstNote')}</span>
          </div>

          {testResult && (
            <div
              className="flex items-start gap-2 rounded-xl p-3 text-xs"
              style={{
                backgroundColor: testResult.ok ? 'var(--sage-soft)' : 'var(--danger-soft)',
                color: testResult.ok ? 'var(--sage)' : 'var(--danger)',
              }}
            >
              {testResult.ok ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              )}
              <span>{testResult.msg}</span>
            </div>
          )}
        </div>

        <div className="mt-6 flex items-center justify-between gap-3 pt-4 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
          <button
            id="btn-test-gemini"
            onClick={handleTest}
            disabled={testing || !apiKey.trim()}
            className="rounded-lg border px-3.5 py-2 text-xs font-medium transition-opacity disabled:opacity-50 cursor-pointer"
            style={{
              borderColor: 'var(--border-strong)',
              color: 'var(--text-primary)',
              backgroundColor: 'var(--bg-subtle)',
            }}
          >
            {testing ? t(lang, 'testing') : t(lang, 'testConnection')}
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-xs font-medium cursor-pointer"
              style={{ color: 'var(--text-secondary)' }}
            >
              {t(lang, 'close')}
            </button>
            <button
              id="btn-save-settings"
              onClick={handleSave}
              className="rounded-lg px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90 cursor-pointer"
              style={{ backgroundColor: 'var(--accent)' }}
            >
              {t(lang, 'saveSettings')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
