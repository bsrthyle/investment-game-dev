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

  const Screen = MAP[currentScreen] || Welcome;
  return (
    <ErrorBoundary>
      <div className="relative h-full w-full">
        <Screen />
        <StatusBar />
        <DevResetButton />
        <AdminPanel />
      </div>
    </ErrorBoundary>
  );
}
