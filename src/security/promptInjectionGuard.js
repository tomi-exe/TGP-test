const suspiciousPatterns = [
  'ignora instrucciones',
  'olvida instrucciones',
  'no sigas instrucciones',
  'actua como',
  'system prompt',
  'developer message',
  'override previous',
  'ignore previous instructions',
  'disregard previous instructions',
];

function normalizeForCheck(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export function hasSuspiciousPromptInjectionPattern(value) {
  if (typeof value !== 'string') {
    return false;
  }

  const normalizedValue = normalizeForCheck(value);
  return suspiciousPatterns.some((pattern) => normalizedValue.includes(pattern));
}
