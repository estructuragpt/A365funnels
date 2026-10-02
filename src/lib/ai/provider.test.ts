import { describe, it, expect, vi } from 'vitest';

const { chatMock, defaultModelMock, createOpenAIMock } = vi.hoisted(() => ({
  chatMock: vi.fn(() => 'chat-model'),
  defaultModelMock: vi.fn(() => 'responses-model'),
  createOpenAIMock: vi.fn(),
}));
vi.mock('@ai-sdk/openai', () => ({
  createOpenAI: (...args: unknown[]) => {
    createOpenAIMock(...args);
    return Object.assign(defaultModelMock, { chat: chatMock });
  },
}));
vi.mock('@/lib/config/llm-models', () => ({
  getLlmModel: vi.fn(async () => ({
    type: 'text', provider: 'openai-chat', name: 'deepseek-flash',
    modelId: 'deepseek-flash', baseUrl: 'https://api.deepseek.com', apiKey: 'FAKE',
  })),
}));
import { resolveLlmModel } from './provider';

describe('resolveLlmModel', () => {
  it('selects chat completions for an OpenAI-compatible endpoint', async () => {
    chatMock.mockClear(); defaultModelMock.mockClear(); createOpenAIMock.mockClear();
    const resolved = await resolveLlmModel('deepseek-flash');
    expect(createOpenAIMock).toHaveBeenCalledWith({
      baseURL: 'https://api.deepseek.com', apiKey: 'FAKE',
    });
    expect(chatMock).toHaveBeenCalledWith('deepseek-flash');
    expect(defaultModelMock).not.toHaveBeenCalled();
    expect(resolved.model).toBe('chat-model');
  });
});
