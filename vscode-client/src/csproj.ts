const PACKAGE_ID = "Qualimetry.CSharp.Analyzer";

export interface ProvisionResult {
  changed: boolean;
  content: string;
  reason?: string;
}

export function hasAnalyzerReference(content: string): boolean {
  const pattern = new RegExp(
    `<PackageReference\\b[^>]*\\bInclude\\s*=\\s*["']${escapeRegExp(PACKAGE_ID)}["']`,
    "i",
  );
  return pattern.test(content);
}

export function addAnalyzerReference(content: string, version: string): ProvisionResult {
  if (hasAnalyzerReference(content)) {
    return { changed: false, content, reason: "already referenced" };
  }

  const closingTag = "</Project>";
  const closingIndex = content.lastIndexOf(closingTag);
  if (closingIndex === -1) {
    return { changed: false, content, reason: "not a recognizable project file (missing </Project>)" };
  }

  const reference =
    `  <ItemGroup>\n` +
    `    <PackageReference Include="${PACKAGE_ID}" Version="${version}" PrivateAssets="all" />\n` +
    `  </ItemGroup>\n`;

  const eol = content.includes("\r\n") ? "\r\n" : "\n";
  const block = eol === "\r\n" ? reference.replace(/\n/g, "\r\n") : reference;

  const before = content.substring(0, closingIndex);
  const after = content.substring(closingIndex);
  const separator = before.endsWith(eol) ? "" : eol;
  const updated = `${before}${separator}${block}${after}`;
  return { changed: true, content: updated };
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
