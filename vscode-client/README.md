# Qualimetry C# (VS Code)

A VS Code client for the Qualimetry C# rule set. Once set up, Qualimetry findings appear in the editor
in real time as you type, the same as the SonarQube and Rider plugins. It does two things:

1. Adds the `Qualimetry.CSharp.Analyzer` NuGet package to a C# project.
2. Syncs the active rule set from a SonarQube quality profile into a local `.globalconfig`.

The analysis itself runs inside your editor's built-in C# engine (C# Dev Kit / OmniSharp / Roslyn),
which loads the `Qualimetry.CSharp.Analyzer` package automatically once it is referenced. This client's
job is to wire that package in and keep the active rule set and severities (`.globalconfig`) in step
with your SonarQube profile; it does not run a separate analysis process of its own.

When you open a C# project that does not yet reference the analyzer, the extension offers to add it so
findings start appearing as you type. Turn this off with `csharpAnalyzer.autoProvision`, or run the
commands below manually.

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

- `csharpAnalyzer.autoProvision` - offer to add the analyzer when a C# project is opened without it. Default: `true`.
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
