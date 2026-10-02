import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NoObjectGeneratedError } from 'ai';

const h = vi.hoisted(() => ({
  agent: vi.fn(), info: vi.fn(), error: vi.fn(),
}));
vi.mock('@/modules/identity/published/principal', () => ({ requireFeature: vi.fn() }));
vi.mock('@/lib/ai/provider', () => ({ resolveLlmModel: async () => ({ model: 'fake', modelId: 'deepseek-flash', protocol: 'openai-compatible' }) }));
vi.mock('@/lib/ai/agent', () => ({ runPageBuilderAgent: h.agent }));
vi.mock('@/components/builder/config', () => ({ getComponentCatalog: () => [] }));
vi.mock('@/lib/logger', () => ({ createLogger: () => ({ info: h.info, error: h.error }) }));
import { POST } from './ai-chat';

const request = () => ({
  request: new Request('http://test/api/page/ai-chat', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ messages: [{ role: 'user', text: 'change page' }], currentData: { root: { props: {} }, content: [] }, modelName: 'deepseek-flash' }),
  }),
}) as never;

beforeEach(() => { h.agent.mockReset(); h.info.mockReset(); h.error.mockReset(); });

describe('POST /api/page/ai-chat', () => {
  it('returns a correlated 502 for unparsable JSON and does not log the generated response', async () => {
    const sentinel = 'sk-should-not-appear-in-logs';
    h.agent.mockRejectedValue(new NoObjectGeneratedError({
      message: 'No object generated: could not parse the response.',
      text: `{"secret":"${sentinel}`, finishReason: 'length',
      cause: new SyntaxError(`invalid ${sentinel}`), response: {},
      usage: { inputTokens: 20, outputTokens: 10 },
    } as ConstructorParameters<typeof NoObjectGeneratedError>[0]));
    const res = (await POST(request())) as Response;
    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body).toMatchObject({ code: 'LLM_INVALID_JSON', attemptId: expect.any(String) });
    expect(JSON.stringify(body)).not.toContain(sentinel);
    expect(h.error).toHaveBeenCalledWith('Agent generation failed', expect.objectContaining({
      attemptId: body.attemptId,
      category: 'truncated', finishReason: 'length', outputTokens: 10,
    }));
    expect(h.info.mock.calls.some(([message, meta]) => message === 'Agent generate starting' && meta.attemptId === body.attemptId)).toBe(true);
    expect(JSON.stringify([h.error.mock.calls, h.info.mock.calls])).not.toContain(sentinel);
  });

  it('returns a typed 502 for a whitespace-only completion without echoing it', async () => {
    h.agent.mockRejectedValue(new NoObjectGeneratedError({
      message: 'No object generated: could not parse the response.',
      text: ' '.repeat(318), finishReason: 'stop',
      cause: new SyntaxError('whitespace-only JSON'), response: {},
      usage: { inputTokens: 2895, outputTokens: 459 },
    } as ConstructorParameters<typeof NoObjectGeneratedError>[0]));
    const res = (await POST(request())) as Response;
    expect(res.status).toBe(502);
    expect(await res.json()).toMatchObject({ code: 'LLM_INVALID_JSON' });
    expect(h.agent).toHaveBeenCalledTimes(1); // No unapproved billable retry.
    expect(h.error).toHaveBeenCalledWith('Agent generation failed', expect.objectContaining({
      category: 'empty', isBlank: true, textLength: 318,
      finishReason: 'stop', inputTokens: 2895, outputTokens: 459,
    }));
  });

  it('keeps the successful JSON contract and correlates the result', async () => {
    h.agent.mockResolvedValue({ object: { explanation: 'Done', content: [{ type: 'Hero', props: {} }], root: { maxWidth: '1080' } }, text: '', steps: [], finishReason: 'stop', usage: {} });
    const res = (await POST(request())) as Response;
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ explanation: 'Done', content: [{ type: 'Hero', props: {} }], root: { maxWidth: '1080' } });
    expect(h.info.mock.calls.some(([message, meta]) => message === 'Agent generate result' && typeof meta.attemptId === 'string')).toBe(true);
  });
});
