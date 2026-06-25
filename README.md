# Habbitflow

A modern habit tracking dashboard built with React, Vite, TypeScript, Tailwind CSS, Zustand, and Supabase.

## Overview

Habbitflow is designed to help you manage daily routines, track habit completion, and visualize progress with charts and calendar views. The app includes:

- Dashboard overview
- Habit routines management
- Analytics and reports
- Calendar habit logging
- Settings and theme support
- Supabase-backed persistence

## Project Structure

```
.
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── .gitignore
├── .gitattributes
├── src
│   ├── App.tsx
│   ├── main.tsx
│   ├── index.css
│   ├── types.ts
│   ├── components
│   │   ├── AnalyticsView.tsx
│   │   ├── CalendarView.tsx
│   │   ├── DashboardView.tsx
│   │   ├── HabitsView.tsx
│   │   ├── ReportsView.tsx
│   │   └── SettingsView.tsx
│   ├── data
│   │   └── defaultData.ts
│   ├── lib
│   │   └── supabaseClient.ts
│   ├── store
│   │   └── useHabitStore.ts
│   └── utils
│       └── habitUtils.ts
```

## Built With

- React
- Vite
- TypeScript
- Tailwind CSS
- Zustand
- Supabase
- Recharts
- Lucide icons

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file from `.env.example` and add your Supabase credentials:

```bash
copy .env.example .env
```

3. Set the required environment variables in `.env`:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Start the development server:

```bash
npm run dev
```

5. Open the app in your browser at the address shown by Vite, typically `http://localhost:3000`.

## Available Scripts

- `npm run dev` - start the development server
- `npm run build` - build the app for production
- `npm run preview` - preview the production build locally
- `npm run lint` - type-check the project with TypeScript

## Notes

- The app expects Supabase tables for `habits`, `habit_logs`, and `settings`.
- If Supabase is not configured, the app will show a configuration warning and disable persistence.
- Use the settings view to switch themes and manage app preferences.

