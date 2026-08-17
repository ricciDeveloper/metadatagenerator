import ipaddr from 'ipaddr.js';
import { SSRFError, InvalidUrlError } from '../../shared/errors/DomainErrors.ts';

export class SSRFGuard {
  validateUrl(urlInput: string): string {
    if (!urlInput || typeof urlInput !== 'string') {
      throw new InvalidUrlError(urlInput, 'URL string is required');
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(urlInput.trim());
    } catch {
      throw new InvalidUrlError(urlInput, 'Malformed URL');
    }

    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      throw new InvalidUrlError(urlInput, 'Only HTTP and HTTPS protocols are allowed');
    }

    const hostname = parsedUrl.hostname.toLowerCase();

    const cleanHostname = hostname.replace(/^\[|\]$/g, '');

    if (cleanHostname === 'localhost' || cleanHostname.endsWith('.local') || cleanHostname === '0.0.0.0') {
      throw new SSRFError(cleanHostname);
    }

    // Check if hostname is an IP address
    if (ipaddr.isValid(cleanHostname)) {
      const addr = ipaddr.parse(cleanHostname);
      const range = addr.range();

      // Block non-unicast or private IP ranges
      if (
        range === 'loopback' ||
        range === 'private' ||
        range === 'linkLocal' ||
        range === 'broadcast' ||
        range === 'carrierGradeNat' ||
        range === 'uniqueLocal' ||
        range === 'unspecified'
      ) {
        throw new SSRFError(hostname);
      }
    }

    return parsedUrl.toString();
  }
}
