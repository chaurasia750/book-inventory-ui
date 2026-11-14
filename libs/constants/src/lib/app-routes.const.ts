import { APP_URLS } from './app.const';

export const PUBLIC_ROUTES = {
  HOME: '',
  ABOUT: 'about',
  CONTACT: 'contact',
  SERVICES: 'services',
  FEATURES: 'features',
  PRICING: 'pricing',
  FAQ: 'faq',
  PRIVACY: 'privacy',
  TERMS: 'terms',
  BLOG: 'blog',
  BLOG_DETAIL: 'blog/:slug',
  CAREERS: 'careers',
  FRANCHISE: 'franchise',
  WELCOME: 'welcome',
  NOT_FOUND: '404',
} as const;

// Derive route prefix from APP_URLS.ADMIN — change in app.const.ts only
const _a = APP_URLS.ADMIN.slice(1); // '/admin' → 'admin'

export const ADMIN_ROUTES = {
  DASHBOARD: `${_a}/dashboard`,
  USERS: `${_a}/users`,
  ROLES: `${_a}/roles`,
  SETTINGS: `${_a}/settings`,
  PROFILE: `${_a}/profile`,
  NOTIFICATIONS: `${_a}/notifications`,
  AUDIT_LOGS: `${_a}/audit-logs`,
  ACTIVITY_LOGS: `${_a}/activity-logs`,
} as const;

// Derive route prefix from APP_URLS.MEMBER — change in app.const.ts only
const _m = APP_URLS.MEMBER.slice(1); // '/member' → 'member'

export const MEMBER_ROUTES = {
  DASHBOARD: `${_m}/dashboard`,
  CHANGE_PASSWORD: `${_m}/change-password`,
} as const;

export const AUTH_ROUTES = {
  LOGIN: 'auth/login',
  LOGOUT: 'auth/logout',
  FORGOT_PASSWORD: 'auth/forgot-password',
  RESET_PASSWORD: 'auth/reset-password',
} as const;
