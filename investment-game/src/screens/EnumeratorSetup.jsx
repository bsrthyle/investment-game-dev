import { useEffect, useState } from 'react';
import { SCREENS, DEFAULT_CURRENCY_RATES } from '../lib/constants.js';
import { useGameStore } from '../store/gameStore.js';
import { db, getConfig, setConfig } from '../lib/db.js';
import { t } from '../i18n/index.js';
import InfoPopover from '../components/InfoPopover.jsx';

const TREATMENT_GROUPS = ['Control', 'T1', 'T2', 'T3'];

export default function EnumeratorSetup() {
  const newSession = useGameStore((s) => s.newSession);
  const transition = useGameStore((s) => s.transition);

  const [form, setForm] = useState({
    participantId: '',
    enumeratorId: '',
    country: 'NG',
    partner: '',
    treatmentGroup: '',
    currencyRate: DEFAULT_CURRENCY_RATES.NG,
    audioRecordingEnabled: false,
  });
  const [lookup, setLookup] = useState(null);

  useEffect(() => {
    (async () => {
      const lastEnumeratorId = await getConfig('last_enumerator_id', '');
      if (lastEnumeratorId) setForm((f) => ({ ...f, enumeratorId: lastEnumeratorId }));
    })();
  }, []);

  const update = (k, v) => {
    setForm((f) => {
      const next = { ...f, [k]: v };
      if (k === 'country') next.currencyRate = DEFAULT_CURRENCY_RATES[v] ?? f.currencyRate;
      return next;
    });
  };

  const lookupParticipant = async () => {
    const id = form.participantId.trim();
    if (!id) { setLookup(null); return; }
    const row = await db.participants.get(id);
    if (!row) { setLookup({ found: false }); return; }
    setLookup({ found: true });
    setForm((f) => ({
      ...f,
      treatmentGroup: row.treatmentGroup || f.treatmentGroup,
      country: row.country || f.country,
      partner: row.partner || f.partner,
      currencyRate: row.country && DEFAULT_CURRENCY_RATES[row.country] ? DEFAULT_CURRENCY_RATES[row.country] : f.currencyRate,
    }));
  };

  const start = async () => {
    if (!form.participantId || !form.enumeratorId) return;
    await setConfig('last_enumerator_id', form.enumeratorId);
    await newSession({ ...form });
    transition(SCREENS.LANGUAGE_SELECT);
  };

  const Field = ({ label, info, children }) => (
    <label className="flex flex-col gap-1 text-body">
      <span className="flex items-center gap-2 text-badge uppercase tracking-wide text-ink/60">
        <span>{label}</span>
        {info && <InfoPopover title={label}>{info}</InfoPopover>}
      </span>
      {children}
    </label>
  );

  const inputClass = 'min-h-touch rounded-lg border border-ink/15 bg-white px-4 py-3 text-body focus:border-action-green focus:outline-none';

  return (
    <div className="flex h-full w-full items-center justify-center bg-canvas px-10">
      <div className="card w-[760px] p-10 animate-fade-up">
        <p className="text-badge uppercase tracking-[0.2em] text-ink/50">Enumerator only</p>
        <h1 className="mt-1 text-heading tracking-tight">{t('enumerator.title')}</h1>

        <div className="mt-8 grid grid-cols-2 gap-5">
          <Field
            label={t('enumerator.participantId')}
            info={
              <>
                Unique ID for this participant. It deterministically seeds the per-round{' '}
                <strong>rain &amp; price draws</strong> — re-entering the same ID always reproduces the
                same outcomes, so any session can be independently verified. If a participant list (CSV)
                was imported via the admin panel, this ID also auto-fills Country, Partner, and the
                Treatment group.
              </>
            }
          >
            <input
              className={inputClass}
              value={form.participantId}
              onChange={(e) => { update('participantId', e.target.value.trim()); setLookup(null); }}
              onBlur={lookupParticipant}
            />
            {lookup?.found && <span className="chip chip-ok mt-1 w-fit">Auto-filled from participant list</span>}
            {lookup && !lookup.found && form.participantId && (
              <span className="chip chip-warn mt-1 w-fit">Not in imported list — fill manually</span>
            )}
          </Field>
          <Field
            label={t('enumerator.enumeratorId')}
            info={
              <>
                ID of the field staff member running this session. Stamped on every logged event so we
                can audit who ran which sessions. Pre-fills from the last session on this device.
              </>
            }
          >
            <input className={inputClass} value={form.enumeratorId}
              onChange={(e) => update('enumeratorId', e.target.value.trim())} />
          </Field>

          <Field
            label={t('enumerator.country')}
            info={
              <>
                Participant's country. Determines the default token-to-currency rate and the set of
                available languages. This fork is locked to Nigeria.
              </>
            }
          >
            <div className="inline-flex rounded-lg bg-ink/5 p-1">
              <button type="button" className="min-h-touch rounded-md px-5 py-2 text-body bg-white shadow-soft font-semibold">
                Nigeria
              </button>
            </div>
          </Field>
          <Field
            label={t('enumerator.partner')}
            info={
              <>
                Partner organization conducting the fieldwork on the ground (e.g. OAF, Solidaridad).
                Free-text metadata — not used by game logic, only by analysis.
              </>
            }
          >
            <input className={inputClass} value={form.partner}
              onChange={(e) => update('partner', e.target.value)} placeholder="Partner organization" />
          </Field>

          <Field
            label="Treatment group (main study)"
            info={
              <>
                This participant's arm in the <strong>parent impact evaluation</strong> run by IFPRI
                and partner organizations — not this game's own randomization. Recorded as metadata
                so the game results can be linked back to the main study.
                <ul className="mt-2 list-disc space-y-1 pl-4">
                  <li>
                    <strong>Control</strong> — main-study control group; receives no goods/services
                    intervention from the partner.
                  </li>
                  <li>
                    <strong>T1</strong> — main-study treatment arm 1.
                  </li>
                  <li>
                    <strong>T2</strong> — main-study treatment arm 2.
                  </li>
                  <li>
                    <strong>T3</strong> — main-study treatment arm 3.
                  </li>
                </ul>
                <p className="mt-2">
                  The substantive definition of T1 / T2 / T3 (what each treatment actually delivers)
                  is owned by the main-study team and lives in their protocol, not in this app.
                  Recruitment draws equal numbers from Control / T1 / T2 / T3. In earlier protocol
                  versions these were labelled <code>B1 / B2 / B3</code>.
                </p>
                <p className="mt-2">
                  Auto-fills from the imported participant CSV when Participant ID matches; otherwise
                  set manually from the partner's roster.
                </p>
                <p className="mt-2">
                  In v2 this game has no separate in-game arm: whether a participant plays the game at
                  all is itself the treatment, assigned by the parent study and recorded here.
                </p>
              </>
            }
          >
            <div className="inline-flex flex-wrap rounded-lg bg-ink/5 p-1">
              {TREATMENT_GROUPS.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => update('treatmentGroup', g)}
                  className={`min-h-touch rounded-md px-4 py-2 text-body transition ${
                    form.treatmentGroup === g ? 'bg-white shadow-soft font-semibold' : 'text-ink/70'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </Field>

          <Field
            label={t('enumerator.currencyRate')}
            info={
              <>
                Conversion rate used on the final-payout screen: <em>local currency per game token</em>
                {' '}(e.g. <code>10</code> means 10 NGN per token). Pre-filled from the country default;
                the enumerator can override per session if needed.
              </>
            }
          >
            <input type="number" min={0} className={inputClass}
              value={form.currencyRate}
              onChange={(e) => update('currencyRate', Number(e.target.value))} />
          </Field>

          <div className="col-span-2">
            <label className="flex items-center gap-3 rounded-lg bg-ink/5 px-4 py-3 text-body">
              <input type="checkbox" className="h-5 w-5" checked={form.audioRecordingEnabled}
                onChange={(e) => update('audioRecordingEnabled', e.target.checked)} />
              <span className="flex items-center gap-2">
                {t('enumerator.recording')}
                <InfoPopover title="Audio recording">
                  Captures background audio during the session for later conversation analysis. Off by
                  default. <strong>Only enable after obtaining verbal consent</strong> from the
                  participant. Audio is stored locally on the tablet (IndexedDB) and synced to the
                  server with the rest of the session data.
                </InfoPopover>
              </span>
            </label>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-between">
          <span className="flex items-center gap-2 text-badge text-ink/50">
            <span>Every participant plays the same 10-season game.</span>
            <InfoPopover title="This game (v2)">
              v2 removed the in-game display/training arm. Whether a farmer plays the game at all is the
              treatment, and that is assigned <strong>outside</strong> the app (the parent impact
              evaluation — recorded here as the Treatment group). Everyone who plays sees the same
              thing: rain &amp; price uncertainty shown as a full <em>icon-array distribution</em>, plus
              a short probability-comprehension training before the practice season. The aim is to build
              familiarity with the rainfall- and price-driven uncertainty farmers face.
            </InfoPopover>
          </span>
          <button
            className="btn-primary"
            disabled={!form.participantId || !form.enumeratorId}
            onClick={start}
          >
            {t('enumerator.start')}
          </button>
        </div>
      </div>
    </div>
  );
}
