import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const puckStylesPath = resolve(process.cwd(), 'src/styles/puck.css');

describe('Puck editor theme integration', () => {
  it('maps Puck editor tokens to the application design system', async () => {
    const source = await readFile(puckStylesPath, 'utf8');
    const requiredTokens = [
      '--puck-color-surface:',
      '--puck-color-surface-muted:',
      '--puck-color-border:',
      '--puck-color-text:',
      '--puck-color-text-secondary:',
      '--puck-color-interactive:',
      '--puck-header-color-bg:',
      '--puck-pluginbar-color-bg:',
      '--puck-sidebar-left-color-bg:',
      '--puck-sidebar-right-color-bg:',
    ];

    expect(requiredTokens.every((token) => source.includes(token))).toBe(true);
  });

  it('does not reintroduce light-only colors into custom Puck panels', async () => {
    const source = await readFile(puckStylesPath, 'utf8');
    const customPanelStyles = source.slice(source.indexOf('.autonnel-puck-ai-panel'));

    expect(customPanelStyles).not.toContain('background: #ffffff');
    expect(customPanelStyles).not.toContain('color: #111827');
    expect(customPanelStyles).toContain('var(--color-ds-card)');
    expect(customPanelStyles).toContain('var(--color-ds-ink)');
  });
});
