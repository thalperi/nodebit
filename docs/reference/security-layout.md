# Security Tab UI Design

## Overview

The Security tab provides a comprehensive interface for managing Decentralized Identifiers (DIDs) and Access Control Lists (ACLs) in a responsive, professional layout.

## Layout Structure

### Main Container
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Security Tab Container (Responsive - uses full available width)             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ ┌─────────────────────────────────────────────────┐  ┌──────────────────┐   │
│ │ DID Management Area                             │  │ System Status    │   │
│ │ (Remaining width)                               │  │ Sidebar          │   │
│ │                                                 │  │ (Fixed 200px)    │   │
│ │ ┌─────────────────────────────────────────────┐ │  │                  │   │
│ │ │ DID Creation Form                           │ │  │ • DID System     │   │
│ │ │ • Username Input                            │ │  │ • Admin Identity │   │
│ │ │ • New DID Button                            │ │  │ • OrbitDB Status │   │
│ │ │ • Search Input                              │ │  │ • Auth Count     │   │
│ │ │ • Clear Button                              │ │  │                  │   │
│ │ └─────────────────────────────────────────────┘ │  │                  │   │
│ │                                                 │  │ ┌──────────────┐ │   │
│ │ ┌─────────────────────────────────────────────┐ │  │ Security Info  │ │   │
│ │ │ DID List Table                              │ │  │  • DID/ACL     │ │   │
│ │ │ • User | Created | Identifier | Status      │ │  │  • Admin Access│ │   │
│ │ │ • Scrollable content                        │ │  │  • Storage     │ │   │
│ │ │ • Expandable rows                           │ │  │  • Permissions │ │   │
│ │ └─────────────────────────────────────────────┘ │  │  • (Scrollable)│ │   │
│ └─────────────────────────────────────────────────┘  └──────────────────┘   │
│                                                                             │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ ACL Management Area (100% width)                                        │ │
│ │                                                                         │ │
│ │ ┌────────────┐ ┌─────────────┐ ┌─────────────────────────────────────┐  │ │
│ │ │ Users      │ │ Resources   │ │ Permissions                         │ │ │
│ │ │ (133px)    │ │ (200px)     │ │ (Remaining width)                   │ │ │
│ │ │            │ │             │ │                                     │ │ │
│ │ │ • User List│ │ • Resource  │ │ • Permission Matrix                 │ │ │
│ │ │ • Selection│ │   List      │ │ • Grant/Revoke Controls             │ │ │
│ │ │ • Actions  │ │ • Selection │ │ • Status Indicators                 │ │ │
│ │ └────────────┘ └─────────────┘ └─────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Responsive Behavior

### Desktop (1200px+)
- **Main Container**: Uses full available width (max 1200px)
- **DID Area**: Remaining width (1fr)
- **System Status**: Fixed 200px sidebar (spans only DID area height)
- **ACL Area**: 100% width below DID area
- **ACL Components**: Users (133px) + Resources (200px) + Permissions (remaining)
- **ACL grid row**: Matches the height of the DID/System Status row above (main grid uses grid-template-rows: 1fr 1fr)
- **Spacing**: The ACL Management Area and its panels have internal and external bottom padding for proportional spacing.

### Tablet (768px - 1199px)
- **Main Container**: Uses full available width
- **DID Area**: Remaining width (1fr)
- **System Status**: Fixed 200px sidebar (spans only DID area height)
- **ACL Area**: 100% width below DID area
- **ACL Components**: Users (120px) + Resources (160px) + Permissions (remaining)
- **Spacing**: As above, with proportional padding.

### Mobile (< 768px)
- **Main Container**: Uses full available width
- **Layout**: Stack vertically for better mobile experience
- **DID Area**: Full width
- **System Status**: Full width below DID area
- **ACL Area**: Full width at bottom
- **ACL Components**: Stack vertically (Users, Resources, Permissions)

## Component Specifications

### DID Management Area
- **Height**: Minimum 400px
- **Background**: White with border
- **Header**: "Decentralized Identifiers (DIDs)" with icon
- **Form**: Username input, New button, Search input, Clear button
- **Table**: User | Created | Identifier | Status columns
- **Behavior**: Scrollable content, expandable rows

### ACL Management Area
- **Height**: Minimum 300px
- **Background**: White with border
- **Header**: "Access Control Lists (ACLs)" with icon
- **Layout**: Three-column grid
- **Components**: Users (133px), Resources (200px), Permissions (remaining width)
- **Spacing**: Internal and external bottom padding for proportional spacing

### System Status Sidebar
- **Width**: Fixed 200px
- **Height**: Spans both DID and ACL areas
- **Background**: White with border
- **Content**: System status cards and security info

## CSS Implementation

The Security tab layout is implemented using CSS Grid classes defined in `nodes/workspace/ui/html-generator.js`:

- **`.security-container`**: Main grid layout with responsive breakpoints
- **`.did-area`**: DID Management Area positioning and sizing
- **`.acl-area`**: ACL Management Area positioning and sizing  
- **`.status-sidebar`**: System Status Sidebar positioning and sizing

The layout includes responsive breakpoints for mobile devices and maintains the specified fixed widths for System Status (200px), ACL Users (133px), and ACL Resources (200px).

## Design Principles

1. **Responsive First**: Layout adapts to available space
2. **Fixed Sidebar**: System Status maintains consistent 200px width
3. **Fluid Content**: DID and ACL areas use remaining space
4. **Professional Appearance**: Clean borders, proper spacing, consistent styling
5. **Accessibility**: Clear visual hierarchy, readable fonts, proper contrast
6. **Performance**: CSS Grid for efficient layout rendering

## Implementation Notes

- Uses CSS Grid for main layout structure
- Maintains fixed sidebar width for consistency
- Allows content areas to expand fluidly
- Supports responsive breakpoints for different screen sizes
- Follows Node-RED design patterns and styling conventions