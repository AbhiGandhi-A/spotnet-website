// Environment validation utility
export function validateEnv(requiredVars: string[]) {
  const missing = requiredVars.filter((v) => !process.env[v]);
  if (missing.length) {
    throw new Error(`Missing environment variables: ${missing.join(', ')}`);
  }
}
