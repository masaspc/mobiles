import { z } from 'zod';

export const sourceSchema = z.object({ field: z.string().optional(), publisher: z.string().min(1), url: z.string().url(), retrievedAt: z.string().date() });
const nullableNumber = z.number().nullable().optional();

export const modelSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/), maker: z.string().min(1), series: z.string().nullable().optional(),
  modelName: z.string().min(1), modelNumber: z.string().nullable().optional(),
  formFactor: z.enum(['clamshell', 'convertible', 'detachable', 'tablet']), releaseDate: z.string().date().nullable().optional(),
  os: z.object({ family: z.enum(['Windows', 'macOS', 'ChromeOS', 'iPadOS', 'Android']), edition: z.string().nullable().optional(), version: z.string().nullable().optional() }),
  copilotPlusPc: z.boolean().default(false), imageKey: z.string().nullable().optional(), imageUrl: z.string().url().nullable().optional(), productUrl: z.string().url(),
  cpu: z.object({ vendor: z.enum(['Intel', 'AMD', 'Qualcomm', 'Apple', 'MediaTek', 'Google', 'Samsung']), family: z.string(), model: z.string(), isa: z.enum(['x86-64', 'ARM64']), npuTops: nullableNumber,
    benchmarks: z.object({ cinebench2024Multi: nullableNumber, geekbench6Multi: nullableNumber, passmarkMulti: nullableNumber }).default({}) }),
  memory: z.object({ capacityGB: z.number().positive(), type: z.string().nullable().optional(), speedMTps: nullableNumber, soldered: z.boolean().nullable().optional(), maxCapacityGB: nullableNumber }),
  storage: z.object({ capacityGB: z.number().positive(), interface: z.string().nullable().optional(), userReplaceable: z.boolean().nullable().optional() }),
  display: z.object({ sizeInch: z.number().positive(), resolution: z.object({ width: z.number(), height: z.number() }).nullable().optional(), panelType: z.string().nullable().optional(), touch: z.boolean().default(false), aspectRatio: z.string().nullable().optional(), refreshRateHz: nullableNumber, brightnessNits: nullableNumber, pen: z.boolean().nullable().optional() }),
  connectivity: z.object({ wifi: z.object({ standard: z.string() }), bluetooth: z.string().nullable().optional(), wwan: z.object({ type: z.enum(['none','LTE','5G Sub-6','5G mmWave']) }) }),
  ports: z.object({ thunderbolt: z.boolean().default(false), usbPd: z.boolean().default(false), usbC: z.object({ count: z.number().nonnegative(), spec: z.string() }).nullable().optional(), usbA: z.number().nonnegative().nullable().optional(), hdmi: z.string().nullable().optional(), cardReader: z.enum(['SD', 'microSD']).nullable().optional(), audioJack: z.boolean().nullable().optional() }).default({ thunderbolt: false, usbPd: false }),
  battery: z.object({ capacityWh: z.number().positive(), ratedLife: z.array(z.object({ method: z.string(), hours: z.number().positive() })).default([]), charger: z.object({ watt: z.number().positive(), usbPd: z.boolean() }) }),
  physical: z.object({ weightG: z.number().min(300).max(3000), dimensions: z.object({ width: z.number().positive(), depth: z.number().positive(), thicknessMax: z.number().positive() }), chassisMaterial: z.string().nullable().optional() }),
  io: z.object({ webcam: z.object({ resolution: z.string(), ir: z.boolean(), privacyShutter: z.boolean() }).nullable().optional(), windowsHello: z.object({ face: z.boolean(), fingerprint: z.boolean() }).nullable().optional(), keyboard: z.object({ backlight: z.boolean(), layout: z.string() }).nullable().optional() }).nullable().optional(),
  pricing: z.object({ priceJpy: z.number().positive(), priceType: z.enum(['msrp','street']), variants: z.array(z.object({ label:z.string(), memoryGB:z.number(), storageGB:z.number(), priceJpy:z.number() })).default([]) }),
  sources: z.array(sourceSchema).min(1), lastUpdated: z.string().date(),
});

export type Model = z.infer<typeof modelSchema>;
export type DerivedModel = Model & { footprintCm2: number; volumeCm3: number; performanceScore: number | null; performancePerWeight: number | null; performancePerPrice: number | null; batteryDensity: number; portabilityScore: number; performanceScore100: number | null; batteryScore: number; connectivityScore: number; valueScore: number | null };

const clamp = (value: number) => Math.max(0, Math.min(100, value));
export function deriveModel(model: Model): DerivedModel {
  const { width, depth, thicknessMax } = model.physical.dimensions;
  const footprintCm2 = width * depth / 100;
  const volumeCm3 = width * depth * thicknessMax / 1000;
  const batteryDensity = model.battery.capacityWh / model.physical.weightG;
  // Fixed public ranges: weight 800–1600g, volume 500–1600cm³, density 0.035–0.075Wh/g.
  const weightScore = clamp((1600 - model.physical.weightG) / 8);
  const volumeScore = clamp((1600 - volumeCm3) / 11);
  const densityScore = clamp((batteryDensity - .035) / .0004);
  // Cross-model derived metrics use only Geekbench 6 Multi; never mix benchmark scales.
  const performanceScore = model.cpu.benchmarks.geekbench6Multi ?? null;
  const performancePerWeight = performanceScore ? performanceScore / model.physical.weightG : null;
  const performancePerPrice = performanceScore ? performanceScore / model.pricing.priceJpy : null;
  const wifiBase = model.connectivity.wifi.standard === 'Wi-Fi 7' ? 70 : model.connectivity.wifi.standard === 'Wi-Fi 6E' ? 55 : model.connectivity.wifi.standard === 'Wi-Fi 6' ? 40 : 0;
  const wwanBonus = model.connectivity.wwan.type.startsWith('5G') ? 30 : model.connectivity.wwan.type === 'LTE' ? 15 : 0;
  return { ...model, footprintCm2, volumeCm3, batteryDensity, portabilityScore: Math.round((weightScore + volumeScore + densityScore) / 3), performanceScore, performancePerWeight, performancePerPrice, performanceScore100: performanceScore === null ? null : clamp((performanceScore - 5000) / 150), batteryScore: densityScore, connectivityScore: clamp(wifiBase + wwanBonus), valueScore: performancePerPrice === null ? null : clamp((performancePerPrice - .03) / .0006) };
}
export const coreModelSchema = modelSchema;
