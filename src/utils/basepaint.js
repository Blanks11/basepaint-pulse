export const BASEPAINT_GRAPHQL = "https://graphql.basepaint.xyz";

// Calculate the current active BasePaint day
export function getCurrentDay() {
  const day1Start = 1691599315; // BasePaint Day 1 Epoch
  const now = Math.floor(Date.now() / 1000);
  return Math.max(1, Math.floor((now - day1Start) / 86400) + 1);
}

export function getCanvasSize(day) {
  return 256; // Standard BasePaint canvas resolution
}

// Decodes Stroke.data (6 hex chars per pixel: X, Y, Palette Index)
export function parseStrokeData(hexData) {
  if (!hexData) return [];
  const cleanHex = hexData.startsWith("0x") ? hexData.slice(2) : hexData;
  const pixels = [];

  for (let i = 0; i < cleanHex.length; i += 6) {
    const x = parseInt(cleanHex.substring(i, i + 2), 16);
    const y = parseInt(cleanHex.substring(i + 2, i + 4), 16);
    const colorIndex = parseInt(cleanHex.substring(i + 4, i + 6), 16);

    if (!isNaN(x) && !isNaN(y) && !isNaN(colorIndex)) {
      pixels.push({ x, y, colorIndex });
    }
  }
  return pixels;
}

// Fetch helper for GraphQL API
export async function queryBasePaint(query, variables = {}) {
  const response = await fetch(BASEPAINT_GRAPHQL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  const json = await response.json();
  if (json.errors) {
    throw new Error(json.errors[0].message);
  }
  return json.data;
}
