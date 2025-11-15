# Polymarket Clone - Play Money Prediction Markets

A full-stack prediction market platform similar to Polymarket, but using play money instead of real currency. Users can create markets, trade on outcomes, and resolve markets when events conclude.

## Features

- **User Authentication**: Register and login with email/password
- **Play Money Balance**: Each user starts with $10,000 in play money
- **Market Creation**: Create binary (Yes/No) prediction markets
- **Automated Market Maker (AMM)**: Constant product formula for fair pricing
- **Real-time Trading**: Buy and sell shares on market outcomes
- **Portfolio Management**: Track your positions and profit/loss
- **Market Resolution**: Creators can resolve markets when events conclude
- **Responsive UI**: Clean, modern interface built with React and Tailwind CSS

## Tech Stack

### Backend
- Node.js with TypeScript
- Express.js for API
- SQLite for database
- bcrypt for password hashing
- JWT for authentication
- Zod for validation

### Frontend
- React with TypeScript
- React Router for navigation
- Tailwind CSS for styling
- Axios for API calls
- date-fns for date formatting
- Vite for build tooling

## Project Structure

```
polymarket-clone/
├── server/                 # Backend application
│   ├── src/
│   │   ├── db/            # Database schema
│   │   ├── middleware/    # Authentication middleware
│   │   ├── routes/        # API routes
│   │   ├── utils/         # AMM calculations
│   │   └── index.ts       # Server entry point
│   └── package.json
├── client/                # Frontend application
│   ├── src/
│   │   ├── api/          # API client
│   │   ├── components/   # React components
│   │   ├── context/      # React context (Auth)
│   │   ├── pages/        # Page components
│   │   ├── App.tsx       # Main app component
│   │   └── main.tsx      # Entry point
│   └── package.json
└── package.json          # Root package
```

## Installation

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd palihale
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies
   npm install

   # Install server dependencies
   cd server
   npm install

   # Install client dependencies
   cd ../client
   npm install
   cd ..
   ```

3. **Configure environment variables**
   ```bash
   # In the server directory
   cd server
   cp .env.example .env
   ```

   Edit `server/.env` to set your configuration:
   ```
   PORT=3001
   JWT_SECRET=your-secret-key-change-in-production
   DATABASE_PATH=./database.db
   INITIAL_BALANCE=10000
   ```

## Running the Application

### Development Mode

Run both frontend and backend concurrently from the root directory:

```bash
npm run dev
```

Or run them separately:

```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
cd client
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

### Production Build

```bash
# Build both frontend and backend
npm run build

# Start the backend server
cd server
npm start

# Serve the frontend (you'll need a static file server)
cd client
npm run preview
```

## How It Works

### Automated Market Maker (AMM)

The platform uses a constant product market maker (CPMM) similar to Uniswap:

- **Formula**: `x * y = k` where x and y are the pool sizes for YES and NO outcomes
- **Price Discovery**: Prices are determined by the ratio of pool sizes
- **Initial Liquidity**: Each market starts with 100 YES shares and 100 NO shares (50/50 probability)
- **Dynamic Pricing**: As users trade, prices automatically adjust based on supply and demand

### Trading Example

If a market has:
- YES pool: 100 shares
- NO pool: 100 shares
- Current YES price: 50¢ (50%)

When you buy $10 worth of YES shares:
1. Your $10 goes into the NO pool → NO pool = 110
2. Constant product: k = 100 * 100 = 10,000
3. New YES pool: 10,000 / 110 ≈ 90.91
4. You receive: 100 - 90.91 ≈ 9.09 YES shares
5. New YES price: 110 / (90.91 + 110) ≈ 54.7¢

### Market Resolution

1. Markets have an end date when trading closes
2. The market creator resolves the market by selecting the actual outcome (YES or NO)
3. Winners receive $1 per share they hold
4. Losers receive nothing
5. Payouts are automatically distributed to user balances

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Markets
- `GET /api/markets` - List all markets
- `GET /api/markets/:id` - Get market details
- `POST /api/markets` - Create new market (authenticated)
- `POST /api/markets/:id/resolve` - Resolve market (authenticated, creator only)

### Trading
- `POST /api/trades/buy` - Buy shares (authenticated)
- `POST /api/trades/sell` - Sell shares (authenticated)
- `GET /api/trades/history` - Get trade history (authenticated)

### User
- `GET /api/users/me` - Get current user (authenticated)
- `GET /api/users/positions` - Get user positions (authenticated)

## Usage Guide

### 1. Create an Account
- Navigate to the Sign Up page
- Enter username, email, and password
- You'll receive $10,000 in play money

### 2. Browse Markets
- View active and resolved markets on the home page
- See current prices for YES and NO outcomes

### 3. Create a Market
- Click "Create Market" in the navigation
- Enter a clear yes/no question
- Provide description and resolution criteria
- Set an end date for trading

### 4. Trade on Markets
- Click on any market to view details
- Select BUY or SELL
- Choose YES or NO outcome
- Enter amount or shares
- Confirm the trade

### 5. Monitor Portfolio
- View all your positions in the Portfolio page
- Track profit/loss on each position
- See total portfolio value

### 6. Resolve Markets
- After a market ends, the creator can resolve it
- Select the correct outcome (YES or NO)
- Winners are automatically paid out

## Security Considerations

This is a play money application for educational/entertainment purposes:

- Passwords are hashed with bcrypt
- JWT tokens for authentication
- Basic input validation with Zod
- SQL injection protection with parameterized queries
- CORS enabled for API access

**Note**: This is not production-ready for real money. Additional security measures would be needed for a real money application.

## Development

### Database Schema

The SQLite database includes these tables:
- `users` - User accounts and balances
- `markets` - Prediction markets
- `positions` - User positions in markets
- `trades` - Trade history

### Adding Features

Some ideas for enhancements:
- Add market categories/tags
- Implement market search and filtering
- Add price charts and historical data
- Create a leaderboard
- Add social features (comments, sharing)
- Implement liquidity pools
- Add market fees
- Support for multi-outcome markets (not just binary)

## License

MIT License - See LICENSE file for details

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
