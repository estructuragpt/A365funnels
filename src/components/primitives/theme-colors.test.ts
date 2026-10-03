import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const srcRoot = resolve(process.cwd(), 'src');
const tokensPath = resolve(srcRoot, 'styles/tokens.css');
const dashboardRoots = ['components', 'pages'];
const sourceExtensions = new Set(['.astro', '.ts', '.tsx']);
const excludedSegments = ['/builder/blocks/', '/lib/templates/'];

const forbiddenUtilities = [
  ['hover:bg-', '[#F9FAFB]'].join(''),
  ['hover:bg-', '[#F3F4F6]'].join(''),
  ['border-', '[#F3F4F6]'].join(''),
  ['divide-', '[#F3F4F6]'].join(''),
  ['text-', '[#374151]'].join(''),
  ['text-', '[#4B5563]'].join(''),
];

async function sourceFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const path = `${directory}/${entry.name}`;
    if (entry.isDirectory()) return sourceFiles(path);
    if (entry.name.includes('.test.') || entry.name.includes('.spec.')) return [];
    const extension = entry.name.slice(entry.name.lastIndexOf('.'));
    return sourceExtensions.has(extension) ? [path] : [];
  }));
  return files.flat();
}

function relativePath(path: string): string {
  return path.slice(srcRoot.length + 1);
}

function luminance(hex: string): number {
  const channels = hex.match(/[0-9a-f]{2}/gi)?.map((channel) => {
    const value = Number.parseInt(channel, 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  if (!channels || channels.length !== 3) throw new Error(`Invalid color: ${hex}`);
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrastRatio(foreground: string, background: string): number {
  const foregroundLuminance = luminance(foreground);
  const backgroundLuminance = luminance(background);
  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);
  return (lighter + 0.05) / (darker + 0.05);
}

function darkToken(source: string, token: string): string {
  const darkTheme = source.match(/html\[data-theme='dark'\]\s*\{(?<tokens>[\s\S]*?)\n\}/g)?.at(-1);
  const value = darkTheme?.match(new RegExp(`--color-${token}:\\s*(#[0-9A-Fa-f]{6})`))?.[1];
  if (!value) throw new Error(`Missing dark theme token: ${token}`);
  return value;
}

describe('dashboard theme colors', () => {
  it('uses semantic tokens instead of light-only palette utilities', async () => {
    const files = (await Promise.all(
      dashboardRoots.map((root) => sourceFiles(`${srcRoot}/${root}`)),
    )).flat().filter((path) => !excludedSegments.some((segment) => path.includes(segment)));

    const violations: string[] = [];
    for (const path of files) {
      const source = await readFile(path, 'utf8');
      for (const utility of forbiddenUtilities) {
        if (source.includes(utility)) violations.push(`${relativePath(path)}: ${utility}`);
      }
    }

    expect(violations).toEqual([]);
  });

  it('keeps small secondary text readable on the dark dashboard surface', async () => {
    const tokens = await readFile(tokensPath, 'utf8');
    const surface = darkToken(tokens, 'ds-surface2');
    expect(contrastRatio(darkToken(tokens, 'ds-faint'), surface)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(darkToken(tokens, 'ds-muted'), surface)).toBeGreaterThanOrEqual(4.5);
  });
});
