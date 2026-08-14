import { AllApiKeysUnavailableError } from '../../shared/errors/DomainErrors';

export type KeyState = 'active' | 'cooldown' | 'disabled';

interface KeyInfo {
  key: string;
  state: KeyState;
  cooldownUntil?: number;
}

export class AIKeyManager {
  private keys: KeyInfo[];

  constructor(apiKeys: string[]) {
    const sanitizedKeys = apiKeys
      .map(k => k.trim())
      .filter(Boolean);

    if (sanitizedKeys.length === 0) {
      throw new AllApiKeysUnavailableError('No API keys were provided for AIKeyManager.');
    }

    this.keys = sanitizedKeys.map(key => ({
      key,
      state: 'active'
    }));
  }

  getActiveKey(): string {
    const now = Date.now();

    for (const keyInfo of this.keys) {
      if (keyInfo.state === 'cooldown' && keyInfo.cooldownUntil && now >= keyInfo.cooldownUntil) {
        keyInfo.state = 'active';
        keyInfo.cooldownUntil = undefined;
      }

      if (keyInfo.state === 'active') {
        return keyInfo.key;
      }
    }

    throw new AllApiKeysUnavailableError();
  }

  recordError(key: string, statusCode?: number, cooldownMs = 60000): void {
    const keyInfo = this.keys.find(k => k.key === key);
    if (!keyInfo) return;

    if (statusCode === 401 || statusCode === 403) {
      keyInfo.state = 'disabled';
    } else if (statusCode === 429) {
      keyInfo.state = 'cooldown';
      keyInfo.cooldownUntil = Date.now() + cooldownMs;
    } else {
      // For temporary 5xx or network timeout, trigger short 15s cooldown
      keyInfo.state = 'cooldown';
      keyInfo.cooldownUntil = Date.now() + 15000;
    }
  }

  getKeyStatus(key: string): KeyState | undefined {
    const keyInfo = this.keys.find(k => k.key === key);
    return keyInfo?.state;
  }
}
