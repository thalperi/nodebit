module.exports = function(RED) {
    const path = require('path');

    // Declare variables for dynamically imported modules
    let createHelia, tcp, webSockets, noise, yamux, identify, autoNAT, dcutr, circuitRelayTransport, createLibp2p, createHeliaHTTP, createOrbitDB, MemoryBlockstore, FsBlockstore, FsDatastore, Identities;
    let modulesLoadedPromise; // Promise to track module loading
    const { initializeIdentities, getOrCreateIdentity } = require('../utils/did-acl');

    // Perform dynamic imports when the Node-RED runtime starts
    // This ensures modules are loaded once for all nb-admin nodes
    modulesLoadedPromise = (async () => {
        try {
            ({ createHelia } = await import('helia'));
            ({ tcp } = await import('@libp2p/tcp'));
            ({ webSockets } = await import('@libp2p/websockets'));
            ({ noise } = await import('@chainsafe/libp2p-noise'));
            ({ yamux } = await import('@chainsafe/libp2p-yamux'));
            ({ identify } = await import('@libp2p/identify'));
            ({ autoNAT } = await import('@libp2p/autonat'));
            ({ dcutr } = await import('@libp2p/dcutr'));
            ({ circuitRelayTransport } = await import('@libp2p/circuit-relay-v2'));
            ({ createLibp2p } = await import('libp2p'));
            ({ http: createHeliaHTTP } = await import('@helia/http'));
            ({ createOrbitDB } = await import('@orbitdb/core'));
            ({ MemoryBlockstore } = await import('blockstore-core/memory'));
            ({ FsBlockstore } = await import('blockstore-fs'));
            ({ FsDatastore } = await import('datastore-fs'));
            return true; // Modules loaded successfully
        } catch (e) {
            RED.log.error(`[nb-admin] Failed to load IPFS/OrbitDB modules: ${e.message}`);
            return false; // Modules failed to load
        }
    })();

    function NodebitAdminNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        node.heliaRepoPath = config.heliaRepoPath || './helia-repo-admin'; // Default path for admin's Helia
        node.heliaSwarmPort = config.heliaSwarmPort || '';
        node.heliaApiPort = config.heliaApiPort || '';
        node.orbitDbPath = config.orbitDbPath || './orbitdb-admin'; // Default path for admin's OrbitDB

        node.ipfs = null;
        node.orbitdb = null;

        async function startHelia() {
            try {
                node.status({fill:"blue",shape:"dot",text:"starting Helia..."});

                const loaded = await modulesLoadedPromise;
                if (!loaded) {
                    throw new Error("IPFS/OrbitDB modules not loaded. Check Node-RED logs for import errors.");
                }
 
                const blockstore = new FsBlockstore(path.join(RED.settings.userDir, node.heliaRepoPath, 'blockstore'));
                const datastore = new FsDatastore(path.join(RED.settings.userDir, node.heliaRepoPath, 'datastore'));
 
                const libp2pConfig = {
                    transports: [
                        tcp(),
                        webSockets(),
                        circuitRelayTransport()
                    ],
                    connectionEncryption: [noise()],
                    streamMuxers: [yamux()],
                    peerDiscovery: [],
                    services: {
                        identify: identify(),
                        autoNAT: autoNAT(),
                        dcutr: dcutr()
                    }
                };
 
                if (node.heliaSwarmPort) {
                    libp2pConfig.addresses = {
                        listen: [`/ip4/0.0.0.0/tcp/${node.heliaSwarmPort}/ws`]
                    };
                }
 
                node.ipfs = await createHelia({
                    libp2p: await createLibp2p(libp2pConfig),
                    blockstore,
                    datastore
                });
 
                if (node.heliaApiPort) {
                    const api = createHeliaHTTP(node.ipfs);
                    await api.start({ port: node.heliaApiPort });
                    node.log(`Helia HTTP API listening on port ${node.heliaApiPort}`);
                }

                node.status({fill:"green",shape:"dot",text:"Helia started"});
                node.log(`Helia ID: ${node.ipfs.libp2p.peerId.toString()}`);
            } catch (error) {
                node.status({fill:"red",shape:"ring",text:"Helia error"});
                node.error(`Failed to start Helia: ${error.message}`);
            }
        }

        async function initOrbitDB() {
            try {
                node.status({fill:"blue",shape:"dot",text:"initializing OrbitDB..."});
                const loaded = await modulesLoadedPromise;
                if (!loaded || !createOrbitDB) {
                    throw new Error("OrbitDB module not loaded. Check Node-RED logs for import errors.");
                }
                if (!node.ipfs) {
                    throw new Error("Helia IPFS instance not available for OrbitDB initialization.");
                }
                
                // Initialize Identities for this node
                const identities = await initializeIdentities(RED, node.heliaRepoPath);
                const identity = await getOrCreateIdentity(identities, `nb-admin-${node.id}`); // Use node ID for unique identity

                node.orbitdb = await createOrbitDB({
                    ipfs: node.ipfs,
                    directory: path.join(RED.settings.userDir, node.orbitDbPath),
                    identities: identities,
                    id: identity.id
                });
                node.status({fill:"green",shape:"dot",text:"OrbitDB initialized"});
                node.log("OrbitDB initialized successfully.");
            } catch (error) {
                node.status({fill:"red",shape:"ring",text:"OrbitDB error"});
                node.error(`Failed to initialize OrbitDB: ${error.message}`);
            }
        }

        // Start Helia and OrbitDB when the node is deployed
        startHelia().then(() => {
            initOrbitDB();
        });

        node.on('close', async function(done) {
            node.status({fill:"blue",shape:"dot",text:"closing..."});
            if (node.orbitdb) {
                node.log("Stopping OrbitDB...");
                await node.orbitdb.stop();
                node.log("OrbitDB stopped.");
            }
            if (node.ipfs) {
                node.log("Stopping Helia IPFS...");
                await node.ipfs.stop();
                node.log("Helia IPFS stopped.");
            }
            node.status({});
            done();
        });

        // Endpoint to check Helia status for nb-admin
        RED.httpAdmin.get("/nodebit-admin-helia-status", RED.auth.needsPermission("nb-admin.read"), function(req, res) {
            if (node.ipfs) {
                res.json({ running: true, peerId: node.ipfs.libp2p.peerId.toString() });
            } else {
                res.json({ running: false });
            }
        });

    }
    RED.nodes.registerType("nb-admin", NodebitAdminNode);

    // Endpoint to start Helia
    RED.httpAdmin.post("/nodebit-admin-start-helia", RED.auth.needsPermission("nb-admin.write"), async function(req, res) {
        try {
            const adminNode = RED.nodes.getNode(req.body.id);
            if (adminNode) {
                await adminNode.startHelia(); // Call the startHelia function on the specific node instance
                res.json({ message: "Helia started successfully." });
            } else {
                res.status(404).json({ error: "Admin node not found." });
            }
        } catch (error) {
            RED.log.error(`[nb-admin] Failed to start Helia: ${error.message}`);
            res.status(500).json({ error: `Failed to start Helia: ${error.message}` });
        }
    });

    // Endpoint to stop Helia
    RED.httpAdmin.post("/nodebit-admin-stop-helia", RED.auth.needsPermission("nb-admin.write"), async function(req, res) {
        try {
            const adminNode = RED.nodes.getNode(req.body.id);
            if (adminNode) {
                if (adminNode.orbitdb) {
                    await adminNode.orbitdb.stop();
                    adminNode.orbitdb = null;
                }
                if (adminNode.ipfs) {
                    await adminNode.ipfs.stop();
                    adminNode.ipfs = null;
                }
                res.json({ message: "Helia stopped successfully." });
            } else {
                res.status(404).json({ error: "Admin node not found." });
            }
        } catch (error) {
            RED.log.error(`[nb-admin] Failed to stop Helia: ${error.message}`);
            res.status(500).json({ error: `Failed to stop Helia: ${error.message}` });
        }
    });
}