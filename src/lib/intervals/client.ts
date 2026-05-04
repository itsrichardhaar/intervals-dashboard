const BASE_URL = process.env.INTERVALS_API_URL ?? "https://api.myintervals.com";
const API_TOKEN = process.env.INTERVALS_API_TOKEN ?? "";

export async function intervalsGet<T>(path: string): Promise<T> {
  const credentials = Buffer.from(`${API_TOKEN}:x`).toString("base64");

  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      Authorization: `Basic ${credentials}`,
      Accept: "application/json",
    },
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    throw new Error(`Intervals API error: ${res.status} ${res.statusText} for ${path}`);
  }

  return res.json() as Promise<T>;
}
