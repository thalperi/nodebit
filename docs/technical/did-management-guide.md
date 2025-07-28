# DID Account Management Guide

## Overview

The DID (Decentralized Identifier) Account Management system in Nodebit provides comprehensive user identity management with professional-grade interface and full metadata support.

## Features

### Core DID Management
- **Create New DIDs**: Username-based DID creation with automatic ID generation
- **Account Metadata**: Full profile management (identity, contact, organization)
- **Avatar Management**: Upload and manage user avatars with instant preview
- **Search & Filter**: Real-time search across all DID properties
- **Status Management**: Active/inactive account status control

### Professional Interface
- **CSS Grid Layout**: Enterprise-grade responsive design
- **Expandable Panels**: Detailed account editing in collapsible panels
- **Smart Button Text**: Context-aware "Choose Avatar" vs "Change Avatar"
- **File Name Display**: Shows selected and saved avatar filenames
- **Immediate Preview**: Avatar updates instantly on file selection

### Account Information Fields
- **Identity**: Username, Display Name, Email, Role
- **Contact**: Organization, Department, Phone, Location  
- **Avatar**: Image upload with preview and filename tracking
- **Notes**: Administrative notes and descriptions
- **Metadata**: Creation date, last modified, modified by

## Usage

### Creating a New DID
1. Enter username in "Username" field (e.g., "john.doe")
2. Click "New" button
3. System automatically:
   - Generates DID identifier: "user-john-doe" (sanitized from username)
   - Creates cryptographic identity with public/private key pair
   - Stores original username in metadata.username
4. Edit additional details in expanded panel

### Managing Existing DIDs
1. Click on any DID row to expand management panel
2. Edit any field in the comprehensive form
3. Upload avatar using "Choose Avatar" / "Change Avatar" button
4. Click "Save Changes" to persist modifications
5. Use "Reset" to revert unsaved changes

### Avatar Management
1. Click "Choose Avatar" button (or "Change Avatar" if avatar exists)
2. Select image file - preview updates immediately
3. Filename appears below file selector
4. Click "Update Avatar" to save
5. Panel remains open for continued editing
6. Avatar appears in both panel and DID list

### Search and Filter
- Use search box to filter DIDs by username, ID, or status
- Search is real-time and case-insensitive
- Click "Clear" to reset search filter

## Technical Implementation

### DID Creation Process
1. **User Input**: User enters a human-readable username (e.g., "john.doe")
2. **ID Generation**: System creates DID identifier by:
   - Converting to lowercase
   - Replacing non-alphanumeric characters with hyphens
   - Prefixing with "user-" - Result: "user-john-doe"
3. **Cryptographic Identity**: OrbitDB creates cryptographic identity with:
   - Generated DID identifier as the identity ID
   - Public/private key pair for authentication
4. **Metadata Storage**: Original username stored in metadata.username
5. **Registry Storage**: Complete DID record stored in OrbitDB registry

### Data Structure
```javascript
{
  "id": "user-john-doe",  // Generated from username: user-{sanitized-username}
  "publicKey": "02daad2a08c9b871fd0e04c66064325d9da7dd2155a82260b6441b2799dd73f42e",
  "status": "active",
  "created": "2024-01-01T00:00:00Z",
  "metadata": {
    "username": "john.doe",  // Original username as entered by user
    "displayName": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "organization": "Example Corp",
    "department": "IT",
    "phone": "+1-555-123-4567",
    "location": "New York, NY",
    "avatar": "data:image/jpeg;base64,...",
    "avatarFilename": "profile.jpg",
    "notes": "System administrator",
    "lastModified": "2024-01-01T00:00:00Z",
    "modifiedBy": "dashboard-admin"
  }
}
```

### API Endpoints
- `GET /api/dids` - List all DIDs
- `POST /api/dids` - Create new DID
- `PUT /api/dids/{id}` - Update DID metadata
- `DELETE /api/dids/{id}` - Delete DID

### Security Integration
- All DID operations are logged to workspace activity
- Role-based permissions (admin, user, readonly, guest)
- Integration with ACL system for resource permissions
- Secure avatar storage with base64 encoding

## Best Practices

### Username Conventions
- Use lowercase with dots or hyphens: `john.doe`, `jane-smith`
- Avoid spaces and special characters
- Keep usernames concise but descriptive

### Avatar Management
- Recommended image size: 256x256 pixels or smaller
- Supported formats: JPEG, PNG, GIF
- Images are automatically converted to base64 for storage
- File size should be reasonable (< 1MB recommended)

### Role Assignment
- **admin**: Full system access and user management
- **user**: Standard access to assigned resources
- **readonly**: View-only access to permitted resources
- **guest**: Limited temporary access

### Metadata Maintenance
- Keep contact information current
- Use notes field for administrative context
- Update roles when responsibilities change
- Regular review of active vs inactive accounts

## Integration with ACL System

DIDs integrate seamlessly with the Access Control List system:

1. **User Selection**: DIDs appear in ACL user panel
2. **Permission Assignment**: Grant/revoke permissions per DID
3. **Resource Access**: DIDs control access to workspace resources
4. **Audit Trail**: All permission changes logged with DID context

## Troubleshooting

### Common Issues
- **Panel won't expand**: Check for JavaScript errors in browser console
- **Avatar not updating**: Ensure file is selected before clicking "Update Avatar"
- **Search not working**: Verify search input has focus and try clearing/retyping
- **Save fails**: Check network connectivity and workspace status

### Error Messages
- "DID creation failed": Username may already exist or contain invalid characters
- "Avatar update failed": File may be too large or invalid format
- "Permission denied": User may lack admin privileges for DID management

This comprehensive DID management system provides enterprise-grade user account management while maintaining the simplicity and accessibility that makes Nodebit approachable for all users.