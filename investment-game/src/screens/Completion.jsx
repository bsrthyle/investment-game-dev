import { useEffect } from 'react';
import { SCREENS } from '../lib/constants.js';
import { useGameStore } from '../store/gameStore.js';
import { useRecordingStore } from '../store/recordingStore.js';
import { logEvent } from '../store/eventLog.js';
import { t } from '../i18n/index.js';
import { CoinIcon } from '../components/Icons.jsx';

export default function Completion() {
  const updateSession = useGameStore((s) => s.updateSession);
  const total = useGameStore((s) => s.session?.totalRevenueTokens ?? 0);
  const startNextParticipant = useGameStore((s) => s.startNextParticipant);
  const stopRecording = useRecordingStore((s) => s.stop);

  useEffect(() => {
    logEvent(SCREENS.COMPLETION, 'session_complete', {});
    updateSession({ sessionEndTime: new Date().toISOString() });
    stopRecording();
  }, []);

  const onNext = () => {
    logEvent(SCREENS.COMPLETION, 'next_participant', {});
    // Safe hand-off: keeps this finished session on the device (for syncing)
    // and jumps straight to setup for the next participant — no data wiped.
    startNextParticipant();
  };

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-6 bg-gradient-to-b from-lush-green/20 to-canvas">
      <div className="flex items-center gap-4">
        <CoinIcon size={80} />
        <span className="text-token-xl text-action-green">{total}</span>
      </div>
      <h1 className="text-token-xl text-action-green">{t('completion.title')}</h1>
      <p className="max-w-lg text-center text-body text-ink/70">{t('completion.body')}</p>
      <button className="btn-primary mt-2" onClick={onNext}>{t('completion.nextParticipant')}</button>
    </div>
  );
}
