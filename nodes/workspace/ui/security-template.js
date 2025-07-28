/**
 * Security Template - Security tab HTML generation
 */

function generateSecurityTemplate() {
    return `
        <div id="security-panel" class="content-panel" style="display:none; height:100%; max-height:100%; background:white; border-radius:8px; overflow:hidden;">
            <div style="background:#3498db; color:white; padding:8px 12px; border-radius:8px 8px 0 0;">
                <h3 style="margin:0; font-size:16px;">Security Management</h3>
            </div>
            
            <div style="
                display: grid;
                grid-template-columns: 1fr 198px;
                grid-template-rows: auto auto;
                gap: 12px;
                padding: 12px;
                background: #f8f9fa;
                flex: 1;
                min-height: 0;
                overflow-y: auto;
            ">
                ${generateDIDManagementArea()}
                ${generateACLManagementArea()}
                ${generateSystemStatusSidebar()}
            </div>
        </div>
    `;
}

function generateDIDManagementArea() {
    return `
        <!-- DID Management Area - Grid Position: Column 1, Row 1 -->
        <div class="did-management-area" style="grid-column: 1; grid-row: 1; min-height: 720px; overflow: hidden;">
            ${generateDIDContainer()}
        </div>
    `;
}

function generateACLManagementArea() {
    return `
        <!-- ACL Management Area - Grid Position: Column 1, Row 2 -->
        <div class="acl-management-area" style="grid-column: 1; grid-row: 2; min-height: 450px;">
            <div style="background:#fff; border:1px solid #ddd; border-radius:4px; display:grid; grid-template-rows:auto 1fr; height:100%;">
                <div style="background:#f8f9fa; padding:8px 12px; border-bottom:1px solid #ddd; font-weight:bold; font-size:14px;">
                    <i class="fa fa-shield-alt" style="margin-right:6px;"></i>Access Control Lists (ACLs)
                </div>
                <div style="display: grid; grid-template-columns: 200px 200px 1fr; gap: 8px; padding: 10px;">
                    ${generateACLUsersComponent()}
                    ${generateACLResourcesComponent()}
                    ${generateACLPermissionsComponent()}
                </div>
            </div>
        </div>
    `;
}

function generateDIDContainer() {
    return `
        <div style="background:#fff; border:1px solid #ddd; border-radius:4px; display:grid; grid-template-rows:auto auto 1fr; height:100%; overflow:hidden;">
            <div style="background:#f8f9fa; padding:8px 12px; border-bottom:1px solid #ddd; font-weight:bold; font-size:14px;">
                <i class="fa fa-id-card" style="margin-right:6px;"></i>Decentralized Identifiers (DIDs)
            </div>
            <div style="padding:10px;">
                ${generateDIDCreationForm()}
            </div>
            <div class="did-list-container" style="padding:0 10px 10px 10px; display:grid; grid-template-rows:1fr;">
                ${generateDIDList()}
            </div>
        </div>
    `;
}

function generateDIDCreationForm() {
    return `
        <div style="display:flex; gap:8px; margin-bottom:10px;">
            <input type="text" id="new-did-id" placeholder="Username (e.g., thalperi)" style="flex:1; padding:6px; border:1px solid #ddd; border-radius:3px; font-size:12px;">
            <button onclick="createNewDID()" class="btn btn-primary" style="font-size:12px;">New</button>
        </div>
        <div style="display:flex; gap:8px; margin-bottom:10px; align-items:center;">
            <input type="text" id="did-search" placeholder="Search DIDs..." style="flex:1; padding:6px; border:1px solid #ddd; border-radius:3px; font-size:12px;">
            <button onclick="clearDIDSearch()" class="btn" style="font-size:12px; background:#6c757d; color:white; padding:6px 8px;">Clear</button>
        </div>
    `;
}

function generateDIDList() {
    return `
        <div id="dids-container" style="overflow-y:auto; overflow-x:hidden; border:1px solid #eee; border-radius:3px; min-width:0; width:100%; display:grid; grid-template-rows:auto 1fr; height:100%;">
            <div style="padding:4px 8px; background:#f8f9fa; border-bottom:1px solid #ddd; font-size:11px; font-weight:bold; display:grid; grid-template-columns:70px 70px 1fr 50px; gap:6px; align-items:center; min-width:0; width:100%; overflow:hidden;">
                <div style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">User</div>
                <div style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">Created</div>
                <div style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">Identifier</div>
                <div style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">Status</div>
            </div>
            <div id="dids-list" style="overflow-y: auto;">
                <div style="padding:10px; color:#666; text-align:center; font-size:12px;">Loading DIDs...</div>
            </div>
        </div>
    `;
}

function generateACLUsersComponent() {
    return `
        <!-- ACL Users Component - Grid Position: Column 1 -->
        <div style="background: white; border: 1px solid #ddd; border-radius: 4px; overflow: hidden; height: 100%;">
            <div style="background: #f8f9fa; padding: 8px 12px; border-bottom: 1px solid #ddd; font-weight: bold; font-size: 12px; color: #2c3e50;">
                <i class="fa fa-users" style="margin-right:6px;"></i>Users
            </div>
            <div style="padding: 8px; height: calc(100% - 40px); overflow-y: auto; font-size: 11px;" id="acl-users-list">
                <div style="padding:10px; color:#666; text-align:center; font-size:11px;">Loading users...</div>
            </div>
        </div>
    `;
}

function generateACLResourcesComponent() {
    return `
        <!-- ACL Resources Component - Grid Position: Column 2 -->
        <div style="background: white; border: 1px solid #ddd; border-radius: 4px; overflow: hidden; height: 100%;">
            <div style="background: #f8f9fa; padding: 8px 12px; border-bottom: 1px solid #ddd; font-weight: bold; font-size: 12px; color: #2c3e50;">
                <i class="fa fa-database" style="margin-right:6px;"></i>Resources
            </div>
            <div style="padding: 8px; height: calc(100% - 40px); overflow-y: auto; font-size: 11px;" id="acl-resources-list">
                <div style="padding:10px; color:#666; text-align:center; font-size:11px;">Select a user first</div>
            </div>
        </div>
    `;
}

function generateACLPermissionsComponent() {
    return `
        <!-- ACL Permissions Component - Grid Position: Column 3 -->
        <div style="background: white; border: 1px solid #ddd; border-radius: 4px; overflow: hidden; height: 100%;">
            <div style="background: #f8f9fa; padding: 8px 12px; border-bottom: 1px solid #ddd; font-weight: bold; font-size: 12px; color: #2c3e50;">
                <i class="fa fa-shield" style="margin-right:6px;"></i>Permissions
                <span id="selected-context" style="font-weight:normal; font-size:10px; color:#666; margin-left:8px;"></span>
            </div>
            <div style="padding: 8px; height: calc(100% - 40px); overflow-y: auto; font-size: 11px;" id="acl-permissions-panel">
                <div style="padding:10px; color:#666; text-align:center; font-size:11px;">Select user and resource</div>
            </div>
        </div>
    `;
}


// Removed duplicate function - using the one below with proper grid positioning

function generateSystemStatusCard() {
    return `
        <div style="background:#fff; border:1px solid #ddd; border-radius:4px; margin-bottom:10px;">
            <div style="background:#f8f9fa; padding:8px 12px; border-bottom:1px solid #ddd; font-weight:bold; font-size:14px;">
                <i class="fa fa-cogs" style="margin-right:6px;"></i>System Status
            </div>
            <div style="padding:10px; font-size:12px;">
                <div style="margin-bottom:8px;">
                    <strong>DID/ACL System:</strong> <span id="did-system-status" style="color:#27ae60;">Initializing...</span>
                </div>
                <div style="margin-bottom:8px;">
                    <strong>Admin Identity:</strong> <span id="admin-identity" style="font-family:monospace; font-size:10px;">Loading...</span>
                </div>
                <div style="margin-bottom:8px;">
                    <strong>System OrbitDB:</strong> <span id="system-orbitdb-status" style="color:#27ae60;">Loading...</span>
                </div>
                <div>
                    <strong>Authenticated DIDs:</strong> <span id="authenticated-count">0</span>
                </div>
            </div>
        </div>
    `;
}

function generateSystemStatusSidebar() {
    return `
        <!-- System Status Sidebar - Grid Position: Column 2, spans both rows -->
        <div class="system-status-sidebar" style="grid-column: 2; grid-row: 1 / 3; display: flex; flex-direction: column; gap: 8px; width: 198px; min-height: 700px;">
            ${generateSystemStatusCard()}
            ${generateSecurityInfoCard()}
        </div>
    `;
}

function generateSecurityInfoCard() {
    return `
        <div style="background:#fff; border:1px solid #ddd; border-radius:4px; flex:1;">
            <div style="background:#f8f9fa; padding:8px 12px; border-bottom:1px solid #ddd; font-weight:bold; font-size:14px;">
                <i class="fa fa-info-circle" style="margin-right:6px;"></i>Security Info
            </div>
            <div style="padding:10px; font-size:11px; line-height:1.4; color:#666;">
                <p><strong>Decentralized Administration:</strong> This system uses DIDs (Decentralized Identifiers) and ACLs (Access Control Lists) stored in OrbitDB for truly decentralized access control.</p>
                <p><strong>Admin Access:</strong> The system admin identity has full permissions and can manage all DIDs and ACLs.</p>
                <p><strong>Distributed Storage:</strong> All security data is stored in OrbitDB on the local Helia IPFS network, making it accessible from anywhere.</p>
                <p><strong>Permissions:</strong> Grant specific permissions (read, write, admin, grant, revoke) to DIDs for different resources.</p>
            </div>
        </div>
    `;
}

module.exports = { generateSecurityTemplate };