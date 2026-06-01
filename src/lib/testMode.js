export function isClientTestMode() {
  return process.env.NODE_ENV === 'test' || process.env.NEXT_PUBLIC_TEST_MODE === 'true';
}
