/**
 * Aurora color palettes per event.
 * Each palette is [color1, color2, color3] for the aurora gradient.
 */
export const AURORA_PALETTES = {
  utsav: ["#FF7A2F", "#FF3B30", "#FFB27A"],
  phaseshift: ["#2F80ED", "#7C3AED", "#6C5BFF"],
  farouche: ["#3B6F3B", "#8A9A3A", "#2D4A2D"],
  club: ["#22c55e", "#16a34a", "#4ade80"],
};

export function getAuroraPalette(eventKey) {
  return AURORA_PALETTES[eventKey] ?? AURORA_PALETTES.utsav;
}
