import { Buffer } from 'node:buffer';

export const prerender = false;

export function GET() {
  return new Response(JSON.stringify({
    route: 'dynamic',
    nodejsCompat: Buffer.from('enabled').toString('utf8'),
  }), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}
