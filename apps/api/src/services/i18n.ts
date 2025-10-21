// Minimal i18n template stub for renewalReminder
export function getI18nTemplate(key: string, lang: string, vars: Record<string, any>) {
  // Just return a string for now
  return `${key} (${lang}): ${JSON.stringify(vars)}`;
}
