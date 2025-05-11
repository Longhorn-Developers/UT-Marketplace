

# UT Marketplace

A modern, full-featured marketplace web application for the UT Austin community. Built with Next.js, React, Supabase, and Tailwind CSS.

---

## Features

- **User Authentication**: Secure sign-in and session management with Supabase.
- **Browse Listings**: Discover items for sale, filter by category, and view recent listings.
- **Create & Manage Listings**: Post new items, save drafts, edit, and manage your own listings.
- **Messaging System**: Real-time chat with sellers/buyers, per-listing conversations, notifications, and message deletion.
- **User Profiles**: Public and private profiles with display name, profile image, bio, and user ratings.
- **Settings**: Manage your profile, notification preferences, and more.
- **Notifications**: Real-time notifications for new messages, with a responsive popup.
- **Responsive UI**: Clean, modern design with mobile support and accessible components.

---

## Project Structure

```
/app
  /auth           # Authentication pages and callbacks
  /browse         # Browse listings page and components
  /components     # Shared UI components (Navbar, Footer, Hero, etc.)
  /context        # React context providers (e.g., AuthContext)
  /create         # Create new listing page and components
  /lib            # Utility libraries (e.g., Supabase client)
  /listing        # Listing details, owner, and edit components
  /messages       # Messaging system (inbox, chat window, conversation list)
  /my-listings    # User's own listings management
  /notifications  # (If present) Notification-related components
  /profile        # Public and private user profile pages
  /props          # Shared TypeScript types/interfaces
  /settings       # User settings page
  /api            # (If present) API routes
  layout.tsx      # App layout
  page.tsx        # Home page
  globals.css     # Global styles
/components
  Navbar.tsx, Footer.tsx, etc. # Global UI components
/public
  ...             # Static assets (images, icons, etc.)
```

---

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- npm or yarn
- Supabase project (for database and auth)

### Installation

1. **Clone the repository:**
    (Fork the repo first)
   ```bash
   git clone https://github.com/yourusername/ut-marketplace.git
   cd ut-marketplace
   ```

2. **Install dependencies:**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Configure environment variables:**
   - Copy `.env.example` to `.env.local` and fill in your Supabase credentials.

4. **Run the development server:**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. **Open [http://localhost:3000](http://localhost:3000) in your browser.**

---

## Tech Stack

- [Next.js](https://nextjs.org/)
- [React](https://react.dev/)
- [Supabase](https://supabase.com/) (Auth, Database, Storage, Realtime)
- [Tailwind CSS](https://tailwindcss.com/)
- [Lucide Icons](https://lucide.dev/icons/)

---

## Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

---

## License

[MIT](LICENSE)

---
