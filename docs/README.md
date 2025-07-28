# AI Agent Instructions - Prime Directive

**When engaging in any conversations via chat or whenever updating any documentation, you must:**
- Follow all documented preferences and guidelines without exception
- Avoid frivolous language like "Perfect", "Excellent", "Finished", "Complete", "Working", "Operational"
- Prioritize user observations over theoretical analysis
- Verify issues rather than assume problems exist
- Maintain professional, direct communication focused on facts
- Respect established documentation structure and organization
- Throughout the entire development lifecycle, always propose modifications to the documentation structure affecting even folders, files, logical layout, and compositional formatting, to ensure it always best reflects the current and actual codebase
- **DO NOT create new documentation files without explicit user permission** - Use only the existing documentation structure provided by the user
- **Testing Capability**: You can start and manage your own Node-RED instance on port 1881 for testing purposes, as the user will always occupy the default port 1880. Use this dedicated testing environment to:
  - Start `node-red -p 1881` when needed for testing
  - Use API endpoints to test functionality and verify changes
  - Kill the instance when testing is complete
  - Leverage curl commands and other API tools to validate dashboard features, theming, and functionality
  - Test nodebit nodes and workspace functionality without interfering with the user's development workflow

---

# Nodebit Documentation & Development Guide

**Warning: Nodebit is in early development. Most features are incomplete, experimental, or may not work as expected.**

This documentation is organized to help contributors, developers, and users find accurate, up-to-date information. We aim for honesty and clarity, not self-promotion. If something is missing or unclear, it probably means it hasn't been built yet.

> **For new users**: Start with the [main README](../README.md) for an overview, then return here for technical details and development information.

## 📚 Documentation Structure

### General (Project Management & Development)
- [Status](./general/status.md): Current system status and what actually works
- [Tasks](./general/tasks.md): What needs to be done and current priorities
- [Session](./general/session.md): Current session focus and immediate context


### Technical (Specifications & Design)
- [Architecture Guide](./technical/architecture.md): Planned and current technical design
- [Node Roles](./technical/node-roles.md): Node types and responsibilities
- [Files & Storage](./technical/files.md): File handling and storage details
- [DID Management Guide](./technical/did-management-guide.md)
- [IPFS Configuration](./technical/ipfs-configuration.md)
- [Network Selection Strategy](./technical/network-selection-strategy.md)
- [CSS Grid Security Guide](./technical/css-grid-security-guide.md)
- [Security Tab Layout Analysis](./technical/security-tab-layout-analysis.md)

### Reference (APIs, Guides, Examples)
- [Getting Started Guide](./getting-started.md): Basic setup and demo usage
- [Troubleshooting Guide](./reference/troubleshooting-guide.md)

- [Security Grid Changelog](./reference/security-grid-changelog.md)
- [Node-RED Documentation](https://nodered.org/docs/) - Official Node-RED documentation and API reference
- [Examples](./reference/examples/)
- [Guides](./reference/guides/)

## 🗂️ Documentation Principles

- **Accuracy:** Reflects actual implementation, not aspirations
- **Modesty:** Avoids self-praise and overstatement
- **Clarity:** Links to canonical sources, avoids duplication
- **Maintenance:** Updated as features are built, not before
- **Reality:** If in doubt, assume a feature is incomplete
- **Cross-Reference:** Links to main README for user-facing information

## 🔍 Development Environment

For detailed development information including the activity logging system, see **[Development Guide](technical/development-guide.md)**.

## ⚠️ Important Notice

This is early-stage software. Many features are planned but not yet implemented. Only basic workspace functionality may exist. Use at your own risk and expect frequent changes.