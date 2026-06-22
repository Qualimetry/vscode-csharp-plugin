# Qualimetry C# - VS Code Extension

[![CI](https://github.com/Qualimetry/vscode-csharp-plugin/actions/workflows/ci.yml/badge.svg)](https://github.com/Qualimetry/vscode-csharp-plugin/actions/workflows/ci.yml)

A VS Code extension for the Qualimetry C# rule set. Once set up, Qualimetry findings appear in the editor in real time as you type. The analysis runs inside the C# tooling you already use (C# Dev Kit / OmniSharp / Roslyn); this extension wires the Qualimetry analyzer into your project and syncs the active rule set so those findings show up as you work.

Powered by the same analysis engine as the [Qualimetry C# plugin for SonarQube](https://github.com/Qualimetry/sonarqube-csharp-plugin) and the [Qualimetry C# plugin for Rider](https://github.com/Qualimetry/rider-csharp-plugin).

## What it does

- **Works on open** - when you open a C# project that does not yet reference the analyzer, the extension offers to add it. Accept once and findings start appearing as you type. You can turn this off with `csharpAnalyzer.autoProvision`, or run the command below manually.
- **Add C# analyzer to project** - adds the `Qualimetry.CSharp.Analyzer` NuGet `PackageReference` to a selected `.csproj`, so the C# compiler runs the analyzer and surfaces diagnostics in the editor.
- **Sync rules from SonarQube profile** - reads the active rules and severities from a SonarQube quality profile and writes a `.globalconfig` at the workspace root, so the locally enabled rule set matches your server profile.

Analysis is performed by the Roslyn analyzer once the NuGet is referenced; this extension provisions and configures it for you.

## Settings

| Setting | Description |
|---------|-------------|
| `csharpAnalyzer.autoProvision` | Offer to add the analyzer when a C# project is opened without it. Defaults to `true`. |
| `csharpAnalyzer.sonarqube.url` | Base URL of the SonarQube server. |
| `csharpAnalyzer.sonarqube.token` | SonarQube user token (sent as the Basic auth username with an empty password). |
| `csharpAnalyzer.profileName` | Quality profile to sync from. Defaults to `Qualimetry C#`. |
| `csharpAnalyzer.analyzerVersion` | Version of the `Qualimetry.CSharp.Analyzer` package to reference. |

## Rule set

The rule set covers **210 C# rules** across eight categories:

| Category | Rules |
| --- | ---: |
| Code Quality | 109 |
| Style | 45 |
| Metrics | 17 |
| Naming | 16 |
| Reliability | 10 |
| Unity | 8 |
| Contract | 3 |
| Interop | 2 |
| **Total** | **210** |

Rule keys and severities align with the SonarQube plugin and the Rider plugin, so findings are directly comparable across CI and both editors.

## Also available

- **[SonarQube plugin](https://github.com/Qualimetry/sonarqube-csharp-plugin)** - rules and quality profiles for your CI quality gate.
- **[Rider plugin](https://github.com/Qualimetry/rider-csharp-plugin)** - the same provisioning and rule sync inside JetBrains Rider.

## Building from source

Requires Node.js 20+.

```bash
npm install
npm run compile
```

## Contributing

Issues and feature requests are welcome. This project does not accept pull requests, commits, or other code contributions from third parties; the repository is maintained by the Qualimetry team only.

## License

Licensed under the [Apache License, Version 2.0](https://www.apache.org/licenses/LICENSE-2.0).

Copyright 2026 SHAZAM Analytics Ltd
