import { describe, expect, it } from 'vitest';

import { api } from './api';

describe('API client', () => {
  it('always sends browser credentials for HttpOnly session cookies', () => {
    expect(api.defaults.withCredentials).toBe(true);
  });
});
