import { init, use } from 'echarts/core';
import { ScatterChart, RadarChart } from 'echarts/charts';
import { GridComponent, LegendComponent, RadarComponent, TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

use([ScatterChart, RadarChart, GridComponent, LegendComponent, RadarComponent, TooltipComponent, CanvasRenderer]);

export { init };

export const escapeHtml = (value: string | number) => String(value)
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;').replaceAll("'", '&#39;');

export const chartColors = (dark: boolean) => ({
  text: dark ? '#e2e8f0' : '#1e293b',
  line: dark ? '#475569' : '#cbd5e1',
  accent: dark ? '#67e8f9' : '#146c94',
});
