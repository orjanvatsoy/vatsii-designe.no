// Coordinates for Askøy, Norway
const LAT = 60.4;
const LON = 5.18333;

export async function GET(request: Request) {
  try {
    const url = `https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${LAT}&lon=${LON}`;
    const response = await fetch(url, {
      headers: {
        "User-Agent": "vatsii-designe.no/1.0 github.com/orjanvatsoy",
        Accept: "application/json",
      },
    });
    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch forecast" }),
        {
          status: response.status,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
    const data = await response.json();
    // Only return the timeseries array (hourly forecast)
    const timeseries = data.properties?.timeseries || [];
    // Map to { time, temperature }
    type YrTimeseriesItem = {
      time: string;
      data: {
        instant: {
          details: {
            air_temperature: number;
          };
        };
      };
    };
    const forecast = timeseries.map((item: YrTimeseriesItem) => {
      return {
        time: item.time,
        temperature: item.data.instant.details.air_temperature,
      };
    });
    return new Response(JSON.stringify({ forecast }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
