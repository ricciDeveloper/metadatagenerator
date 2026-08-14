import { describe, it, expect } from 'vitest';
import { SSRFGuard } from '../../src/domain/services/SSRFGuard';
import { SSRFError, InvalidUrlError } from '../../src/shared/errors/DomainErrors';

describe('SSRFGuard', () => {
  const guard = new SSRFGuard();

  it('should allow valid public HTTP/HTTPS URLs', () => {
    expect(() => guard.validateUrl('https://example.com/pagina')).not.toThrow();
    expect(() => guard.validateUrl('http://google.com')).not.toThrow();
  });

  it('should throw InvalidUrlError for malformed URLs or non-HTTP protocols', () => {
    expect(() => guard.validateUrl('not-a-url')).toThrow(InvalidUrlError);
    expect(() => guard.validateUrl('ftp://example.com/file.txt')).toThrow(InvalidUrlError);
    expect(() => guard.validateUrl('file:///etc/passwd')).toThrow(InvalidUrlError);
  });

  it('should block localhost and loopback addresses', () => {
    expect(() => guard.validateUrl('http://localhost')).toThrow(SSRFError);
    expect(() => guard.validateUrl('http://127.0.0.1')).toThrow(SSRFError);
    expect(() => guard.validateUrl('http://127.0.0.1:8080/admin')).toThrow(SSRFError);
    expect(() => guard.validateUrl('http://[::1]')).toThrow(SSRFError);
    expect(() => guard.validateUrl('http://0.0.0.0')).toThrow(SSRFError);
  });

  it('should block private network IP ranges (10.x, 172.16.x, 192.168.x, 169.254.x)', () => {
    expect(() => guard.validateUrl('http://10.0.0.1')).toThrow(SSRFError);
    expect(() => guard.validateUrl('http://172.16.0.5')).toThrow(SSRFError);
    expect(() => guard.validateUrl('http://192.168.1.254')).toThrow(SSRFError);
    expect(() => guard.validateUrl('http://169.254.169.254/latest/meta-data')).toThrow(SSRFError);
  });
});
