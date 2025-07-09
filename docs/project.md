# Nodebit Project Plan

## 🎯 Overview
The Nodebit project aims to develop a comprehensive suite of Node-RED nodes for integrating OrbitDB into the Node-RED environment. This will be delivered as a single npm package (`nodebit`), exposing multiple distinct nodes in the Node-RED palette for ease of use and maintenance. Functional and technical specifications are detailed in `docs/functional.md`.
### IPFS and OrbitDB Management Strategy
Nodebit will employ a centralized strategy for IPFS and OrbitDB management. The `nodebit-connect` node will be responsible for either spinning up and managing a single, local Helia IPFS instance, or connecting to an existing external IPFS daemon. All other Nodebit nodes will then utilize the OrbitDB connections provided by this central `nodebit-connect` instance, ensuring efficient resource use and consistent decentralized data access. This design prevents individual nodes from creating their own IPFS or OrbitDB instances, promoting a robust and scalable architecture.

## 📦 Package Structure

The project will adhere to a clear and organized package structure to ensure modularity and maintainability, as detailed in `docs/functional.md`.

## 🚀 Project Milestones

The development of Nodebit will proceed through the following key milestones:

### 1. Name & Branding Setup
*   Reserve npm package `nodebit`.
*   Create GitHub organization/repository `Nodebit/nodebit`.
*   Add `LICENSE` (MIT) and initial `README.md`.

### 2. Core Node Development & Structure
*   Develop all specified Node-RED nodes (JavaScript logic and HTML UI) under their respective folders.
*   Include example flows in the `/examples` directory.
*   Set up Continuous Integration (CI) for linting, testing, and publishing workflows.

### 3. Local Testing & Publishing (v0.1)
*   Install the package locally into Node-RED using `npm link`.
*   Verify correct palette entries and core behaviors of all developed nodes.
*   Publish the first version to npm: `npm publish`.

### 4. Client Nodes for Full Workflow (v0.2)
*   Complete the implementation of read, write, and subscribe functions for OrbitDB.
*   Ensure seamless integration of the `nodebit-encrypt` utility for data encryption/decryption.
*   Update example flows to demonstrate full functional workflows.

### 5. Documentation & Community Outreach
*   Write comprehensive usage guides and flow snippets within the `README.md`.
*   Publish a blog post and create a demo showcasing use cases (e.g., chat application, KV store).
*   Announce the Nodebit project on Node-RED Forums, Discord, and other relevant community channels.

### 6. Future Enhancements
*   Implement support for OrbitDB Access Control Lists (ACL) and Decentralized Identifiers (DID).
*   Add advanced encryption workflows, including key exchange mechanisms.
*   Focus on performance improvements and scalability optimizations.
*   Develop CLI tooling to generate flows or bootstrap Nodebit projects.

## 💡 Why a Single Package?

Node-RED supports packaging multiple node types within a single npm package by specifying them under the `"node-red.nodes"` field in `package.json`. This approach simplifies installation for users, streamlines the release process, and centralizes maintenance while keeping individual nodes logically separated.

