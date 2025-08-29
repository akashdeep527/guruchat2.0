# 🚀 GuruChat 2.0

A modern, feature-rich chat platform connecting clients with professional helpers, built with React, TypeScript, and Supabase.

## ✨ Features

### 🔐 Authentication & User Management
- Secure user registration and login
- Role-based access control (Client, Professional, Admin)
- Profile management with editable fields
- Session persistence and management

### 💬 Chat System
- Real-time chat between clients and professionals
- Chat session management
- Message history and persistence
- Professional availability status

### 💰 Wallet System
- Client wallet management
- UPI payment integration for wallet recharge
- Automatic wallet deduction for chat sessions
- Admin panel for manual wallet management
- Transaction history tracking

### 🎨 Modern UI/UX
- Responsive design optimized for mobile and desktop
- Beautiful animations and transitions
- Glassmorphism design elements
- Dark/light theme support
- Mobile-first approach

### 🛠️ Admin Panel
- User management and monitoring
- Chat session oversight
- Payment tracking
- Wallet balance management
- Real-time platform analytics

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **UI Components**: Shadcn/ui + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **State Management**: React Context + Hooks
- **Routing**: React Router DOM
- **Styling**: Tailwind CSS + CSS Modules
- **Database**: PostgreSQL with Row Level Security (RLS)
- **Authentication**: Supabase Auth
- **Real-time**: Supabase Realtime

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or bun
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/akashdeep527/guruchat2.0.git
   cd guruchat2.0
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   bun install
   ```

3. **Environment Setup**
   Create a `.env.local` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Database Setup**
   - Run the SQL migrations in your Supabase SQL editor
   - Ensure all tables, policies, and RPCs are created

5. **Start Development Server**
   ```bash
   npm run dev
   # or
   bun run dev
   ```

## 📁 Project Structure

```
guruchat2.0/
├── src/
│   ├── components/          # Reusable UI components
│   ├── contexts/           # React contexts (Auth, etc.)
│   ├── hooks/              # Custom React hooks
│   ├── integrations/       # External service integrations
│   ├── lib/                # Utility functions
│   ├── pages/              # Application pages
│   └── main.tsx           # Application entry point
├── supabase/               # Database migrations and config
├── public/                 # Static assets
└── package.json           # Dependencies and scripts
```

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

## 🗄️ Database Schema

### Core Tables
- `profiles` - User profile information
- `user_roles` - Role-based access control
- `chat_sessions` - Chat session management
- `messages` - Individual chat messages
- `wallets` - User wallet balances
- `wallet_transactions` - Wallet transaction history
- `payments` - Payment records

### Key Functions
- `has_role(role, user_id)` - Role verification
- `credit_wallet(user_id, amount, reason, reference)` - Add funds
- `debit_wallet(user_id, amount, reason, reference)` - Deduct funds
- `get_user_id_by_email(email)` - User lookup by email

## 🔒 Security Features

- Row Level Security (RLS) policies
- JWT-based authentication
- Role-based access control
- Secure API endpoints
- Input validation and sanitization

## 📱 Mobile Optimization

- Responsive design for all screen sizes
- Touch-friendly interface
- Mobile-specific navigation
- Optimized performance for mobile devices

## 🎯 Key Features in Detail

### Wallet System
- **Client Wallets**: Secure balance storage with transaction history
- **Admin Management**: Manual credit/debit capabilities
- **Payment Integration**: UPI payment gateway for wallet recharge
- **Automatic Deduction**: Chat session cost calculation and deduction

### Professional Matching
- **Smart Filtering**: Find professionals by specialty and availability
- **Rating System**: Professional reputation management
- **Availability Status**: Real-time professional status updates

### Chat Experience
- **Real-time Messaging**: Instant message delivery
- **Session Management**: Organized chat sessions
- **File Sharing**: Support for various media types
- **Chat History**: Persistent message storage

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [React](https://reactjs.org/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- UI Components from [Shadcn/ui](https://ui.shadcn.com/)
- Backend powered by [Supabase](https://supabase.com/)

## 📞 Support

For support and questions:
- Create an issue in this repository
- Contact the development team

---

**Made with ❤️ by the GuruChat Team**
