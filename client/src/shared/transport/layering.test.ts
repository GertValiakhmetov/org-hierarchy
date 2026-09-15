import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const TRANSPORT_DIR = new URL('.', import.meta.url).pathname;

/** Layers transport is not allowed to reach into, in any import form. */
const FORBIDDEN = ['shared/api', 'entities/', 'features/', 'app/'];

function importsOf(source: string): string[] {
  return [...source.matchAll(/from\s+'([^']+)'/g)].map((match) => match[1] ?? '');
}

describe('layering', () => {
  const files = readdirSync(TRANSPORT_DIR).filter(
    (name) => name.endsWith('.ts') && !name.endsWith('.test.ts'),
  );

  it('there are transport files to check', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it.each(files)('%s does not import from the layers above it', (file) => {
    const specifiers = importsOf(readFileSync(join(TRANSPORT_DIR, file), 'utf8'));

    const violations = specifiers.filter((specifier) =>
      FORBIDDEN.some((layer) => specifier.includes(layer)),
    );

    expect(violations).toEqual([]);
  });

  it('transport knows no org-structure domain terms', () => {
    const domainTerms = ['OrgNode', 'headcount', 'parentId', 'org-tree'];

    for (const file of files) {
      const source = readFileSync(join(TRANSPORT_DIR, file), 'utf8');
      for (const term of domainTerms) {
        expect(source, `${file} mentions "${term}"`).not.toContain(term);
      }
    }
  });
});
