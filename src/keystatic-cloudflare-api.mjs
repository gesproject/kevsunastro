import { env } from "cloudflare:workers";
import { makeHandler } from "@keystatic/astro/api";
import config from "virtual:keystatic-config";

const handler = makeHandler({ config });

export async function all(context) {
  return handler(
    new Proxy(context, {
      get(target, property, receiver) {
        return property === "locals" ? { runtime: { env } } : Reflect.get(target, property, receiver);
      },
    }),
  );
}

export const ALL = all;
export const prerender = false;
