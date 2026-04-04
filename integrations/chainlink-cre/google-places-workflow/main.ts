import { CronCapability, HTTPClient, handler, Runner, type Runtime } from "@chainlink/cre-sdk";

export type Config = {
  schedule: string;
  lat: number;
  lon: number;
  apiKey: string;
};

export const onCronTrigger = async (runtime: Runtime<Config>): Promise<string> => {
  const { lat, lon, apiKey } = runtime.config;

  runtime.log(`Fetching places for lat: ${lat}, lon: ${lon}...`);

  const keyword = "tourist attraction cafe store";
  const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lon}&radius=500&keyword=${encodeURIComponent(keyword)}&key=${apiKey}`;

  try {
    // Instantiate Chainlink CRE HTTP capability
    const httpClient = new HTTPClient();
    
    // Invoke capability to fetch decentralized result
    const req = httpClient.sendRequest(runtime as any, {
      url,
      method: "GET",
    });

    const response = await req.result();

    if (response.statusCode < 200 || response.statusCode >= 300) {
      runtime.log(`Failed to fetch from Google Places API. Status: ${response.statusCode}`);
      return `Error: ${response.statusCode}`;
    }

    // Decode Uint8Array body
    const bodyStr = new TextDecoder().decode(response.body);
    const data = JSON.parse(bodyStr);

    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      runtime.log(`Places API error status: ${data.status}`);
      return `API Error: ${data.status}`;
    }

    const results = data.results || [];
    
    // Sort array in descending order based on rating
    results.sort((a: any, b: any) => {
      const ratingA = a.rating || 0;
      const ratingB = b.rating || 0;
      return ratingB - ratingA;
    });

    const top5 = results.slice(0, 5);

    const parsed = top5.map((place: any) => ({
      name: place.name,
      rating: place.rating,
      vicinity: place.vicinity,
      types: place.types
    }));

    runtime.log(`Found ${parsed.length} top-rated tourist places within 500m.`);
    
    const resultString = JSON.stringify(parsed, null, 2);
    runtime.log(resultString);

    return resultString;
  } catch (error: any) {
    runtime.log(`Exception during fetch: ${error.message}`);
    return `Exception: ${error.message}`;
  }
};

export const initWorkflow = (config: Config) => {
  const cron = new CronCapability();

  return [
    handler(
      cron.trigger(
        { schedule: config.schedule }
      ),
      onCronTrigger
    ),
  ];
};

export async function main() {
  const runner = await Runner.newRunner<Config>();
  await runner.run(initWorkflow);
}
