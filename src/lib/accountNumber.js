/**
 * Generates a unique 10-digit Nigerian-style account number.
 * Format: 10 digits starting with '9' (mimics Kuda / Opay style)
 */
export function generateAccountNumber() {
  const digits = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10)).join('');
  return `9${digits}`;
}
