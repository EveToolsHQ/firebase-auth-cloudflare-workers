import { Miniflare } from 'miniflare';
import { describe, expect, it } from 'vitest';
import { WorkersKVStoreSingle } from '../src/index';
import { WorkersKVStore } from '../src/key-store';

const nullScript = 'export default { fetch: () => new Response(null, { status: 404 }) };';
const mf = new Miniflare({
  modules: true,
  script: nullScript,
  kvNamespaces: ['TEST_NAMESPACE'],
});

describe('WorkersKVStore.scoped', () => {
  it('suffixes the KV key with the scope', async () => {
    const TEST_NAMESPACE = await mf.getKVNamespace('TEST_NAMESPACE');
    const baseKey = 'scoped-cache-key';
    const keyStore = new WorkersKVStore(baseKey, TEST_NAMESPACE);

    const idTokenStore = keyStore.scoped('id-token');
    const sessionCookieStore = keyStore.scoped('session-cookie');

    await idTokenStore.put(JSON.stringify([{ kid: 'id-kid' }]), 3600);
    await sessionCookieStore.put(JSON.stringify([{ kid: 'session-kid' }]), 3600);

    expect(await TEST_NAMESPACE.get(`${baseKey}:id-token`, 'json')).toEqual([{ kid: 'id-kid' }]);
    expect(await TEST_NAMESPACE.get(`${baseKey}:session-cookie`, 'json')).toEqual([{ kid: 'session-kid' }]);
    expect(await TEST_NAMESPACE.get(baseKey)).toBeNull();
  });
});

describe('WorkersKVStoreSingle.scoped', () => {
  it('returns a singleton per scoped cache key', async () => {
    const TEST_NAMESPACE = await mf.getKVNamespace('TEST_NAMESPACE');
    const keyStore = WorkersKVStoreSingle.getOrInitialize('base-key', TEST_NAMESPACE);

    const idTokenStore = keyStore.scoped('id-token');
    const idTokenStoreAgain = keyStore.scoped('id-token');
    const sessionCookieStore = keyStore.scoped('session-cookie');

    expect(idTokenStore).toBe(idTokenStoreAgain);
    expect(sessionCookieStore).not.toBe(idTokenStore);
  });
});
