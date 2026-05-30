import { useEffect, useRef, useState } from 'react';
import { SCREENS } from '../lib/constants.js';
import { useGameStore } from '../store/gameStore.js';
import { logEvent } from '../store/eventLog.js';
import { t } from '../i18n/index.js';

// Post-game survey. Demographics + comprehension. Option `value`s are the
// canonical (English) answers that get stored in the session/export; `key`
// (when present) is the i18n label shown to the participant. Numeric options
// (age ranges) need no translation, so they have no key.
const QUESTIONS = [
  { id: 'gender', labelKey: 'survey.q.gender', type: 'choice', options: [
    { value: 'Woman', key: 'survey.opt.woman' },
    { value: 'Man', key: 'survey.opt.man' },
    { value: 'Other', key: 'survey.opt.other' },
    { value: 'Prefer not to say', key: 'survey.opt.preferNot' },
  ] },
  { id: 'ageRange', labelKey: 'survey.q.ageRange', type: 'choice', options: [
    { value: '18–24' }, { value: '25–34' }, { value: '35–44' }, { value: '45–54' }, { value: '55+' },
  ] },
  { id: 'educationLevel', labelKey: 'survey.q.education', type: 'choice', options: [
    { value: 'None', key: 'survey.opt.none' },
    { value: 'Primary', key: 'survey.opt.primary' },
    { value: 'Secondary', key: 'survey.opt.secondary' },
    { value: 'Tertiary', key: 'survey.opt.tertiary' },
  ] },
  { id: 'householdSize', labelKey: 'survey.q.householdSize', type: 'number' },
  { id: 'mainCrop', labelKey: 'survey.q.mainCrop', type: 'choice', options: [
    { value: 'Maize', key: 'survey.opt.maize' },
    { value: 'Sorghum', key: 'survey.opt.sorghum' },
    { value: 'Rice', key: 'survey.opt.rice' },
    { value: 'Cassava', key: 'survey.opt.cassava' },
    { value: 'Other', key: 'survey.opt.other' },
  ] },
  { id: 'usesFertilizer', labelKey: 'survey.q.usesFertilizer', type: 'choice', options: [
    { value: 'Always', key: 'survey.opt.always' },
    { value: 'Sometimes', key: 'survey.opt.sometimes' },
    { value: 'Never', key: 'survey.opt.never' },
  ] },
];

export default function Survey() {
  const transition = useGameStore((s) => s.transition);
  const updateSession = useGameStore((s) => s.updateSession);
  const [answers, setAnswers] = useState({});
  const startRef = useRef(new Date().toISOString());
  const qStartRef = useRef({});

  useEffect(() => {
    logEvent(SCREENS.SURVEY, 'screen_enter', {});
  }, []);

  const set = (id, v) => {
    const prev = answers[id] ?? null;
    const time = qStartRef.current[id] ? performance.now() - qStartRef.current[id] : null;
    logEvent(SCREENS.SURVEY, prev == null ? 'survey_answer' : 'survey_answer_change', {
      question_id: id, old_answer: prev, new_answer: v, answer: v, time_ms: time,
    });
    setAnswers((a) => ({ ...a, [id]: v }));
  };

  const markStart = (id) => {
    if (!qStartRef.current[id]) qStartRef.current[id] = performance.now();
  };

  const submit = async () => {
    const survey = {
      ...answers,
      surveyStartTime: startRef.current,
      surveyEndTime: new Date().toISOString(),
    };
    await updateSession({ survey });
    transition(SCREENS.COMPLETION);
  };

  const allAnswered = QUESTIONS.every((q) => answers[q.id] != null && answers[q.id] !== '');

  return (
    <div className="flex h-full w-full flex-col bg-canvas px-10 py-6">
      <h1 className="text-heading">{t('survey.title')}</h1>
      <div className="mt-4 flex-1 overflow-y-auto pr-2">
        {QUESTIONS.map((q) => (
          <div key={q.id} className="mb-4 rounded-xl bg-white p-4 shadow-sm" onFocus={() => markStart(q.id)}>
            <p className="text-body font-semibold">{t(q.labelKey)}</p>
            {q.type === 'choice' ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {q.options.map((opt) => (
                  <button
                    key={opt.value}
                    className={`min-h-touch rounded-lg px-4 py-2 text-body ${
                      answers[q.id] === opt.value ? 'bg-action-green text-white' : 'bg-ink/10 text-ink'
                    }`}
                    onClick={() => { markStart(q.id); set(q.id, opt.value); }}
                  >
                    {opt.key ? t(opt.key) : opt.value}
                  </button>
                ))}
              </div>
            ) : (
              <input
                type="number"
                className="mt-2 w-40 rounded border p-2 text-body"
                value={answers[q.id] ?? ''}
                onFocus={() => markStart(q.id)}
                onChange={(e) => set(q.id, e.target.value)}
              />
            )}
          </div>
        ))}
      </div>
      <button
        className="self-end rounded-xl bg-action-green px-10 py-4 text-body text-white disabled:opacity-40"
        disabled={!allAnswered}
        onClick={submit}
      >
        {t('survey.submit')}
      </button>
    </div>
  );
}
