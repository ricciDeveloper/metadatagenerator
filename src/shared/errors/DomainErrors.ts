export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class AllApiKeysUnavailableError extends DomainError {
  constructor(message = 'All provided Gemini API Keys are currently disabled or in cooldown.') {
    super(message);
  }
}

export class InvalidUrlError extends DomainError {
  constructor(url: string, reason?: string) {
    super(`Invalid URL "${url}"${reason ? `: ${reason}` : ''}`);
  }
}

export class SSRFError extends DomainError {
  constructor(target: string) {
    super(`Security Violation: Access to restricted network target "${target}" is blocked.`);
  }
}

