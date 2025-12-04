export const sanitizeTranscription = (input: string): string => {
  const withoutTags = input.replace(/<[^>]*>/g, '');
  const filtered = withoutTags
    .split('')
    .filter((ch) => /[\p{Script=Latin}\p{N}\p{P}\p{Z}]/u.test(ch))
    .join('');
  return filtered.replace(/\s{2,}/g, ' ').trim();
};
