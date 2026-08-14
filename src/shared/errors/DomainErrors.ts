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

export class ProjectNotFoundError extends DomainError {
  constructor(id: string) {
    super(`Project with ID "${id}" was not found.`);
  }
}

export class JobNotFoundError extends DomainError {
  constructor(id: string) {
    super(`Job with ID "${id}" was not found.`);
  }
}

export class JobLimitExceededError extends DomainError {
  constructor(limit = 200) {
    super(`Job exceeds the maximum allowed limit of ${limit} URLs.`);
  }
}
