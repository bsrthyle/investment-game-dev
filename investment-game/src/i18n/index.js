import en from './en.json';
import ha from './ha.json';

const bundles = { en, ha };

let current = 'en';

export function setLanguage(lang) {
  current = bundles[lang] ? lang : 'en';
}

export function currentLanguage() {
  return current;
}

// Transparent fallback: current → en → key itself. A key missing a translation
// in the current language renders in English rather than crashing the UI.
// Hausa translations are placeholders until a native speaker reviews them;
// anything left in English can be swapped in incrementally.
export function t(key, vars = {}) {
  const bundle = bundles[current] || bundles.en;
  let str = bundle[key] ?? bundles.en[key] ?? key;
  for (const [k, v] of Object.entries(vars)) {
    str = str.replaceAll(`{${k}}`, String(v));
  }
  return str;
}

export function availableLanguages() {
  return Object.keys(bundles);
}
