import { ActiveRule, mapSeverity } from "./sonarqube";

export function buildGlobalConfig(rules: ActiveRule[]): string {
  const sorted = [...rules].sort((a, b) => a.ruleId.localeCompare(b.ruleId));
  const lines: string[] = [];
  lines.push("is_global = true");
  lines.push("");
  for (const rule of sorted) {
    lines.push(`dotnet_diagnostic.${rule.ruleId}.severity = ${mapSeverity(rule.severity)}`);
  }
  return lines.join("\n") + "\n";
}
