# Qualimetry C# (VS Code)

A thin VS Code client for the Qualimetry C# rule set. It does two things and nothing else:

1. Adds the `Qualimetry.CSharp.Analyzer` NuGet package to a C# project.
2. Syncs the active rule set from a SonarQube quality profile into a local `.globalconfig`.

This client does not analyze code itself. Analysis is performed by the `Qualimetry.CSharp.Analyzer`
package (Roslyn analyzers) once it is referenced by your project and loaded by the C# Dev Kit / Roslyn
host. The `.globalconfig` only controls which rules are active and at what severity.

## Commands

- **Qualimetry: Add C# analyzer to project** (`csharp.provisionAnalyzer`)
  Finds the nearest `.csproj` (or lets you pick one) and adds a `PackageReference` for
  `Qualimetry.CSharp.Analyzer` with `PrivateAssets="all"`, if it is not already present. It never
  duplicates an existing reference.

- **Qualimetry: Sync rules from SonarQube profile** (`csharp.syncProfile`)
  Reads the active `qualimetry-csharp` rules from the configured SonarQube quality profile and writes a
  `.globalconfig` (with `is_global = true`) at the workspace root. Each active `QCS####` rule becomes a
  `dotnet_diagnostic.QCS####.severity` entry.

## Settings

- `csharpAnalyzer.sonarqube.url` - base URL of the SonarQube server.
- `csharpAnalyzer.sonarqube.token` - SonarQube user token. Sent as the Basic auth username with an empty
  password.
- `csharpAnalyzer.profileName` - name of the quality profile to sync from. Default: `Qualimetry C#`.
- `csharpAnalyzer.analyzerVersion` - version of the analyzer NuGet to reference. Default: `1.0.3`.

## Severity mapping

SonarQube severities are mapped to `.globalconfig` severities:

- `BLOCKER`, `CRITICAL`, `MAJOR` -> `warning`
- `MINOR` -> `suggestion`
- `INFO` -> `silent`

## Build

```
npm install
npm run compile
```

`npm run compile` runs `tsc -p ./` and emits JavaScript to `out/`.

## Notes

- No telemetry is collected.
- Errors surface as VS Code error notifications; a successful run shows a single info notification.
