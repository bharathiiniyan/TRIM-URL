# TRIM URL | Smart URL Shortener & Visitor Analytics

This project is a part of a hackathon run by [Katomaran](https://katomaran.com).

---

## 📖 Project Overview & Objective

### 🔍 Overview
TRIM URL is a full-stack URL shortener application built with React, Node.js, and MongoDB that allows authenticated users to instantly convert long URLs into clean, shareable short links. Each link is tracked with real-time analytics including total clicks, last visited time, and full visit history. Users can manage all their links from a personal dashboard with options to copy, delete, and view detailed performance insights. The platform also supports bonus features like custom aliases, expiry dates, QR code generation, and daily click trend charts. Built for a hackathon, it demonstrates practical full-stack engineering across authentication, database modeling, REST APIs, and responsive UI design.

### 🎯 Objective
To build a secure, scalable full-stack URL shortener application that enables users to easily shorten links, set custom expiration gates/aliases, generate QR codes, and monitor visitor traffic via a rich analytics dashboard.

---


## 🏗️ System Architecture

Below is the high-level representation of data flow and service communication:

```text
                  +--------------------------------+
                  |      React (Vite) Frontend     |
                  |           (Port 5173)          |
                  +---------------+----------------+
                                  |
                        API Calls | (Axios Interceptors with JWT)
                                  v
                  +---------------+----------------+
                  |      Node + Express Server     |
                  |           (Port 5000)          |
                  +--------+--------------+--------+
                           |              |
           302 Redirection |              | Mongoose ORM
                           v              v
                     [User Browser]   +---+------------+
                                      |    MongoDB     |
                                      |  (Port 27017)  |
                                      +----------------+
```

---

## ✨ Features Implemented

1. **JWT Authentication**: Full registration and login cycle with secure `bcryptjs` password hashing and token caching in `localStorage`.
2. **URL Shortening**: Accepts destination URLs with custom alias configurations and calendar-selected expiry dates.
3. **Smart Public Redirection (`/r/:shortCode`)**: Validates expiration limits, updates click metrics, parses client headers (Browser, OS, and Device), and performs a standard 302 redirect.
4. **Interactive Dashboard**:
   - Analytics aggregates (Total Links, Aggregate Clicks, Active Links).
   - Dynamic search filter & sorting controls (Newest, Clicks, Expiry).
   - Inline card interactions (Clipboard Copy, QR generation trigger, Delete actions).
5. **Real-time Analytics View**:
   - Aggregated last visited timestamp.
   - Recharts Line chart showing daily click trends for the last 30 days.
   - Interactive Pie charts separating traffic by Browser, OS, and Device categories.
   - Table grid showing details of the last 10 visits.
6. **QR Code Generator Modal**: Creates high-quality QR codes in a popup overlay and supports downloading the file as a PNG.
7. **Public Stats Page (`/stats/:shortCode`)**: Publicly displays the link's metadata and 30-day click activity timeline chart without requiring authentication.
8. **UI/UX Excellence**: Premium glassmorphism layout, animated background glows, hover shiny transitions, responsive components, skeleton loader states, and stackable custom toast notifications.

---

## 🛠️ Step-by-Step Setup Guide

### Prerequisites
- **Node.js** (v18 or higher recommended)
- **MongoDB** running locally on port `27017` (or a remote MongoDB Atlas connection string)

---

### 1. Database & Express Server Setup

1. Open a terminal and navigate to the `server/` directory:
   ```bash
   cd server
   ```
2. Install the backend dependencies:
   ```bash
   npm install
   ```
3. Configure the environment variables. A `.env` file has been created for you with these defaults:
   ```env
   MONGO_URI=mongodb://localhost:27017/urlshortener
   JWT_SECRET=super_secret_hackathon_jwt_key_2026_trimurl
   PORT=5000
   CLIENT_URL=http://localhost:5173
   ```
4. Start the backend server:
   - For production / standard start:
     ```bash
     npm start
     ```
   - For developer live-reload:
     ```bash
     npm run dev
     ```
   The console will output:
   `Successfully connected to MongoDB.` and `Server is running on port 5000`.

---

### 2. React (Vite) Client Setup

1. Open a new terminal window and navigate to the `client/` directory:
   ```bash
   cd client
   ```
2. Install the frontend dependencies:
   ```bash
   npm install
   ```
3. Launch the local Vite development server:
   ```bash
   npm run dev
   ```
   Open your browser and navigate to `http://localhost:5173`.

---

## 📝 Assumptions Made

1. **MongoDB Connection**: It is assumed that MongoDB is running locally on port `27017` with no authentication required, or that the developer will update `server/.env` to point to a MongoDB Atlas URI if using a cloud database.
2. **Dynamic Host Resolutions**: The short links generated in the database are returned using the current request context protocol and host (`req.protocol` + `req.get('host')`) to automatically handle both localhost dev servers and cloud server deployments.
3. **Device Parser Logic**: Since native browser user-agents can be complex, client devices are parsed by filtering strings for standard mobile (iPhone, Android) and tablet keywords, defaulting to Desktop.

---

## 📑 AI Planning Document

Here is a log of each feature block and how it was planned and executed:

| Feature | Design Strategy | Implementation Details |
| :--- | :--- | :--- |
| **Step 1: Boilerplate** | Setup Express entry, connect MongoDB | Setup `index.js`, registered body-parsers, CORS policies, rate limiters, and Mongoose client connections. |
| **Step 2: Security & Auth** | JWT sessions + Bcrypt hashing | Created `User` schema with Mongoose pre-save bcrypt hooks. Configured `/api/auth/register` and `/api/auth/login` to sign and return JWT keys. Protected private paths using `authMiddleware`. |
| **Step 3: Shortener Engine** | Custom alias check + unique nanoid | Designed `Url` schema. Integrated `nanoid` to generate random 6-character shortCodes. Checked custom aliases against short codes and alias parameters to guarantee absolute uniqueness. |
| **Step 4: Click Redirection** | Track client properties & issue redirect | Constructed `/r/:shortCode` endpoint. Parses incoming `User-Agent` strings via `useragent` to register visitor OS and Browser. Saves a `Click` document and updates click counters before redirecting. |
| **Step 5: Aggregations** | Mongoose pipeline groupings | Designed MongoDB `$group` and `$dateToString` pipelines in `analyticsController` to compile 30-day timelines, device metrics, OS stats, and recent visit logs. |
| **Step 6: Frontend Shell** | Route paths + global contexts | Setup Vite client. Created `AuthContext` to share credentials, sync with `localStorage`, and register Axios authorization headers interceptors. |
| **Step 7: Credentials Views** | User forms + error warnings | Coded `Login` and `Register` pages with custom validations for email formats, passwords length, and match assertions. |
| **Step 8: Workspace Dashboard** | Forms, analytics summary, card grids | Programmed the dashboard showing total summaries. Coded `URLCard` to copy links, pop modals, trigger deletions, and display expiration statuses. |
| **Step 9: Interactive Charts** | Recharts visual graphics | Coded the `Analytics` and `PublicStats` views incorporating Recharts `<LineChart>` trends and `<PieChart>` client metrics. |
| **Step 10: Utility Extras** | QR canvases + custom notifications | Coded `QRModal` utilizing `qrcode` to draw codes on canvas nodes and trigger PNG downloads. Developed `ToastContext` to manage stackable custom notices. |
| **Step 11: Polish** | Visual adjustments & loaders | Polished layout responsiveness, set up animated card hover glow effects, added scrollbar styling, and integrated Skeleton screens. |

### 3. Newly Added Hackathon Features (Bonus Tasks)

#### A. Edit Destination URL
- **Implementation**: Authorized users can now dynamically change the target destination (`longUrl`) of any shortened link directly from their dashboard.
- **Usage**: Click the **Pencil (Edit)** button on any URL card to open an inline input field, modify the target, and save. The redirect will automatically route users to the updated URL.

#### B. Bulk URL Shortening via CSV
- **Implementation**: Designed a client-side CSV parser that processes file uploads and sends a payload list to a new bulk-creation API endpoint.
- **Usage**: Click **Bulk Shorten (CSV)** on the dashboard, choose/drag a `.csv` file (using standard headers or order position), review the parse list in the preview table, and submit to generate short codes for all rows in a single batch.

---

This project is a part of a hackathon run by https://katomaran.com

---

## 📹 Video Walkthrough Placeholder

[Click here to view the video demonstration of TrimURL](https://www.youtube.com/watch?v=dQw4w9WgXcQ)
*(Replace this with your actual Loom/YouTube hackathon demonstration link)*
