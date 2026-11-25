"use client";

import { Box, Stack, ToggleButton, Typography } from "@mui/material";

interface IotSeriesToggleProps {
  label: string;
  options: { id: string; label: string; color: string; dashed?: boolean }[];
  visible: string[];
  onChange: (visible: string[]) => void;
}

export default function IotSeriesToggle({
  label,
  options,
  visible,
  onChange,
}: IotSeriesToggleProps) {
  return (
    <Stack
      direction="row"
      flexWrap="wrap"
      gap={1}
      role="group"
      aria-label={label}
      mb={1}
    >
      {options.map((option) => (
        <ToggleButton
          key={option.id}
          value={option.id}
          selected={visible.includes(option.id)}
          onChange={() =>
            onChange(
              visible.includes(option.id)
                ? visible.filter((id) => id !== option.id)
                : [...visible, option.id],
            )
          }
          size="small"
          sx={{ textTransform: "none", gap: 1 }}
        >
          <Box
            component="span"
            aria-hidden="true"
            sx={{
              width: 18,
              borderTop: `3px ${option.dashed ? "dashed" : "solid"} ${option.color}`,
            }}
          />
          <Typography component="span" variant="body2">
            {option.label}
          </Typography>
        </ToggleButton>
      ))}
    </Stack>
  );
}
