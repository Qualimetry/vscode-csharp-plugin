export interface QualityProfile {
  key: string;
  name: string;
  language: string;
}

export interface ActiveRule {
  ruleId: string;
  severity: string;
}

interface ProfileSearchResponse {
  profiles?: Array<{ key?: string; name?: string; language?: string }>;
}

interface RuleSearchResponse {
  total?: number;
  p?: number;
  ps?: number;
  rules?: Array<{ key?: string; severity?: string }>;
  actives?: Record<string, Array<{ severity?: string }>>;
}

const RULE_REPOSITORY = "roslyn.qualimetry-csharp";
const LANGUAGE = "cs";
const PAGE_SIZE = 500;

function authHeader(token: string): string {
  const raw = `${token}:`;
  return `Basic ${Buffer.from(raw, "utf8").toString("base64")}`;
}

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/+$/, "");
}

async function getJson<T>(url: string, token: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      Authorization: authHeader(token),
      Accept: "application/json",
    },
  });
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    const detail = body ? `: ${body}` : "";
    throw new Error(`SonarQube request failed (${response.status} ${response.statusText})${detail}`);
  }
  const text = await response.text();
  return JSON.parse(text) as T;
}

export async function findProfileKey(
  baseUrl: string,
  token: string,
  profileName: string,
): Promise<string> {
  const root = normalizeBaseUrl(baseUrl);
  const url = `${root}/api/qualityprofiles/search?language=${LANGUAGE}`;
  const data = await getJson<ProfileSearchResponse>(url, token);
  const profiles = data.profiles ?? [];
  const match = profiles.find((p) => p.language === LANGUAGE && p.name === profileName && !!p.key);
  if (!match || !match.key) {
    throw new Error(`No SonarQube C# quality profile named "${profileName}" was found.`);
  }
  return match.key;
}

export async function fetchActiveRules(
  baseUrl: string,
  token: string,
  profileKey: string,
): Promise<ActiveRule[]> {
  const root = normalizeBaseUrl(baseUrl);
  const collected: ActiveRule[] = [];
  let page = 1;

  for (;;) {
    const url =
      `${root}/api/rules/search?activation=true&qprofile=${encodeURIComponent(profileKey)}` +
      `&languages=${LANGUAGE}&repositories=${RULE_REPOSITORY}&ps=${PAGE_SIZE}&p=${page}`;
    const data = await getJson<RuleSearchResponse>(url, token);
    const rules = data.rules ?? [];
    if (rules.length === 0) {
      break;
    }

    for (const rule of rules) {
      const ruleId = extractRuleId(rule.key);
      if (!ruleId) {
        continue;
      }
      const activeSeverity = data.actives?.[rule.key ?? ""]?.[0]?.severity;
      const severity = activeSeverity ?? rule.severity ?? "MAJOR";
      collected.push({ ruleId, severity });
    }

    const total = data.total ?? collected.length;
    const seen = (data.p ?? page) * (data.ps ?? PAGE_SIZE);
    if (seen >= total) {
      break;
    }
    page += 1;
  }

  return collected;
}

function extractRuleId(ruleKey: string | undefined): string | undefined {
  if (!ruleKey) {
    return undefined;
  }
  const afterRepo = ruleKey.includes(":") ? ruleKey.substring(ruleKey.indexOf(":") + 1) : ruleKey;
  return /^qa_[a-z0-9_]+$/.test(afterRepo) ? afterRepo : undefined;
}

export function mapSeverity(sonarSeverity: string): "warning" | "suggestion" | "silent" {
  switch (sonarSeverity.toUpperCase()) {
    case "BLOCKER":
    case "CRITICAL":
    case "MAJOR":
      return "warning";
    case "MINOR":
      return "suggestion";
    case "INFO":
      return "silent";
    default:
      return "warning";
  }
}
