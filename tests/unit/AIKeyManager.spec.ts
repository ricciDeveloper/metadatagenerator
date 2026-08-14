import { describe, it, expect } from 'vitest';
import { AIKeyManager } from '../../src/domain/services/AIKeyManager';
import { AllApiKeysUnavailableError } from '../../src/shared/errors/DomainErrors';

describe('AIKeyManager', () => {
  it('should initialize with provided keys and return the first available key', () => {
    const manager = new AIKeyManager(['key-1', 'key-2', 'key-3']);
    expect(manager.getActiveKey()).toBe('key-1');
  });

  it('should throw AllApiKeysUnavailableError if initialized with no keys', () => {
    expect(() => new AIKeyManager([])).toThrow(AllApiKeysUnavailableError);
  });

  it('should put key in cooldown on 429 error and return next active key', () => {
    const manager = new AIKeyManager(['key-1', 'key-2']);
    expect(manager.getActiveKey()).toBe('key-1');

    manager.recordError('key-1', 429, 60000); // 60s cooldown

    expect(manager.getActiveKey()).toBe('key-2');
  });

  it('should permanently disable key on 401 or 403 authorization errors', () => {
    const manager = new AIKeyManager(['key-1', 'key-2']);
    manager.recordError('key-1', 401);

    expect(manager.getActiveKey()).toBe('key-2');
    expect(manager.getKeyStatus('key-1')).toBe('disabled');
  });

  it('should throw AllApiKeysUnavailableError when all keys are in cooldown or disabled', () => {
    const manager = new AIKeyManager(['key-1', 'key-2']);
    manager.recordError('key-1', 429, 60000);
    manager.recordError('key-2', 403);

    expect(() => manager.getActiveKey()).toThrow(AllApiKeysUnavailableError);
  });
});
