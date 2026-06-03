import { useEffect, useRef, useState } from 'react';
import { SCREENS, TUTORIAL_VIDEOS } from '../lib/constants.js';
import { useGameStore } from '../store/gameStore.js';
import { logEvent } from '../store/eventLog.js';
import { t, currentLanguage } from '../i18n/index.js';

// Tutorial video shown right after language selection. Plays the clip for the
// chosen language (offline — the mp4s are precached). Forward-only: a Continue
// button leads into the instructions/training. Played/ended/replay events are
// logged for the session record.
export default function TutorialVideo() {
  const transition = useGameStore((s) => s.transition);
  const lang = useGameStore((s) => s.session?.language) || currentLanguage();
  const src = TUTORIAL_VIDEOS[lang] || TUTORIAL_VIDEOS.en;
  const videoRef = useRef(null);
  const [ended, setEnded] = useState(false);

  useEffect(() => {
    logEvent(SCREENS.TUTORIAL_VIDEO, 'screen_enter', { language: lang, src });
  }, [lang, src]);

  const onContinue = () => {
    const v = videoRef.current;
    logEvent(SCREENS.TUTORIAL_VIDEO, 'tutorial_video_continue', {
      language: lang, ended, watched_ms: v ? Math.round(v.currentTime * 1000) : null,
    });
    transition(SCREENS.INSTRUCTIONS);
  };

  const replay = () => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = 0;
    v.play().catch(() => {});
    logEvent(SCREENS.TUTORIAL_VIDEO, 'tutorial_video_replay', { language: lang });
  };

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-5 bg-canvas p-8">
      <h1 className="text-heading">{t('video.title')}</h1>
      <p className="text-body text-ink/60">{t('video.subtitle')}</p>

      <video
        ref={videoRef}
        src={src}
        controls
        playsInline
        controlsList="nodownload"
        className="max-h-[60vh] w-auto max-w-[1000px] rounded-2xl bg-black shadow-card"
        onPlay={() => logEvent(SCREENS.TUTORIAL_VIDEO, 'tutorial_video_play', { language: lang })}
        onEnded={() => { setEnded(true); logEvent(SCREENS.TUTORIAL_VIDEO, 'tutorial_video_ended', { language: lang }); }}
      />

      <div className="flex items-center gap-4">
        <button className="min-h-touch rounded-xl border border-ink/15 px-6 py-3 text-body" onClick={replay}>
          {t('video.replay')}
        </button>
        <button className="btn-primary" onClick={onContinue}>{t('video.continue')}</button>
      </div>
    </div>
  );
}
