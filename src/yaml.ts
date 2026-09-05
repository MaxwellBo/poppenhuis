import YAML from 'yaml';

/**
 * Edge-safe YAML helpers.
 * js-yaml is CommonJS and fails Netlify's Deno edge bundler.
 * Import the default export so both the CJS and ESM builds work.
 */
export function load(source: string): unknown {
  return YAML.parse(source);
}

export function dump(value: unknown): string {
  return YAML.stringify(value);
}
