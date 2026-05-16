import { recordFailedLoginAttempt, isIpBlocked } from '@/lib/security';

describe('Security utilities', () => {
  it('should increment failed login attempts and eventually block an IP', async () => {
    const ip = `127.0.0.1`;
    for (let i = 0; i < 13; i += 1) {
      await recordFailedLoginAttempt(ip, '000000000000000000000000');
    }
    const blocked = await isIpBlocked(ip);
    expect(blocked).toBe(true);
  });
});
