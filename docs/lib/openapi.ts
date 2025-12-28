import { createOpenAPI } from 'fumadocs-openapi/server';
import { join } from 'node:path';

export const openapi = createOpenAPI({
  input: [join(process.cwd(), 'openapi.json')],
});

