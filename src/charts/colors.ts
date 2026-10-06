// The colour each measure is drawn in, wherever it is: the same in light and dark themes, and the
// same as Lens's own CPU and memory charts.
// To deuteranopes the two read as one colour (ΔE 0.5, OKLab), so colour never tells them apart on its
// own: they are never drawn in one chart, and each chart, tab and card names its measure.
export const measureColors = {
  cpu: "#3d90ce",
  memory: "#c93dce",
} as const;

export type MeasureId = keyof typeof measureColors;
