import { afterEach, describe, expect, it, vi } from 'vitest';
import { runAgentTurn } from './runAgentTurn';
import type { ChatMessage, DonePayload } from './types';

const { generatePendingMedia } = vi.hoisted(() => ({ generatePendingMedia: vi.fn() }));
vi.mock('./media-autogen', () => ({ generatePendingMedia }));

type Deps = Parameters<typeof runAgentTurn>[1];
const userMessage: ChatMessage = { role: 'user', text: 'Change the page' };
const payload: DonePayload = {
  explanation: 'Updated',
  content: [{ type: 'Hero', props: { title: 'New title' } }],
  root: { maxWidth: '1080' } as DonePayload['root'],
};

function setup(response: Response, autoGenerateImages = false) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response));
  const applyDone = vi.fn();
  const setMessages = vi.fn();
  const persistSession = vi.fn();
  const applyGeneratedMedia = vi.fn();
  const pendingMedia = [{ key: 'hero', componentId: null, componentIndex: 0, componentType: 'Hero', fieldPath: ['image'], label: 'Hero', prompt: 'flower', mediaType: 'image' as const, aspectRatio: '1:1' }];
  const deps: Deps = {
    adapter: {
      endpoint: '/api/page/ai-chat', welcomeMessage: '', placeholder: '',
      beforeSend: vi.fn(), getState: () => ({ content: [] }), getStateField: () => 'currentData',
      getSelectionHint: () => null, applyTool: vi.fn(), applyDone,
      getPendingMedia: () => pendingMedia, applyGeneratedMedia,
      formatToolLabel: () => '', isMutatingTool: () => false,
    },
    capabilities: { supportsImageGeneration: true }, selectedModel: 'deepseek-flash',
    autoGenerateImages, pageId: 'page-1',
    streamingTimelineRef: { current: { segments: [] } },
    forceRender: vi.fn(), updateStreamingTimeline: vi.fn(),
    setError: vi.fn(), setGenerating: vi.fn(), setProgressText: vi.fn(),
    setMessages, persistSession,
  };
  return { deps, applyDone, setMessages, persistSession, applyGeneratedMedia, pendingMedia };
}

afterEach(() => { vi.unstubAllGlobals(); vi.clearAllMocks(); });

describe('runAgentTurn response formats', () => {
  it('shows a typed upstream JSON failure without changing the page', async () => {
    const { deps, applyDone, setMessages, persistSession } = setup(Response.json({
      code: 'LLM_INVALID_JSON', error: 'The model did not return valid JSON. Please try again.',
      attemptId: 'attempt-1',
    }, { status: 502 }));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      await runAgentTurn([userMessage], deps);
      expect(applyDone).not.toHaveBeenCalled();
      const messages = [userMessage, expect.objectContaining({
        role: 'assistant', error: true,
        text: 'The model did not return valid JSON. Please try again. (HTTP 502)',
      })];
      expect(setMessages).toHaveBeenCalledWith(messages);
      expect(persistSession).toHaveBeenCalledWith(messages);
    } finally {
      consoleSpy.mockRestore();
    }
  });
  it('applies a successful JSON response and persists the assistant explanation', async () => {
    const { deps, applyDone, setMessages, persistSession } = setup(Response.json(payload));
    await runAgentTurn([userMessage], deps);
    expect(applyDone).toHaveBeenCalledWith({ ...payload, autoGenerateImages: false });
    const messages = [userMessage, { role: 'assistant', text: 'Updated' }];
    expect(setMessages).toHaveBeenCalledWith(messages);
    expect(persistSession).toHaveBeenCalledWith(messages);
    expect(generatePendingMedia).not.toHaveBeenCalled();
  });

  it('runs pending media generation after applying JSON when enabled', async () => {
    generatePendingMedia.mockResolvedValue({ succeeded: 1, failed: 0 });
    const { deps, applyDone, setMessages, pendingMedia } = setup(Response.json(payload), true);
    await runAgentTurn([userMessage], deps);
    expect(applyDone).toHaveBeenCalledWith({ ...payload, autoGenerateImages: true });
    expect(generatePendingMedia).toHaveBeenCalledWith(pendingMedia, expect.objectContaining({ planId: 'page-1' }));
    expect(setMessages).toHaveBeenLastCalledWith([
      userMessage, { role: 'assistant', text: 'Updated' },
      expect.objectContaining({ role: 'assistant', text: 'Generated 1 media asset.' }),
    ]);
  });

  it.each([
    ['invalid syntax', '{bad json'],
    ['missing content', JSON.stringify({ explanation: 'Updated' })],
    ['wrong content shape', JSON.stringify({ explanation: 'Updated', content: 'oops' })],
  ])('does not change the page for %s', async (_, body) => {
    const { deps, applyDone, setMessages } = setup(new Response(body, { headers: { 'content-type': 'application/json' } }));
    await runAgentTurn([userMessage], deps);
    expect(applyDone).not.toHaveBeenCalled();
    expect(setMessages).toHaveBeenCalledWith([userMessage, expect.objectContaining({ role: 'assistant', error: true })]);
  });

  it('continues to apply NDJSON done events', async () => {
    const stream = `${JSON.stringify({ type: 'start' })}\n${JSON.stringify({ type: 'done', ...payload })}\n`;
    const { deps, applyDone, setMessages } = setup(new Response(stream, { headers: { 'content-type': 'application/x-ndjson; charset=utf-8' } }));
    await runAgentTurn([userMessage], deps);
    expect(applyDone).toHaveBeenCalledWith({ ...payload, type: 'done', autoGenerateImages: false });
    expect(setMessages).toHaveBeenCalledWith([userMessage, expect.objectContaining({ text: 'Updated', role: 'assistant' })]);
  });
});
