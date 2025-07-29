/**
 * HTML Generator - Main HTML generation coordination
 */

const { generateDashboardTemplate } = require('./dashboard-template');
const { generateSecurityTemplate } = require('./security-template');
const { generateClientScripts } = require('./client-scripts');

function generateAdminInterface(node) {
    return generateWorkspaceHTML(node.id, node.config.name);
}

function generateWorkspaceHTML(workspaceId, workspaceName) {
    const dashboardHTML = generateDashboardTemplate();
    const securityHTML = generateSecurityTemplate();
    const clientScripts = generateClientScripts(workspaceId);

    return `<!DOCTYPE html>
<html>
<head>
    <title>Distributed Data Dashboard - ${workspaceName}</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        ${generateBaseStyles()}
    </style>
</head>
<body>
    <div class="container">
        ${generateNavigationTabs()}
        ${dashboardHTML}
        ${generateNetworksPanel()}
        ${generateDatabasesPanel()}
        ${generateFilesPanel()}
        ${securityHTML}
    </div>
    
    <script>
        ${clientScripts}
    </script>
</body>
</html>`;
}

function generateBaseStyles() {
    return `
        body { font-family: Arial, sans-serif; margin: 0; padding: 0; background: #f5f5f5; font-size: 13px; height: 100vh; overflow: hidden; }
        .container { width: 100%; margin: 0; padding: 8px; height: calc(100vh - 16px); display: grid; grid-template-columns: 1fr; grid-template-rows: auto 1fr; gap: 8px; overflow: hidden; box-sizing: border-box; }
        .nav-tabs { background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); display: grid; grid-template-columns: repeat(5, 1fr); }
        .nav-tab { padding: 12px 20px; cursor: pointer; border-bottom: 3px solid transparent; font-size: 13px; text-align: center; }
        .nav-tab.active { background: #3498db; color: white; border-bottom-color: #2980b9; }
        .nav-tab:hover:not(.active) { background: #ecf0f1; }
        .content-panel { background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); display: grid; grid-template-columns: 1fr; grid-template-rows: 1fr; gap: 0; overflow: hidden; }
        .content-grid { display: grid; grid-template-columns: 1fr; grid-template-rows: 1fr; gap: 0; height: 100%; }
        .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; min-width: 0; }
        .stat-card { background: linear-gradient(135deg, #85c1e9, #5dade2); color: white; border-radius: 8px; text-align: center; min-width: 0; }
        .data-table { width: 100%; border-collapse: collapse; margin-top: 12px; }
        .data-table th, .data-table td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
        .data-table th { background: #f8f9fa; font-weight: 600; font-size: 12px; }
        .data-table tr:hover { background: #f8f9fa; }
        .data-table td { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .did-list-container { overflow: hidden; }
        .did-list-container .did-row { overflow: hidden; }
        #dids-container { overflow-x: hidden; }
        .did-management-area { overflow: hidden; }
        .did-list-container * { overflow-x: hidden; }
        .did-management-area * { overflow-x: hidden; }
        .data-table td.peer-id { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .data-table td.network-name { white-space: nowrap; overflow: hidden; }
        .activity-message { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; cursor: pointer; max-width: 100%; }
        .activity-row { cursor: pointer; }
        .activity-row.expanded { background: #f0f8ff; }
        .activity-details { display: none; background: #f8f9fa; border-top: 1px solid #ddd; padding: 10px; position: relative; }
        .activity-details.expanded { display: block; }
        .activity-copy-buttons { position: absolute; bottom: 8px; right: 8px; display: flex; flex-direction: column; gap: 4px; }
        .network-row { cursor: pointer; }
        .network-row.expanded { background: #f0f8ff; }
        .management-panel { display: none; background: #f8f9fa; border-top: 1px solid #ddd; }
        .management-panel.expanded { display: table-row; }
        .management-content { padding: 15px; font-size: 12px; color: #666; line-height: 1.4; }
        .status-badge { padding: 3px 6px; border-radius: 10px; font-size: 11px; font-weight: bold; }
        .status-connected { background: #d4edda; color: #155724; }
        .btn { padding: 6px 12px; border: none; border-radius: 4px; cursor: pointer; font-size: 11px; }
        .btn-primary { background: #3498db; color: white; }
        .btn:hover { opacity: 0.9; }
        .loading { text-align: center; padding: 30px; color: #666; font-size: 13px; }
    `;
}

function generateNavigationTabs() {
    return `
        <div class="nav-tabs">
            <div class="nav-tab active" onclick="showTab('overview')">Overview</div>
            <div class="nav-tab" onclick="showTab('networks')">Networks</div>
            <div class="nav-tab" onclick="showTab('databases')">Databases</div>
            <div class="nav-tab" onclick="showTab('files')">Files</div>
            <div class="nav-tab" onclick="showTab('security')">Security</div>
        </div>
    `;
}

function generateNetworksPanel() {
    return `
        <div id="networks-panel" class="content-panel" style="display:none; height:100%; max-height:100%; background:white; border-radius:8px; overflow:hidden;">
            <div style="padding:8px; display:grid; grid-template-columns:1fr; grid-template-rows:auto 1fr; gap:8px; min-height:0;">
                <div class="loading">Loading networks...</div>
                <div style="overflow-y:auto;">
                    <table class="data-table" id="networks-table" style="display:none; font-size:13px; table-layout:fixed; width:100%;">
                    <thead>
                        <tr>
                            <th style="width:110px; min-width:110px;">Network</th>
                            <th style="width:50px; min-width:50px;">Type</th>
                            <th style="width:75px; min-width:50px;">Status</th>
                            <th style="width:auto; min-width:120px;">Peer ID</th>
                            <th style="width:50px; min-width:50px;"><i class="fa fa-link" style="margin-right:4px;"></i>Peers</th>
                            <th style="width:70px; min-width:70px;">Actions</th>
                        </tr>
                    </thead>
                        <tbody id="networks-tbody">
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
}

function generateDatabasesPanel() {
    return `
        <div id="databases-panel" class="content-panel" style="display:none; height:100%; max-height:100%; background:white; border-radius:8px; overflow:hidden;">
            <div style="padding:8px; display:grid; grid-template-columns:1fr; grid-template-rows:auto 1fr; gap:8px; min-height:0;">
                <div style="padding:10px; background:#f8f9fa; border-radius:4px; font-size:13px; color:#666; overflow-y:auto;">
                    Database discovery not yet implemented
                </div>
            </div>
        </div>
    `;
}

function generateFilesPanel() {
    return `
        <div id="files-panel" class="content-panel" style="display:none; height:100%; max-height:100%; background:white; border-radius:8px; overflow:hidden;">
            <div style="padding:8px; display:grid; grid-template-columns:1fr; grid-template-rows:auto 1fr; gap:8px; min-height:0;">
                <div style="padding:10px; background:#f8f9fa; border-radius:4px; font-size:13px; color:#666; overflow-y:auto;">
                    File discovery not yet implemented
                </div>
            </div>
        </div>
    `;
}

module.exports = { generateAdminInterface };