# Shelf Label & Inventory App

A Progressive Web Application (PWA) for barcode shelf label printing and inventory counting with offline support.

## Features

- **Barcode Shelf Label Printing**: Scan items and print labels with customizable options
- **Inventory Counting**: Count items and maintain running totals with offline support
- **Offline-First**: Works without internet connection using IndexedDB
- **Sync Capabilities**: Upload counts to server and download master data
- **Mobile Optimized**: Responsive design for handheld devices

## Technology Stack

- **Frontend**: React 18 with TypeScript
- **Build Tool**: Vite
- **Database**: IndexedDB (via idb library)
- **Routing**: React Router DOM
- **Styling**: Tailwind CSS
- **Export**: Excel export using xlsx library

## Getting Started

### Prerequisites

- Node.js 16+ 
- npm or yarn

## Setup

1. **Clone the repo:**
   ```sh
   git clone <your-repo-url>
   cd Shelf_label_printing_Inventory
   ```

2. **Install dependencies:**
   ```sh
   npm install
   ```

3. **Start the app:**
   ```sh
   npm run dev
   ```
