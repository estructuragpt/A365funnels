import { NoObjectGeneratedError } from 'ai';

export interface JsonFailureDiagnostics {
  category: 'truncated' | 'empty' | 'malformed' | 'unknown';
  finishReason: string | null;
  causeName: string | null;
  textLength: number;
  isBlank: boolean;
  startsWithJsonDelimiter: boolean;
  endsWithJsonDelimiter: boolean;
  inputTokens: number | null;
  outputTokens: number | null;
}

// Never return the generated text, an error object, its cause message or provider metadata.
export function describeJsonFailure(error: unknown): JsonFailureDiagnostics | null {
  if (!NoObjectGeneratedError.isInstance(error)) return null;
  const text = error.text ?? '';
  const trimmed = text.trim();
  const finishReason = typeof error.finishReason === 'string' ? error.finishReason : null;
  const causeName = error.cause instanceof Error ? error.cause.name : null;
  const usage = error.usage;
  return {
    category: finishReason === 'length' ? 'truncated' : !trimmed ? 'empty' : 'malformed',
    finishReason,
    causeName,
    textLength: text.length,
    isBlank: trimmed.length === 0,
    startsWithJsonDelimiter: trimmed.startsWith('{') || trimmed.startsWith('['),
    endsWithJsonDelimiter: trimmed.endsWith('}') || trimmed.endsWith(']'),
    inputTokens: typeof usage?.inputTokens === 'number' ? usage.inputTokens : null,
    outputTokens: typeof usage?.outputTokens === 'number' ? usage.outputTokens : null,
  };
}
