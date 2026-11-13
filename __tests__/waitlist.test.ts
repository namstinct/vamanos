import { submitWaitlistEmail } from '../lib/waitlist';

const okJson = { success: 'true' };
const failJson = { success: 'false' };

const supabaseOk = { from: () => ({ insert: async () => ({ error: null }) }) };
const supabaseDup = { from: () => ({ insert: async () => ({ error: { code: '23505' } }) }) };
const supabaseFail = { from: () => ({ insert: async () => ({ error: { code: '42501' } }) }) };

const fetchOk = async () => ({ ok: true, json: async () => okJson });
const fetchFailBody = async () => ({ ok: true, json: async () => failJson });
const fetchFailStatus = async () => ({ ok: false, json: async () => ({}) });
const fetchThrows = async () => { throw new Error('network down'); };

const URL_ = 'https://formsubmit.co/ajax/test@example.com';

describe('submitWaitlistEmail', () => {
  test('succeeds via supabase without calling formsubmit', async () => {
    let called = false;
    const res = await submitWaitlistEmail('a@b.co', {
      supabase: supabaseOk,
      fetchImpl: async () => { called = true; return { ok: true, json: async () => okJson }; },
      formsubmitUrl: URL_,
    });
    expect(res).toBe('supabase');
    expect(called).toBe(false);
  });

  test('duplicate supabase signup still counts as joined, no formsubmit', async () => {
    let called = false;
    const res = await submitWaitlistEmail('a@b.co', {
      supabase: supabaseDup,
      fetchImpl: async () => { called = true; return { ok: true, json: async () => okJson }; },
      formsubmitUrl: URL_,
    });
    expect(res).toBe('supabase');
    expect(called).toBe(false);
  });

  test('falls back to formsubmit when supabase fails and reports formsubmit', async () => {
    const res = await submitWaitlistEmail('a@b.co', { supabase: supabaseFail, fetchImpl: fetchOk, formsubmitUrl: URL_ });
    expect(res).toBe('formsubmit');
  });

  test('throws when supabase fails and formsubmit returns failure body', async () => {
    await expect(submitWaitlistEmail('a@b.co', { supabase: supabaseFail, fetchImpl: fetchFailBody, formsubmitUrl: URL_ })).rejects.toThrow();
  });

  test('throws when supabase fails and formsubmit HTTP fails', async () => {
    await expect(submitWaitlistEmail('a@b.co', { supabase: supabaseFail, fetchImpl: fetchFailStatus, formsubmitUrl: URL_ })).rejects.toThrow();
  });

  test('throws on network failure, never silently succeeds', async () => {
    await expect(submitWaitlistEmail('a@b.co', { supabase: null, fetchImpl: fetchThrows, formsubmitUrl: URL_ })).rejects.toThrow();
  });

  test('no supabase configured uses formsubmit path', async () => {
    const res = await submitWaitlistEmail('a@b.co', { supabase: null, fetchImpl: fetchOk, formsubmitUrl: URL_ });
    expect(res).toBe('formsubmit');
  });
});
