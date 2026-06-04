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
    const vv = window.visualViewport;
    const fit = () => {
      // visualViewport reports the true post-rotation size; innerWidth/Height
      // can be stale right after an orientationchange.
      const w = (vv && vv.width) || window.innerWidth;
      const h = (vv && vv.height) || window.innerHeight;
      const s = Math.min(w / 1280, h / 800);
      document.documentElement.style.setProperty('--app-scale', String(s));
    };
    // On rotation the dimensions settle a moment after the event fires, so
    // recompute a few times.
    const refit = () => { fit(); setTimeout(fit, 150); setTimeout(fit, 400); setTimeout(fit, 800); };
    refit();
    window.addEventListener('resize', fit);
    window.addEventListener('orientationchange', refit);
    if (vv) vv.addEventListener('resize', fit);
    return () => {
      window.removeEventListener('resize', fit);
      window.removeEventListener('orientationchange', refit);
      if (vv) vv.removeEventListener('resize', fit);
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
