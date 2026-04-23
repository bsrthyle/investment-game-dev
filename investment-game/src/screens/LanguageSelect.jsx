import { useEffect } from 'react';
import { SCREENS, COUNTRY_LANGUAGES, LANGUAGE_LABELS } from '../lib/constants.js';
import { useGameStore } from '../store/gameStore.js';
import { setLanguage, t } from '../i18n/index.js';
import { logEvent } from '../store/eventLog.js';

export default function LanguageSelect() {
  const transition = useGameStore((s) => s.transition);
  const updateSession = useGameStore((s) => s.updateSession);
  const country = useGameStore((s) => s.session?.country);
  const options = COUNTRY_LANGUAGES[country] || ['en'];

  useEffect(() => {
    logEvent(SCREENS.LANGUAGE_SELECT, 'screen_enter', { country, options });
  }, [country, options]);

  const select = async (lang) => {
    setLanguage(lang);
    await updateSession({ language: lang });
    await logEvent(SCREENS.LANGUAGE_SELECT, 'language_selected', { language: lang });
    transition(SCREENS.INSTRUCTIONS);
  };

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-10 bg-canvas animate-fade-up">
      <div className="text-center">
        <p className="text-badge uppercase tracking-[0.2em] text-ink/50">
          {country === 'NG' ? 'Nigeria' : ''}
        </p>
        <h1 className="mt-1 text-token-xl tracking-tight">{t('language.title')}</h1>
      </div>
      <div className="flex flex-wrap justify-center gap-6">
        {options.map((lang) => (
          <button
            key={lang}
            onClick={() => select(lang)}
            className="flex min-h-[112px] min-w-[220px] flex-col items-center justify-center gap-2 rounded-2xl bg-white px-10 py-8 shadow-card transition hover:-translate-y-1 hover:shadow-lg"
          >
            <span className="text-token-lg text-action-green">{LANGUAGE_LABELS[lang] || lang}</span>
            <span className="text-badge uppercase tracking-wide text-ink/50">{lang}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
