import { useEffect } from 'react';
import { useGameStore } from './store/gameStore.js';
import { SCREENS } from './lib/constants.js';
import { ErrorBoundary } from './components/ErrorBoundary.jsx';
import StatusBar from './components/StatusBar.jsx';
import DevResetButton from './components/DevResetButton.jsx';
import AdminPanel from './admin/AdminPanel.jsx';

import Welcome from './screens/Welcome.jsx';
import LanguageSelect from './screens/LanguageSelect.jsx';
import TutorialVideo from './screens/TutorialVideo.jsx';
import EnumeratorSetup from './screens/EnumeratorSetup.jsx';
import Instructions from './screens/Instructions.jsx';
import Training from './screens/Training.jsx';
import Practice from './screens/Practice.jsx';
import Round from './screens/Round.jsx';
import FinalPayout from './screens/FinalPayout.jsx';
import Survey from './screens/Survey.jsx';
import Completion from './screens/Completion.jsx';

const MAP = {
  [SCREENS.WELCOME]: Welcome,
  [SCREENS.LANGUAGE_SELECT]: LanguageSelect,
  [SCREENS.TUTORIAL_VIDEO]: TutorialVideo,
  [SCREENS.ENUMERATOR_SETUP]: EnumeratorSetup,
  [SCREENS.INSTRUCTIONS]: Instructions,
  [SCREENS.TRAINING]: Training,
  [SCREENS.PRACTICE]: Practice,
  [SCREENS.ROUND]: Round,
  [SCREENS.FINAL_PAYOUT]: FinalPayout,
  [SCREENS.SURVEY]: Survey,
  [SCREENS.COMPLETION]: Completion,
};

export default function App() {
  const currentScreen = useGameStore((s) => s.currentScreen);
  const hydrate = useGameStore((s) => s.hydrate);

  useEffect(() => { hydrate(); }, [hydrate]);

  // Scale the fixed 1280x800 design to fit the actual screen (e.g. 7" tablets),
  // letterboxed, so nothing is ever cut off or unreachable.
  useEffect(() => {
    // Use the layout viewport (innerWidth/innerHeight), NOT visualViewport: the
    // soft keyboard shrinks the *visual* viewport, and reacting to that made the
    // whole UI shrink/disappear. With interactive-widget=overlays-content the
    // layout viewport stays put when the keyboard opens.
    let lastW = 0;
    const fit = () => {
      const w = window.innerWidth, h = window.innerHeight;
      // Fit the whole 1280x800 design inside the viewport (no scroll, no clip).
      const s = Math.min(w / 1280, h / 800);
      document.documentElement.style.setProperty('--app-scale', String(s));
      lastW = w;
    };
    // Recompute on rotation (dims settle a moment later, so re-run a few times).
    const refit = () => { fit(); setTimeout(fit, 150); setTimeout(fit, 400); setTimeout(fit, 800); };
    // On plain resize, only recompute if the WIDTH changed — ignores keyboard
    // and browser-chrome height changes, which would otherwise rescale the UI.
    const onResize = () => { if (Math.abs(window.innerWidth - lastW) > 1) fit(); };
    refit();
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', refit);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', refit);
    };
  }, []);

  const Screen = MAP[currentScreen] || Welcome;
  return (
    <ErrorBoundary>
      <div className="app-fit">
        <div className="app-canvas relative">
          <Screen />
          <StatusBar />
          <DevResetButton />
          <AdminPanel />
        </div>
      </div>
    </ErrorBoundary>
  );
}
