// Fallback for platforms not covered by index.native.tsx or index.web.tsx
// In practice this file is never loaded — native uses index.native.tsx, web uses index.web.tsx
export { default } from './index.native';
