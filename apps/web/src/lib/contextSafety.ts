export const MAX_PROJECTS = 12;
export const MAX_CONTEXT_TEXT = 240;
export const MAX_QUESTION_TEXT = 2_000;
export const MAX_REPLY_TEXT = 32_000;

export function boundedText(value: unknown, limit = MAX_CONTEXT_TEXT) {
  return String(value ?? '')
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, limit);
}

export function boundedNumber(value: unknown, min: number, max: number) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : min;
}

export function normalizeProject(value: any) {
  return {
    name: boundedText(value?.name, 100),
    stage: boundedText(value?.stage, 24),
    lastPushDays: boundedNumber(value?.lastPushDays, 0, 10_000),
    language: boundedText(value?.language, 40),
    prog: boundedNumber(value?.prog, 0, 1),
    url: typeof value?.url === 'string' && /^https:\/\/github\.com\//.test(value.url)
      ? value.url.slice(0, 500)
      : '',
    lastCommit: { msg: boundedText(value?.lastCommit?.msg) },
  };
}
