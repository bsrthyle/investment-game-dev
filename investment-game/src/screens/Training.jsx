import { useEffect, useState } from 'react';
import { SCREENS } from '../lib/constants.js';
import { useGameStore } from '../store/gameStore.js';
import { logEvent } from '../store/eventLog.js';
import { t } from '../i18n/index.js';
import IconArray from '../components/IconArray.jsx';

// Probability-comprehension training. v2: every participant who plays the game
// sees this module — there is no longer a training arm. Three short steps
// (concept → count → comprehension check). Results are committed to the
// session so we can analyse comprehension alongside the dose decisions later.
//
// Option `value`s are the canonical (English) answers that get stored/compared;
// `key` (when present) is the i18n label shown to the participant. Numeric
// options (1/3/6) need no translation, so they have no key.
const QUESTIONS = [
  {
    id: 'drought_count',
    promptKey: 'training.q.drought',
    kind: 'rain',
    probs: [0.6, 0.3, 0.1],
    options: [{ value: '1' }, { value: '3' }, { value: '6' }],
    correct: '1',
  },
  {
    id: 'price_mode',
    promptKey: 'training.q.priceMode',
    kind: 'price',
    probs: [0.8, 0.1, 0.1],
    options: [
      { value: 'High price', key: 'training.opt.highPrice' },
      { value: 'Normal price', key: 'training.opt.normalPrice' },
      { value: 'Low price', key: 'training.opt.lowPrice' },
    ],
    correct: 'High price',
  },
];

export default function Training() {
  const transition = useGameStore((s) => s.transition);
  const updateSession = useGameStore((s) => s.updateSession);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [attempts, setAttempts] = useState({}); // questionId -> count

  useEffect(() => {
    logEvent(SCREENS.TRAINING, 'screen_enter', {});
  }, []);

  const finish = async () => {
    await updateSession({
      training: {
        completed: true,
        startedAt: new Date().toISOString(),
        attempts,
        finalAnswers: answers,
        correctOnFirstTry: QUESTIONS.every((q) => answers[q.id] === q.correct && (attempts[q.id] ?? 0) === 1),
      },
    });
    logEvent(SCREENS.TRAINING, 'training_complete', {
      attempts,
      correctOnFirstTry: QUESTIONS.every((q) => answers[q.id] === q.correct && (attempts[q.id] ?? 0) === 1),
    });
    transition(SCREENS.PRACTICE);
  };

  const onAnswer = (q, value) => {
    const next = attempts[q.id] ? attempts[q.id] + 1 : 1;
    setAttempts((a) => ({ ...a, [q.id]: next }));
    const isCorrect = value === q.correct;
    logEvent(SCREENS.TRAINING, 'training_answer', {
      question_id: q.id, answer: value, correct: isCorrect, attempt: next,
    });
    if (isCorrect) {
      setAnswers((a) => ({ ...a, [q.id]: value }));
    }
  };

  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-canvas p-10">
      <div className="w-full max-w-3xl">
        <div className="mb-6 flex items-center justify-between">
          <p className="text-badge uppercase tracking-[0.2em] text-ink/50">
            {t('training.stepOf', { n: step + 1 })}
          </p>
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <span key={i} className={`h-2 w-10 rounded-full ${i <= step ? 'bg-action-green' : 'bg-ink/15'}`} />
            ))}
          </div>
        </div>

        {step === 0 && <ConceptStep onNext={() => setStep(1)} />}
        {step === 1 && <CountStep onBack={() => setStep(0)} onNext={() => setStep(2)} />}
        {step === 2 && (
          <CheckStep
            answers={answers}
            onAnswer={onAnswer}
            onBack={() => setStep(1)}
            onFinish={finish}
          />
        )}
      </div>
    </div>
  );
}

function ConceptStep({ onNext }) {
  return (
    <>
      <h1 className="text-heading">{t('training.concept.title')}</h1>
      <p className="mt-3 text-body text-ink/70">{t('training.concept.body1')}</p>
      <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm">
        <IconArray kind="rain" probs={[0.7, 0.2, 0.1]} />
      </div>
      <p className="mt-6 text-body text-ink/70">{t('training.concept.body2')}</p>
      <div className="mt-8 flex justify-end">
        <button className="btn-primary" onClick={onNext}>{t('training.next')}</button>
      </div>
    </>
  );
}

function CountStep({ onBack, onNext }) {
  const [revealed, setRevealed] = useState(false);
  return (
    <>
      <h1 className="text-heading">{t('training.count.title')}</h1>
      <p className="mt-3 text-body text-ink/70">{t('training.count.body')}</p>
      <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm">
        <IconArray kind="rain" probs={[0.5, 0.3, 0.2]} />
      </div>
      {revealed ? (
        <p className="mt-6 rounded-xl bg-action-green/10 p-4 text-body text-ink">{t('training.count.answer')}</p>
      ) : (
        <button className="mt-6 min-h-touch rounded-xl bg-ink/10 px-6 py-3 text-body" onClick={() => setRevealed(true)}>
          {t('training.count.reveal')}
        </button>
      )}
      <div className="mt-8 flex justify-between">
        <button className="min-h-touch rounded-xl border border-ink/15 px-6 py-3 text-body" onClick={onBack}>{t('training.back')}</button>
        <button className="btn-primary" disabled={!revealed} onClick={onNext}>{t('training.next')}</button>
      </div>
    </>
  );
}

function CheckStep({ answers, onAnswer, onBack, onFinish }) {
  const allCorrect = QUESTIONS.every((q) => answers[q.id] === q.correct);
  return (
    <>
      <h1 className="text-heading">{t('training.check.title')}</h1>
      <p className="mt-2 text-body text-ink/60">{t('training.check.body')}</p>
      <div className="mt-6 flex flex-col gap-6">
        {QUESTIONS.map((q) => (
          <QuestionCard key={q.id} q={q} answer={answers[q.id]} onAnswer={(value) => onAnswer(q, value)} />
        ))}
      </div>
      <div className="mt-8 flex justify-between">
        <button className="min-h-touch rounded-xl border border-ink/15 px-6 py-3 text-body" onClick={onBack}>{t('training.back')}</button>
        <button className="btn-primary" disabled={!allCorrect} onClick={onFinish}>
          {t('training.startPractice')}
        </button>
      </div>
    </>
  );
}

function QuestionCard({ q, answer, onAnswer }) {
  const [tried, setTried] = useState(new Set());
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="grid grid-cols-2 gap-6">
        <IconArray kind={q.kind} probs={q.probs} />
        <div>
          <p className="text-body font-semibold">{t(q.promptKey)}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {q.options.map((opt) => {
              const isCorrectAnswer = answer === opt.value;
              const wasWrong = tried.has(opt.value) && opt.value !== q.correct && answer !== q.correct;
              const locked = answer === q.correct;
              return (
                <button
                  key={opt.value}
                  disabled={locked}
                  onClick={() => {
                    setTried((s) => new Set(s).add(opt.value));
                    onAnswer(opt.value);
                  }}
                  className={`min-h-touch rounded-lg px-4 py-2 text-body transition ${
                    isCorrectAnswer
                      ? 'bg-action-green text-white'
                      : wasWrong
                        ? 'bg-drought-deep/20 text-drought-deep line-through'
                        : 'bg-ink/10 text-ink hover:bg-ink/15'
                  }`}
                >
                  {opt.key ? t(opt.key) : opt.value}
                </button>
              );
            })}
          </div>
          {answer === q.correct && (
            <p className="mt-3 text-badge text-action-green">{t('training.check.correct')}</p>
          )}
        </div>
      </div>
    </div>
  );
}
