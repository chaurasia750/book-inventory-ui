import { APP_URLS } from './app.const';

export const PUBLIC_ROUTES = {
  HOME: '',
  ABOUT: 'about',
  CONTACT: 'contact',
  VIDEOS: 'videos',
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
  SIGNUP: 'signup',
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
  REPORTS: `${_a}/reports`,
  ACTIVITY_LOGS: `${_a}/activity-logs`,
  TREE_GENEALOGY: `${_a}/tree/genealogy`,
  TREE_MATCHING: `${_a}/tree/matching`,
  TREE_MATRIX: `${_a}/tree/matrix`,
  LEADS_DASHBOARD: `${_a}/leads/dashboard`,
  LEADS_LIST: `${_a}/leads/list`,
  LEADS_ADD: `${_a}/leads/add`,
  LEADS_DETAIL: `${_a}/leads/detail/:id`,
  LEADS_EDIT: `${_a}/leads/edit/:id`,
  LEADS_CLOSING: `${_a}/leads/closing`,
  INVENTORY_LIST: `${_a}/inventory/list`,
  INVENTORY_ADD: `${_a}/inventory/add`,
  INVENTORY_DETAIL: `${_a}/inventory/detail/:id`,
  INVENTORY_EDIT: `${_a}/inventory/edit/:id`,
  ORDERS: `${_a}/orders`,
  ORDER_DETAIL: `${_a}/orders/detail/:id`,
  MEMBER_DETAIL: `${_a}/members/:memberId/details`,
  MEMBER_PROFILE: `${_a}/members/profile/:memberId`,
  VIDEO_MASTER: `${_a}/video-master`,
} as const;

// Derive route prefix from APP_URLS.MEMBER — change in app.const.ts only
const _m = APP_URLS.MEMBER.slice(1); // '/member' → 'member'

export const MEMBER_ROUTES = {
  DASHBOARD: `${_m}/dashboard`,
  VIEW_PROFILE: `${_m}/view-profile`,
  EDIT_PROFILE: `${_m}/edit-profile`,
  WELCOME_LETTER: `${_m}/welcome-letter`,
  MEMBERS_LIST: `${_m}/members/list`,
  SPONSOR_NEW: `${_m}/sponsor-new`,
  NEW_ORDER: `${_m}/course/new`,
  ORDER_LIST: `${_m}/course/list`,
  ORDER_DETAIL: `${_m}/course/detail/:id`,
  GENEALOGY: `${_m}/genealogy`,
  REFERRAL_LINK: `${_m}/referral-link`,
  CHANGE_PASSWORD: `${_m}/change-password`,
} as const;

export const AUTH_ROUTES = {
  LOGIN: 'auth/login',
  LOGOUT: 'auth/logout',
  FORGOT_PASSWORD: 'auth/forgot-password',
  RESET_PASSWORD: 'auth/reset-password',
} as const;
