/**
 * nb-database Node - Simplified Version
 * 
 * This is a simplified version that demonstrates the interface without OrbitDB dependencies.
 */

module.exports = function(RED) {
  'use strict'

  function NodebitDatabaseNode(config) {
    RED.nodes.createNode(this, config)
    
    const node = this
    
    // Store configuration
    node.config = {
      name: config.name || 'Database Operations',
      operation: config.operation || 'auto',
      workspace: config.workspace,
      databaseName: config.databaseName || '',
      databaseType: config.databaseType || 'documents'
    }
    
    // Get workspace reference
    node.workspaceNode = RED.nodes.getNode(node.config.workspace)
    
    if (!node.workspaceNode) {
      node.error('No workspace configured. Please select an nb-workspace node.')
      node.status({ fill: 'red', shape: 'ring', text: 'no workspace' })
      return
    }
    
    // Check if workspace is ready
    if (node.workspaceNode.isReady && node.workspaceNode.isReady()) {
      node.status({ fill: 'green', shape: 'dot', text: 'ready (demo)' })
    } else {
      node.status({ fill: 'yellow', shape: 'ring', text: 'workspace starting' })
      // Wait for workspace to be ready
      setTimeout(() => {
        if (node.workspaceNode.isReady && node.workspaceNode.isReady()) {
          node.status({ fill: 'green', shape: 'dot', text: 'ready (demo)' })
        }
      }, 2000)
    }
    
    // Simple in-memory database simulation
    node.mockDatabase = new Map()
    
    // Handle incoming messages
    node.on('input', function(msg, send, done) {
      send = send || function() { node.send.apply(node, arguments) }
      done = done || function(err) { if (err) node.error(err, msg) }
      
      try {
        const operation = msg.operation || node.config.operation
        
        let result
        
        switch (operation) {
          case 'create':
            const dbName = msg.databaseName || node.config.databaseName || 'demo-db'
            const mockAddress = `/orbitdb/Qm${Math.random().toString(36).substr(2, 44)}/${dbName}`
            
            result = {
              topic: 'database.created',
              payload: {
                name: dbName,
                address: mockAddress,
                type: node.config.databaseType,
                demo: true,
                created: new Date().toISOString()
              },
              _msgid: msg._msgid
            }
            break
            
          case 'write':
            if (msg.payload) {
              const id = Date.now().toString()
              node.mockDatabase.set(id, msg.payload)
              
              result = {
                topic: 'database.written',
                payload: {
                  id: id,
                  data: msg.payload,
                  demo: true
                },
                _msgid: msg._msgid
              }
            }
            break
            
          case 'read':
            const allData = Array.from(node.mockDatabase.entries()).map(([id, data]) => ({
              id,
              ...data
            }))
            
            result = {
              topic: 'database.read',
              payload: allData,
              database: {
                demo: true,
                type: node.config.databaseType
              },
              _msgid: msg._msgid
            }
            break
            
          default:
            // Auto-detect
            if (msg.payload && typeof msg.payload === 'object') {
              // Assume write
              const id = Date.now().toString()
              node.mockDatabase.set(id, msg.payload)
              
              result = {
                topic: 'database.written',
                payload: {
                  id: id,
                  data: msg.payload,
                  demo: true
                },
                _msgid: msg._msgid
              }
            } else {
              // Assume read
              const allData = Array.from(node.mockDatabase.entries()).map(([id, data]) => ({
                id,
                ...data
              }))
              
              result = {
                topic: 'database.read',
                payload: allData,
                database: {
                  demo: true,
                  type: node.config.databaseType
                },
                _msgid: msg._msgid
              }
            }
            break
        }
        
        send(result)
        done()
        
      } catch (error) {
        done(error)
      }
    })
    
    // Cleanup
    node.on('close', function(removed, done) {
      node.status({})
      done()
    })
  }
  
  // Register the node type
  RED.nodes.registerType('nb-database', NodebitDatabaseNode)
}