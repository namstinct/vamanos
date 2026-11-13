/**
 * Waitlist signup submission, isolated for testability.
 * Only reports success when a backend actually confirmed the signup.
 */

export interface WaitlistDeps {
  supabase: { from: (table: string) => { insert: (rows: any[]) => PromiseLike<{ error: any }> } } | null;
  fetchImpl: (url: string, init?: any) => Promise<{ ok: boolean; json: () => Promise<any> }>;
  formsubmitUrl: string;
}

export type WaitlistResult = 'supabase' | 'formsubmit';

export async function submitWaitlistEmail(email: string, deps: WaitlistDeps): Promise<WaitlistResult> {
  const trimmed = email.trim();
  let saved = false;

  if (deps.supabase) {
    const { error } = await deps.supabase.from('waitlist').insert([{ email: trimmed }]);
    // 23505 = unique constraint, meaning the email is already on the list.
    saved = !error || error.code === '23505';
  }

  if (!saved) {
    const response = await deps.fetchImpl(deps.formsubmitUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ email: trimmed, message: 'New signup for Vamonos Waitlist', _subject: 'New Vamonos signup' }),
    });
    const result = await response.json();
    if (!response.ok || (result.success !== true && result.success !== 'true')) {
      throw new Error('Signup not confirmed');
    }
    return 'formsubmit';
  }
  return 'supabase';
}
