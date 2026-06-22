import * as vscode from "vscode";
import * as path from "path";
import { addAnalyzerReference, hasAnalyzerReference } from "./csproj";
import { buildGlobalConfig } from "./globalconfig";
import { fetchActiveRules, findProfileKey } from "./sonarqube";

const AUTO_PROVISION_SUPPRESSED = "csharpAnalyzer.autoProvisionSuppressed";

export function activate(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.commands.registerCommand("csharp.provisionAnalyzer", () => provisionAnalyzer()),
    vscode.commands.registerCommand("csharp.syncProfile", () => syncProfile()),
  );
  void maybeAutoProvision(context);
}

async function maybeAutoProvision(context: vscode.ExtensionContext): Promise<void> {
  try {
    if (!vscode.workspace.workspaceFolders?.length) {
      return;
    }
    if (context.workspaceState.get<boolean>(AUTO_PROVISION_SUPPRESSED)) {
      return;
    }
    if (!vscode.workspace.getConfiguration("csharpAnalyzer").get<boolean>("autoProvision", true)) {
      return;
    }

    const candidates = await vscode.workspace.findFiles("**/*.csproj", "**/node_modules/**");
    if (candidates.length === 0) {
      return;
    }
    for (const uri of candidates) {
      const text = Buffer.from(await vscode.workspace.fs.readFile(uri)).toString("utf8");
      if (hasAnalyzerReference(text)) {
        return;
      }
    }

    const add = "Add analyzer";
    const dismiss = "Not now";
    const never = "Don't ask again";
    const choice = await vscode.window.showInformationMessage(
      "Qualimetry C#: add the analyzer to this project so findings appear as you type?",
      add,
      dismiss,
      never,
    );
    if (choice === add) {
      await provisionAnalyzer();
    } else if (choice === never) {
      await context.workspaceState.update(AUTO_PROVISION_SUPPRESSED, true);
    }
  } catch {
    // Best effort: never disrupt editor startup if discovery fails.
  }
}

export function deactivate(): void {
  // no-op
}

async function provisionAnalyzer(): Promise<void> {
  try {
    const target = await pickProjectFile();
    if (!target) {
      return;
    }

    const config = vscode.workspace.getConfiguration("csharpAnalyzer");
    const version = config.get<string>("analyzerVersion", "1.0.9");

    const original = Buffer.from(await vscode.workspace.fs.readFile(target)).toString("utf8");
    const result = addAnalyzerReference(original, version);

    if (!result.changed) {
      vscode.window.showInformationMessage(
        `Qualimetry analyzer is already present in ${path.basename(target.fsPath)} (${result.reason}).`,
      );
      return;
    }

    await vscode.workspace.fs.writeFile(target, Buffer.from(result.content, "utf8"));
    vscode.window.showInformationMessage(
      `Added Qualimetry.CSharp.Analyzer ${version} to ${path.basename(target.fsPath)}.`,
    );
  } catch (error) {
    vscode.window.showErrorMessage(`Provision analyzer failed: ${describe(error)}`);
  }
}

async function syncProfile(): Promise<void> {
  try {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      vscode.window.showErrorMessage("Open a workspace folder before syncing rules.");
      return;
    }

    const config = vscode.workspace.getConfiguration("csharpAnalyzer");
    const url = (config.get<string>("sonarqube.url", "") ?? "").trim();
    const token = (config.get<string>("sonarqube.token", "") ?? "").trim();
    const profileName = (config.get<string>("profileName", "Qualimetry C#") ?? "").trim();

    if (!url) {
      vscode.window.showErrorMessage("Set csharpAnalyzer.sonarqube.url before syncing rules.");
      return;
    }
    if (!token) {
      vscode.window.showErrorMessage("Set csharpAnalyzer.sonarqube.token before syncing rules.");
      return;
    }

    const profileKey = await findProfileKey(url, token, profileName);
    const rules = await fetchActiveRules(url, token, profileKey);

    if (rules.length === 0) {
      vscode.window.showErrorMessage(
        `Profile "${profileName}" returned no active qualimetry-csharp rules.`,
      );
      return;
    }

    const content = buildGlobalConfig(rules);
    const target = vscode.Uri.joinPath(workspaceFolder.uri, ".globalconfig");
    await vscode.workspace.fs.writeFile(target, Buffer.from(content, "utf8"));

    vscode.window.showInformationMessage(
      `Synced ${rules.length} rules from "${profileName}" into .globalconfig.`,
    );
  } catch (error) {
    vscode.window.showErrorMessage(`Sync rules failed: ${describe(error)}`);
  }
}

async function pickProjectFile(): Promise<vscode.Uri | undefined> {
  const candidates = await vscode.workspace.findFiles("**/*.csproj", "**/node_modules/**");
  if (candidates.length === 0) {
    vscode.window.showErrorMessage("No .csproj file was found in the workspace.");
    return undefined;
  }

  const nearest = nearestToActiveEditor(candidates);
  if (nearest) {
    return nearest;
  }

  if (candidates.length === 1) {
    return candidates[0];
  }

  const picked = await vscode.window.showQuickPick(
    candidates.map((uri) => ({ label: path.basename(uri.fsPath), description: uri.fsPath, uri })),
    { placeHolder: "Select the C# project to add the Qualimetry analyzer to" },
  );
  return picked?.uri;
}

function nearestToActiveEditor(candidates: vscode.Uri[]): vscode.Uri | undefined {
  const active = vscode.window.activeTextEditor?.document.uri;
  if (!active) {
    return undefined;
  }
  const activeDir = path.dirname(active.fsPath);

  let best: vscode.Uri | undefined;
  let bestLength = -1;
  for (const candidate of candidates) {
    const candidateDir = path.dirname(candidate.fsPath);
    if (isWithin(candidateDir, activeDir) && candidateDir.length > bestLength) {
      best = candidate;
      bestLength = candidateDir.length;
    }
  }
  return best;
}

function isWithin(parentDir: string, childDir: string): boolean {
  const relative = path.relative(parentDir, childDir);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function describe(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
