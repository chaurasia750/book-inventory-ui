// Wired to the `staging` build configuration in project.json. Value lives
// in @org/constants (STAGING_ENVIRONMENT) — change it there, not here, so
// all three apps stay in sync.
export { STAGING_ENVIRONMENT as environment } from '@org/constants';
