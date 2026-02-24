# FamMeal — Frontend

Mobile-first React SPA for FamMeal.

## Tech Stack

- **Framework**: React 19 + TypeScript
- **Build**: Vite 7
- **Routing**: React Router v7
- **Data Fetching**: TanStack React Query
- **State**: Zustand (UI state) + React Context (auth, family, toast)
- **Styling**: Tailwind CSS v4 + Radix UI primitives
- **HTTP**: Axios

## Project Structure

```
src/
├── App.tsx                # Root component + route definitions
├── main.tsx               # ReactDOM entry point
│
├── api/                   # Axios client + typed service functions
│   ├── client.ts          # Axios instance (interceptors, token refresh)
│   ├── auth.service.ts
│   ├── family.service.ts
│   ├── meal.service.ts
│   ├── notification.service.ts
│   └── user.service.ts
│
├── query/                 # React Query layer
│   ├── queryClient.ts     # QueryClient config
│   ├── queryKeys.ts       # Centralized query key factories
│   └── hooks/             # useQuery / useMutation hooks per domain
│
├── context/               # React contexts
│   ├── AuthContext.tsx     # JWT auth state + login/logout
│   ├── FamilyContext.tsx   # Active family selection
│   └── ToastContext.tsx    # Toast notification system
│
├── stores/                # Zustand stores (UI-only state)
│
├── pages/                 # Route-level page components
│   ├── Auth/              # Login, Register
│   ├── Home/              # Dashboard
│   ├── Family/            # Family details
│   ├── FamilySelect/      # Family picker
│   ├── Meals/             # Meal list + detail
│   ├── NewProposal/       # Proposal form
│   ├── Voting/            # Ranked voting UI
│   ├── AdminFinalization/  # Meal finalization (admin only)
│   ├── Settings/          # User profile + family settings
│   ├── Notifications/     # Notification feed
│   └── ...
│
├── components/            # Shared UI components
│   ├── ui/                # Base components (Button, Input, Card, Dialog, …)
│   ├── Layout/            # App shell, headers, bottom nav
│   ├── Navigation/        # Tab bar, route links
│   ├── ProtectedRoute/    # Auth guard
│   ├── FamilyGate/        # Active-family guard
│   ├── PermissionGate/    # RBAC-aware UI gate
│   └── AdminRoute/        # Admin-only route wrapper
│
├── types/                 # TypeScript type definitions
├── utils/                 # Permissions helpers, session utils
├── constants/             # Cuisine/dietary option constants
├── assets/                # Avatar images
└── styles/                # Theme CSS variables
```

## Running Standalone

```bash
npm install
npm run dev              # → http://localhost:5173
```

Set `VITE_API_BASE_URL` to point at the backend (default: `http://localhost:3000/api`).
