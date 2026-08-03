import { env } from "cloudflare:workers";
import { makeHandler } from "@keystatic/astro/api";
import config from "virtual:keystatic-config";

const handler = makeHandler({ config });

function withCloudflareEnv(context) {
	return handler(
		new Proxy(context, {
			get(target, property, receiver) {
				if (property === "locals") {
					return { runtime: { env } };
				}

				return Reflect.get(target, property, receiver);
			},
		}),
	);
}

export const all = withCloudflareEnv;
export const ALL = all;
export const prerender = false;
