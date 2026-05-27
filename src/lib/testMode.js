export function isClientTestMode() {
  return import.meta.env.MODE === 'test' || import.meta.env.VITE_TEST_MODE === 'true';
}
