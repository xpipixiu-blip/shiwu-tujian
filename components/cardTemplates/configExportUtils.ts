import type { TemplateConfig } from "@/lib/cardTemplateTypes";

export function toAdjustableConfigJSON(config: TemplateConfig): string {
  return JSON.stringify(config, null, 2);
}

export function generateTSConfigSource(
  config: TemplateConfig,
  variableName = "templateConfig",
): string {
  const json = toAdjustableConfigJSON(config);
  return `import type { TemplateConfig } from "@/lib/cardTemplateTypes";

export const ${variableName}: TemplateConfig = ${json};
`;
}

export async function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
  } else {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
  }
}

export function downloadAsFile(
  content: string,
  filename: string,
  mimeType = "text/plain",
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.download = filename;
  link.href = url;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
