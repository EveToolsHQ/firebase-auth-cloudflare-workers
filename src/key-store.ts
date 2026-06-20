export interface KeyStorer {
  get<ExpectedValue = unknown>(): Promise<ExpectedValue | null>;
  put(value: string, expirationTtl: number): Promise<void>;
  scoped?(scope: string): KeyStorer;
}

export function scopedKeyStorer(keyStorer: KeyStorer, scope: string): KeyStorer {
  if (typeof keyStorer.scoped === 'function') {
    return keyStorer.scoped(scope);
  }
  return keyStorer;
}

/**
 * Class to get or store fetched public keys from a client certificates URL.
 */
export class WorkersKVStore implements KeyStorer {
  constructor(
    protected readonly cacheKey: string,
    protected readonly cfKVNamespace: KVNamespace
  ) {}

  /**
   * Returns a view of this store that caches public keys under a derived KV key.
   */
  public scoped(scope: string): WorkersKVStore {
    return new WorkersKVStore(`${this.cacheKey}:${scope}`, this.cfKVNamespace);
  }

  public async get<ExpectedValue = unknown>(): Promise<ExpectedValue | null> {
    return await this.cfKVNamespace.get<ExpectedValue>(this.cacheKey, 'json');
  }

  public async put(value: string, expirationTtl: number): Promise<void> {
    await this.cfKVNamespace.put(this.cacheKey, value, {
      expirationTtl,
    });
  }
}
