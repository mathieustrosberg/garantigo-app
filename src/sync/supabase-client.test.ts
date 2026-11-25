import { createCloudClient } from './supabase-client';

describe('createCloudClient', () => {
  it('returns nothing when the address is missing', () => {
    expect(createCloudClient(undefined, 'publishable-key')).toBeNull();
  });

  it('returns nothing when the key is missing', () => {
    expect(createCloudClient('https://example.supabase.co', undefined)).toBeNull();
    expect(createCloudClient('https://example.supabase.co', '')).toBeNull();
  });

  it('creates a connection when the address and the key are given', async () => {
    const client = createCloudClient('https://example.supabase.co', 'publishable-key');

    expect(client).not.toBeNull();
    // Stops the background refresh of the session, so the test ends cleanly.
    await client?.auth.stopAutoRefresh();
  });
});
