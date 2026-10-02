import { describe, it, expect, vi } from 'vitest';

const { generateTextMock } = vi.hoisted(() => ({ generateTextMock: vi.fn() }));
vi.mock('ai', async (importOriginal) => {
  const actual = await importOriginal<typeof import('ai')>();
  return { ...actual, generateText: (...args: unknown[]) => generateTextMock(...args) };
});

vi.mock('./skill-loader', () => ({
  loadSkillCatalog: () => [],
  buildSkillPrompt: () => '',
  createLoadSkillTool: () => ({}),
}));

import { RawOutputSchema, runPageBuilderAgent } from './agent';

it('parses page JSON locally without sending a structured output schema', async () => {
  generateTextMock.mockReset();
  generateTextMock.mockResolvedValue({
    text: JSON.stringify({
      explanation: 'Listo',
      content: [{ type: 'HeroPanel', props: { headline: 'Hola' } }],
      root: { maxWidth: '1080' },
    }),
    steps: [], finishReason: 'stop', usage: {},
  });
  const result = await runPageBuilderAgent({
    model: 'fake' as never,
    componentCatalog: [],
    messages: [{ role: 'user', content: 'hola' }],
    systemPrompt: 'Devuelve JSON',
  });
  expect(generateTextMock).toHaveBeenCalledOnce();
  expect(generateTextMock.mock.calls[0][0]).not.toHaveProperty('output');
  expect(result.object).toEqual({
    explanation: 'Listo',
    content: [{ type: 'HeroPanel', props: { headline: 'Hola' } }],
    root: { maxWidth: '1080' },
  });
});

it('accepts JSON inside a fenced code block', async () => {
  generateTextMock.mockReset();
  generateTextMock.mockResolvedValue({
    text: '```json\n{"content":[],"root":{"maxWidth":"1080"}}\n```',
    steps: [], finishReason: 'stop', usage: {},
  });
  const result = await runPageBuilderAgent({
    model: 'fake' as never, componentCatalog: [], messages: [], systemPrompt: 'JSON',
  });
  expect(result.object?.root).toEqual({ maxWidth: '1080' });
});

it('rejects malformed page JSON instead of reporting success', async () => {
  generateTextMock.mockReset();
  generateTextMock.mockResolvedValue({
    text: '{"content":"not an array"}',
    steps: [], finishReason: 'stop', usage: {},
  });
  await expect(runPageBuilderAgent({
    model: 'fake' as never, componentCatalog: [], messages: [], systemPrompt: 'JSON',
  })).rejects.toThrow();
});

it('rejects an empty model response', async () => {
  generateTextMock.mockReset();
  generateTextMock.mockResolvedValue({
    text: '', steps: [], finishReason: 'stop', usage: {},
  });
  await expect(runPageBuilderAgent({
    model: 'fake' as never, componentCatalog: [], messages: [], systemPrompt: 'JSON',
  })).rejects.toThrow();
});

describe('RawOutputSchema', () => {
  const validContent = [
    { type: 'HeroPanel', props: { id: 'h1', headline: 'x' } },
    { type: 'PageFooter', props: { id: 'f1' } },
  ];

  it('accepts content as a proper array', () => {
    const result = RawOutputSchema.safeParse({
      explanation: 'done',
      content: validContent,
      root: { maxWidth: '1080' },
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.content).toEqual(validContent);
      expect(result.data.root).toEqual({ maxWidth: '1080' });
    }
  });

  it('accepts content as a JSON-stringified array (qwen behavior)', () => {
    const result = RawOutputSchema.safeParse({
      explanation: 'done',
      content: `\n${JSON.stringify(validContent)}\n`,
      root: { maxWidth: '1080' },
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.content).toEqual(validContent);
    }
  });

  it('accepts root as a JSON-stringified object', () => {
    const result = RawOutputSchema.safeParse({
      content: validContent,
      root: JSON.stringify({ maxWidth: '1080', fontFamily: 'Inter' }),
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.root).toEqual({ maxWidth: '1080', fontFamily: 'Inter' });
    }
  });

  it('rejects content when stringified value is not parseable as array', () => {
    const result = RawOutputSchema.safeParse({
      content: 'not-json',
    });
    expect(result.success).toBe(false);
  });

  it('rejects content when stringified value parses to non-array', () => {
    const result = RawOutputSchema.safeParse({
      content: '{"foo": "bar"}',
    });
    expect(result.success).toBe(false);
  });

  it('rejects content items missing type', () => {
    const result = RawOutputSchema.safeParse({
      content: [{ props: {} }],
    });
    expect(result.success).toBe(false);
  });

  it('allows root and rootProps to be absent', () => {
    const result = RawOutputSchema.safeParse({ content: [] });
    expect(result.success).toBe(true);
  });
});
