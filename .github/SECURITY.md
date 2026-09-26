# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in this project, please report it responsibly.

**Do NOT open a public issue.**

Instead, please use [GitHub's private vulnerability reporting](https://github.com/yh-catalysis/Web2MarkdownWithTags/security/advisories/new).

I will acknowledge receipt within 48 hours and aim to provide a fix or mitigation plan within 7 days.

## Supported Versions

Only the latest release is supported with security updates.

## Security Practices

- All CI/CD actions are pinned by commit SHA
- Renovate keeps dependencies up to date, and proposes a new npm release only after it has been public for three days
- `.github/dependabot.yml` is a fallback that keeps GitHub Actions up to date in copies of this repository where Renovate is not installed (for example, ones created with the Deploy to Cloudflare button)
- The dependency graph, Dependabot alerts and malware alerts are enabled
- Secret scanning and push protection are enabled
- Code scanning with CodeQL (default setup) checks the TypeScript code and the GitHub Actions workflows on every push and pull request to `main`, and once a week
