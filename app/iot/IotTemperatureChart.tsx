"use client";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import TodayIcon from "@mui/icons-material/Today";
import {
  Box,
  Button,
  IconButton,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import { useState, useEffect } from "react";
import { LineChart } from "@mui/x-charts/LineChart";

async function fetchYrForecast() {
  const res = await fetch("/api/YRforecast");
  if (!res.ok) throw new Error("Failed to fetch forecast");
  const data = await res.json();
  return data.forecast as { time: string; temperature: number }[];
}

const HOUR = 60 * 60 * 1000;

const rangeOptions = [
  { hours: 24, label: "1 døgn" },
  { hours: 72, label: "3 døgn" },
  { hours: 168, label: "7 døgn" },
  { hours: 336, label: "14 døgn" },
];

interface IotTemperatureChartProps {
  data: {
    created_at: string;
    temperature: number;
    temperature_forcast?: number | null;
  }[];
  loading: boolean;
  authorized: boolean;
}

export default function IotTemperatureChart({
  data,
  loading,
  authorized,
}: IotTemperatureChartProps) {
  const [hourRange, setHourRange] = useState(24);
  const [windowOffset, setWindowOffset] = useState(0);
  const [forecast, setForecast] = useState<
    { time: string; temperature: number }[]
  >([]);

  useEffect(() => {
    let ignore = false;
    fetchYrForecast()
      .then((forecastData) => {
        if (!ignore) setForecast(forecastData);
      })
      .catch(() => {
        if (!ignore) setForecast([]);
      });
    return () => {
      ignore = true;
    };
  }, []);

  if (loading) {
    return (
      <Typography color="text.secondary">Laster temperaturdata …</Typography>
    );
  }
  if (!authorized) {
    return (
      <Typography color="error">
        Du har ikke tilgang til temperaturdata.
      </Typography>
    );
  }

  const now = new Date();
  const windowEnd = new Date(now.getTime() + windowOffset * hourRange * HOUR);
  const windowStart = new Date(windowEnd.getTime() - hourRange * HOUR);
  const forecastEnd = new Date(now.getTime() + 24 * HOUR);
  const displayEnd = windowOffset === 0 ? forecastEnd : windowEnd;

  const measuredInWindow = data.filter((entry) => {
    const timestamp = new Date(entry.created_at).getTime();
    return (
      timestamp >= windowStart.getTime() && timestamp <= windowEnd.getTime()
    );
  });
  const futureForecast =
    windowOffset === 0
      ? forecast.filter((entry) => {
          const timestamp = new Date(entry.time).getTime();
          return (
            timestamp >= now.getTime() && timestamp <= forecastEnd.getTime()
          );
        })
      : [];

  const measuredByTime = new Map(
    measuredInWindow.map((entry) => [
      new Date(entry.created_at).getTime(),
      entry.temperature,
    ]),
  );
  const forecastByTime = new Map<number, number>();
  measuredInWindow.forEach((entry) => {
    if (
      entry.temperature_forcast !== undefined &&
      entry.temperature_forcast !== null
    ) {
      forecastByTime.set(
        new Date(entry.created_at).getTime(),
        entry.temperature_forcast,
      );
    }
  });
  futureForecast.forEach((entry) => {
    forecastByTime.set(new Date(entry.time).getTime(), entry.temperature);
  });

  const timestamps = [
    ...new Set([...measuredByTime.keys(), ...forecastByTime.keys()]),
  ].sort((left, right) => left - right);
  const xData = timestamps.map((timestamp) => new Date(timestamp));
  const measuredData = timestamps.map(
    (timestamp) => measuredByTime.get(timestamp) ?? null,
  );
  const forecastData = timestamps.map(
    (timestamp) => forecastByTime.get(timestamp) ?? null,
  );
  const dateFormatter = new Intl.DateTimeFormat("nb-NO", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
  const rangeLabel = `${dateFormatter.format(windowStart)} – ${dateFormatter.format(windowEnd)}`;

  return (
    <Box sx={{ width: "100%" }}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        alignItems={{ xs: "stretch", md: "center" }}
        justifyContent="space-between"
        gap={2}
        mb={2}
      >
        <ToggleButtonGroup
          exclusive
          size="small"
          value={hourRange}
          onChange={(_, value: number | null) => {
            if (value === null) return;
            setHourRange(value);
            setWindowOffset(0);
          }}
          aria-label="Velg tidsperiode"
        >
          {rangeOptions.map((option) => (
            <ToggleButton key={option.hours} value={option.hours}>
              {option.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>

        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
        >
          <Tooltip title="Forrige periode">
            <IconButton
              aria-label="Vis forrige periode"
              onClick={() => setWindowOffset((offset) => offset - 1)}
            >
              <ChevronLeftIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant={windowOffset === 0 ? "contained" : "outlined"}
            startIcon={<TodayIcon />}
            onClick={() => setWindowOffset(0)}
          >
            Nå
          </Button>
          <Tooltip title="Neste periode">
            <span>
              <IconButton
                aria-label="Vis neste periode"
                disabled={windowOffset === 0}
                onClick={() =>
                  setWindowOffset((offset) => Math.min(0, offset + 1))
                }
              >
                <ChevronRightIcon />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      </Stack>

      <Typography variant="body2" color="text.secondary" mb={1}>
        {rangeLabel}
        {windowOffset === 0 && futureForecast.length > 0
          ? " · Yr-varsel neste 24 timer"
          : ""}
      </Typography>

      {xData.length > 0 ? (
        <LineChart
          xAxis={[
            {
              data: xData,
              scaleType: "time",
              min: windowStart,
              max: displayEnd,
              tickNumber: 7,
              valueFormatter: (value: Date) => dateFormatter.format(value),
            },
          ]}
          yAxis={[{ label: "Temperatur (°C)" }]}
          series={[
            {
              id: "measured",
              data: measuredData,
              label: "Målt temperatur",
              showMark: false,
              connectNulls: false,
            },
            {
              id: "forecast",
              data: forecastData,
              label: "Yr-varsel",
              showMark: false,
              connectNulls: false,
              color: "#D9A066",
            },
          ]}
          height={430}
          margin={{ left: 16, right: 16, bottom: 12 }}
          slotProps={{
            line: ({ id }) => ({
              strokeDasharray: id === "forecast" ? "5 5" : "0",
            }),
          }}
        />
      ) : (
        <Box
          sx={{
            minHeight: 360,
            display: "grid",
            placeItems: "center",
            borderTop: "1px solid",
            borderColor: "divider",
          }}
        >
          <Typography color="text.secondary">
            Ingen målinger i denne perioden.
          </Typography>
        </Box>
      )}
    </Box>
  );
}
