# Places

A modern, interactive map application to track your travels, manage visited cities, and visualize your global footprint. Built with React, MapLibre GL, and Supabase.

![Places Preview](src/assets/hero.png)

## 🌟 Features

-   **Interactive Map**: Smooth map experience powered by MapLibre GL with dark-themed tiles.
-   **City & Landmark Management**: Add places via search (Nominatim) and organize them in a sidebar.
-   **Automatic City Sizing**: Cities are automatically categorized as **Large**, **Medium**, or **Small** based on their global importance and type, with proportional marker sizes.
-   **Country Highlighting**: Automatically highlights the countries of all added cities.
-   **Homogenous Mode**: A unique visualization feature that merges the geometries of visited countries to remove internal borders.
-   **Supabase Integration**:
    -   Secure user authentication (Login/Sign Up).
    -   Cloud synchronization of your places across devices.
    -   Local-first mockup mode for quick testing.
-   **Customizable View**: Toggle map labels (names) on and off for a cleaner aesthetic.

## 🚀 Tech Stack

-   **Frontend**: [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/)
-   **Styling**: [Tailwind CSS 4](https://tailwindcss.com/), [Lucide React](https://lucide.dev/) (icons)
-   **Map Engine**: [MapLibre GL](https://maplibre.org/)
-   **Geospatial Ops**: [Turf.js](https://turfjs.org/)
-   **Backend/Auth**: [Supabase](https://supabase.com/)
-   **Build Tool**: [Vite](https://vitejs.dev/)
-   **Testing**: [Playwright](https://playwright.dev/)

## 🛠️ Getting Started

### Prerequisites

-   Node.js (v20 or later)
-   A Supabase project

### Installation

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/kaiser-p/places.git
    cd places
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Environment Setup**:
    Create a `.env` file in the root directory and add your Supabase credentials:
    ```env
    VITE_SUPABASE_URL=your_supabase_project_url
    VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```

4.  **Database Setup**:
    Run the following SQL in your Supabase SQL Editor to create the necessary table:
    ```sql
    CREATE TABLE places (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id uuid REFERENCES auth.users(id) NOT NULL,
      name text NOT NULL,
      type text NOT NULL, -- 'city' or 'landmark'
      coords float8[] NOT NULL, -- [lat, lon]
      country_code text,
      size text, -- 'small', 'medium', 'large'
      created_at timestamptz DEFAULT now()
    );

    -- Enable RLS
    ALTER TABLE places ENABLE ROW LEVEL SECURITY;

    -- Create Policy
    CREATE POLICY "Users can manage their own places" ON places
      FOR ALL USING (auth.uid() = user_id);
    ```

5.  **Start the development server**:
    ```bash
    npm run dev
    ```

## 🧪 Testing

The project uses Playwright for end-to-end testing.

```bash
# Run tests
npx playwright test

# Run tests with UI
npx playwright test --ui
```

## 📦 Deployment

This app is configured for deployment to **GitHub Pages** via GitHub Actions.

1.  Push your changes to the `main` branch.
2.  Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as **GitHub Actions Secrets** in your repository settings.
3.  Ensure the "Pages" source is set to "GitHub Actions" in the repository settings.

## 📄 License

This project is licensed under the MIT License.
