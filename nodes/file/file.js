/**
 * nb-file Node - Real IPFS Implementation
 * 
 * This node provides real IPFS file operations using Helia and UnixFS.
 */

module.exports = function(RED) {
  'use strict'

  // Dynamic import for ES modules
  let unixfs
  
  async function loadUnixFS() {
    if (!unixfs) {
      const unixfsModule = await import('@helia/unixfs')
      unixfs = unixfsModule.unixfs
    }
    return unixfs
  }

  function NodebitFileNode(config) {
    RED.nodes.createNode(this, config)
    
    const node = this
    
    // Store configuration
    node.config = {
      name: config.name || 'File Operations',
      operation: config.operation || 'auto',
      workspace: config.workspace
    }
    
    // Get workspace reference
    node.workspaceNode = RED.nodes.getNode(node.config.workspace)
    
    if (!node.workspaceNode) {
      node.error('No workspace configured. Please select an nb-workspace node.')
      node.status({ fill: 'red', shape: 'ring', text: 'no workspace' })
      return
    }
    
    // Initialize UnixFS interface
    node.fs = null
    
    // Check if workspace is ready and initialize
    const initializeNode = async () => {
      if (node.workspaceNode.isReady && node.workspaceNode.isReady()) {
        try {
          const workspace = node.workspaceNode.getWorkspace()
          const networks = workspace.getNetworks()
          
          // Reduced logging - only log significant events
          
          // Look for any network with a helia instance
          let heliaNetwork = null
          for (const network of networks) {
            if (network.helia) {
              heliaNetwork = network
              break
            }
          }
          
          if (heliaNetwork) {
            await loadUnixFS()
            node.fs = unixfs(heliaNetwork.helia)
            node.status({ fill: 'green', shape: 'dot', text: 'ready' })
            node.log(`IPFS ready with network: ${heliaNetwork.id}`)
          } else if (networks.length > 0) {
            node.status({ fill: 'yellow', shape: 'ring', text: 'networks found, no helia' })
            // Reduced logging - this will show in activity log instead
          } else {
            node.status({ fill: 'yellow', shape: 'ring', text: 'no networks' })
            node.log('No networks found in workspace')
            // Retry in a few seconds as networks might still be starting
            setTimeout(initializeNode, 3000)
          }
        } catch (error) {
          node.error('Failed to initialize IPFS: ' + error.message)
          node.status({ fill: 'red', shape: 'ring', text: 'init failed' })
        }
      } else {
        node.status({ fill: 'yellow', shape: 'ring', text: 'workspace starting' })
        // Wait for workspace to be ready
        setTimeout(initializeNode, 2000)
      }
    }
    
    // Listen for workspace ready event
    if (node.workspaceNode.on) {
      node.workspaceNode.on('workspace.ready', initializeNode)
    }
    
    // Initial check
    initializeNode()
    
    // Handle incoming messages
    node.on('input', async function(msg, send, done) {
      send = send || function() { node.send.apply(node, arguments) }
      done = done || function(err) { if (err) node.error(err, msg) }
      
      // Check if IPFS is ready
      if (!node.fs) {
        done(new Error('IPFS not ready. Please ensure workspace is started and has networks.'))
        return
      }
      
      try {
        const operation = msg.operation || node.config.operation
        let result
        
        // Auto-detect operation based on payload
        if (operation === 'auto') {
          if (Buffer.isBuffer(msg.payload) || typeof msg.payload === 'string') {
            // Upload operation
            result = await node.uploadFile(msg)
          } else if (typeof msg.payload === 'object' && msg.payload.cid) {
            // Download operation with CID object
            result = await node.downloadFile(msg.payload.cid, msg)
          } else if (typeof msg.payload === 'string' && msg.payload.startsWith('Qm')) {
            // Download operation with CID string
            result = await node.downloadFile(msg.payload, msg)
          } else {
            throw new Error('Cannot auto-detect operation. Please specify msg.operation or provide valid payload.')
          }
        } else if (operation === 'upload') {
          result = await node.uploadFile(msg)
        } else if (operation === 'download') {
          const cid = msg.cid || msg.payload
          result = await node.downloadFile(cid, msg)
        } else {
          throw new Error(`Unknown operation: ${operation}`)
        }
        
        send(result)
        done()
        
      } catch (error) {
        done(error)
      }
    })
    
    // Upload file to IPFS
    node.uploadFile = async function(msg) {
      let content
      let filename = msg.filename || 'uploaded-file'
      let contentType = 'application/octet-stream'
      
      // Convert payload to Uint8Array
      if (Buffer.isBuffer(msg.payload)) {
        content = new Uint8Array(msg.payload)
        contentType = msg.contentType || 'application/octet-stream'
      } else if (typeof msg.payload === 'string') {
        content = new TextEncoder().encode(msg.payload)
        contentType = 'text/plain'
        if (!msg.filename) filename = 'text-file.txt'
      } else {
        throw new Error('Payload must be Buffer or string for upload')
      }
      
      // Add file to IPFS
      const cid = await node.fs.addBytes(content)
      const cidString = cid.toString()
      
      node.log(`File uploaded to IPFS: ${cidString}`)
      
      return {
        topic: 'file.uploaded',
        payload: {
          cid: cidString,
          file: {
            name: filename,
            size: content.length,
            type: contentType
          },
          links: {
            ipfs: `https://ipfs.io/ipfs/${cidString}`,
            gateway: `https://gateway.ipfs.io/ipfs/${cidString}`
          }
        },
        _msgid: msg._msgid
      }
    }
    
    // Download file from IPFS
    node.downloadFile = async function(cid, msg) {
      if (!cid) {
        throw new Error('No CID provided for download')
      }
      
      node.log(`Downloading file from IPFS: ${cid}`)
      
      // Get file content from IPFS
      const chunks = []
      for await (const chunk of node.fs.cat(cid)) {
        chunks.push(chunk)
      }
      
      // Combine chunks
      const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0)
      const content = new Uint8Array(totalLength)
      let offset = 0
      for (const chunk of chunks) {
        content.set(chunk, offset)
        offset += chunk.length
      }
      
      // Try to detect if it's text
      let payload
      let contentType = 'application/octet-stream'
      
      try {
        // Try to decode as UTF-8 text
        const text = new TextDecoder().decode(content)
        // Check if it's valid text (no null bytes, mostly printable)
        if (!text.includes('\0') && /^[\x20-\x7E\s]*$/.test(text.slice(0, 100))) {
          payload = text
          contentType = 'text/plain'
        } else {
          payload = Buffer.from(content)
        }
      } catch (e) {
        payload = Buffer.from(content)
      }
      
      return {
        topic: 'file.downloaded',
        payload: payload,
        file: {
          cid: cid,
          size: content.length,
          type: contentType
        },
        _msgid: msg._msgid
      }
    }
    
    // Cleanup
    node.on('close', function(removed, done) {
      node.status({})
      done()
    })
  }
  
  // Register the node type
  RED.nodes.registerType('nb-file', NodebitFileNode)
}