import { getRecommendedRooms, getRecommendedUsers } from '@/services/recommendationService';

describe('Recommendation service', () => {
  it('should return recommendation arrays for a valid user', async () => {
    const rooms = await getRecommendedRooms('000000000000000000000000');
    const users = await getRecommendedUsers('000000000000000000000000');

    expect(Array.isArray(rooms)).toBe(true);
    expect(Array.isArray(users)).toBe(true);
  });
});
