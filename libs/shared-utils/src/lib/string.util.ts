export function truncate(text: string, length: number): string {
  if (!text || text.length <= length) {
    return text;
  }
  return `${text.slice(0, Math.max(0, length))}...`;
}

export function capitalize(text: string): string {
  if (!text) {
    return text;
  }
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Route constants like ADMIN_ROUTES/MEMBER_ROUTES store full segments
 * (e.g. 'admin/dashboard') for readability, but the 'admin'/'member' prefix
 * is already supplied by that app's <base href> at build/deploy time
 * (--base-href=/admin/ or /member/). Use this to get the in-app-relative
 * path ('dashboard') for routerLink/router navigation within that app —
 * otherwise the prefix doubles up in the browser URL (/admin/admin/...).
 */
export function stripAppRoutePrefix(path: string): string {
  return path.split('/').slice(1).join('/');
}

const DIACRITICS_REGEX = /[̀-ͯ]/g;

export function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function slugify(text: string): string {
  return text
    .toString()
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(DIACRITICS_REGEX, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
