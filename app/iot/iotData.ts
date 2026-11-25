export const GARAGE_DEVICE_ID = "IngerBangIOT";
export const CABIN_DEVICE_ID = "HytteStue";

export interface CabinTemperature {
  created_at: string;
  temperature: number;
}

export interface TemperatureData {
  created_at: string;
  device_id: string | null;
  temperature: number | null;
  temperature_forcast: number | null;
  humidity: number | null;
  humidity_forcast: number | null;
  outdoor_temperature: number | null;
}
