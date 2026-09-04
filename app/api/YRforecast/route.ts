// Coordinates for Askøy, Norway
const LAT = 60.4;
const LON = 5.18333;

export async function GET() {
  try {
    const url = `https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${LAT}&lon=${LON}`;
    const response = await fetch(url, {
      headers: {
        "User-Agent": "vatsii-designe.no/1.0 github.com/orjanvatsoy",
        Accept: "application/json",
      },
      next: { revalidate: 3600 },
    });
    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch forecast" }),
        {
          status: response.status,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
    const data = await response.json();
    // Only return the timeseries array (hourly forecast)
    const timeseries = data.properties?.timeseries || [];
    // Map to the values used by the IoT charts.
    type YrTimeseriesItem = {
      time: string;
      data: {
        instant: {
          details: {
            air_temperature: number;
            relative_humidity: number;
          };
        };
      };
    };
    const forecast = timeseries.map((item: YrTimeseriesItem) => {
      return {
        time: item.time,
        temperature: item.data.instant.details.air_temperature,
        humidity: item.data.instant.details.relative_humidity,
      };
    });
    return new Response(JSON.stringify({ forecast }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch {
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
