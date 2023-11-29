import { z } from "zod";

const envSchema = z.object({
  TMDB_API_KEY: z.string(),
  TMDB_API_READ_ACCESS_TOKEN: z.string(),
});

const env = envSchema.safeParse(process.env);

if (!env.success) {
  console.error(
    "Invalid environment variables:",
    JSON.stringify(env.error.format(), null, 2)
  );
  process.exit(1);
}

export default env.data;
