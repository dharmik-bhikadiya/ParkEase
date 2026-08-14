# Web Frontend Architecture (`apps/web`)

## Technologies & Stack
- **Framework**: React 18 with Vite 5
- **Language**: TypeScript
- **Styling**: TailwindCSS & Custom CSS Tokens
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **QR Generator**: `qrcode.react`

## Structure Overview
- `src/api/`: Modular API clients wrapping Axios (`apiClient`).
- `src/components/`: Reusable UI components (Navbar, Card, Button, Input, Modal, Animated Brand Logo, ParkEase Journey Scene).
- `src/context/`: Centralized React Context (`AuthContext`).
- `src/pages/`: Page containers (Landing, FindParking, ParkingDetails, MyBookings, WalletPage, StaffGateScanPage, OwnerDashboardPage, AdminParkingPage).
- `src/routes/`: Route definitions and protected route wrappers.
