import type { FilmOptions } from "@/features/creative-tools/core";

export const FILM_DEFAULT_PRESET: FilmOptions & { dateText: string } = {
  mode: "color",
  strength: .7,
  grain: .45,
  vignette: .42,
  lightLeak: .28,
  dateText: "",
};

export const FILM_ORIGINAL_SETTINGS: FilmOptions & { dateText: string } = {
  mode: "color",
  strength: 0,
  grain: 0,
  vignette: 0,
  lightLeak: 0,
  dateText: "",
};
