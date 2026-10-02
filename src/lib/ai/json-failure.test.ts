import { describe, expect, it } from 'vitest';
import { NoObjectGeneratedError } from 'ai';
import { describeJsonFailure } from './json-failure';

function failed(text: string | undefined, finishReason: string, cause = new SyntaxError('secret-from-cause')) {
  return new NoObjectGeneratedError({
    message: 'no object', text, finishReason, cause,
    response: {}, usage: { inputTokens: 31, outputTokens: 12 },
  } as ConstructorParameters<typeof NoObjectGeneratedError>[0]);
}

describe('safe JSON failure diagnostics', () => {
  it('classifies empty and whitespace-only responses without copying text or cause', () => {
    for (const text of ['', '   \n']) {
      const report = describeJsonFailure(failed(text, 'stop'));
      expect(report).toMatchObject({ category: 'empty', isBlank: true, finishReason: 'stop' });
      expect(JSON.stringify(report)).not.toContain('secret-from-cause');
    }
  });

  it('prioritizes length even when the response is blank or malformed', () => {
    expect(describeJsonFailure(failed('{"private":"sensitive', 'length'))?.category).toBe('truncated');
    expect(describeJsonFailure(failed('', 'length'))?.category).toBe('truncated');
  });

  it('reports only allowlisted metadata for nonempty malformed output', () => {
    const sentinel = 'sk-do-not-log-or-return-this';
    const report = describeJsonFailure(failed(`{"secret":"${sentinel}`, 'stop'));
    expect(report).toEqual({
      category: 'malformed', finishReason: 'stop', causeName: 'SyntaxError',
      textLength: `{"secret":"${sentinel}`.length, isBlank: false,
      startsWithJsonDelimiter: true, endsWithJsonDelimiter: false,
      inputTokens: 31, outputTokens: 12,
    });
    expect(JSON.stringify(report)).not.toContain(sentinel);
  });

  it('does not treat unrelated errors as JSON output failures', () => {
    expect(describeJsonFailure(new Error('unrelated'))).toBeNull();
  });
});
