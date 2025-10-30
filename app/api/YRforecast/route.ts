import type { NextApiRequest, NextApiResponse } from "next";

// Coordinates for Askøy, Norway
const LAT = 60.4;
const LON = 5.18333;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const url = `https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${LAT}&lon=${LON}`;
    const response = await fetch(url, {
      headers: {
        "User-Agent": "vatsii-designe.no/1.0 github.com/orjanvatsoy",
        Accept: "application/json",
      },
    });
    if (!response.ok) {
      return res
        .status(response.status)
        .json({ error: "Failed to fetch forecast" });
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
    res.status(200).json({ forecast });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
}
