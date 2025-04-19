# PC Builder

A web application designed to help users build custom PC configurations using a Next.js frontend with a PostgreSQL database.

## Features

- **Skilled Builder Mode**: A streamlined interface for experienced users to directly select PC components with compatibility checks.
- **Beginner Builder Mode**: An interactive chat-based interface that guides novice users through component selection based on their needs and budget.
- **Component Database**: Comprehensive database of PC parts with detailed specifications and compatibility information.
- **Smart Compatibility**: Automatically filters compatible components based on previous selections.
- **AI-Powered Guidance**: Uses AI to provide personalized PC build recommendations.

## Technology Stack

- **Frontend**: Next.js 15.1.6 with React 19
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL 
- **AI Integration**: Ollama with qwen2.5:14b model
- **Markdown Rendering**: react-markdown for formatted chat responses

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up your environment variables (copy `.env.local.sample` to `.env.local` and fill in the values)
4. Set up the PostgreSQL database using the scripts in `src/db_setup/`
5. Run the development server:
   ```bash
   npm run dev
   ```
6. Open [http://localhost:3000](http://localhost:3000) with your browser

## Project Structure

The application is organized into the following main directories:

- `src/app/`: Next.js app router pages
- `src/components/`: React components
- `src/db_setup/`: Database initialization scripts
- `src/lib/`: Utility functions and libraries
- `src/data/`: Static data files

## Development Scripts

- `npm run dev`: Start the development server with Turbopack
- `npm run build`: Build the application for production
- `npm run start`: Start the production server
- `npm run lint`: Run ESLint to check code quality
- `npm run test-recommendation`: Test the recommendation system
- `npm run test-api`: Test the API endpoints

## Database Schema

The application uses a PostgreSQL database with tables for different PC components (CPU, motherboard, GPU, etc.) and compatibility relationships between them.

## License

This project is private and not licensed for public use.
