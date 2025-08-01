# Finance Achiever Backend

Express.js TypeScript backend API for the Finance Achiever educational platform - powering financial literacy courses with social learning features.

## Features

- **RESTful API**: Comprehensive API for all platform features
- **Authentication**: Replit OIDC and local email/password auth
- **Database**: PostgreSQL with Drizzle ORM
- **Payment Processing**: Stripe integration for subscriptions
- **AI Integration**: OpenAI GPT-4o for tutoring and assistance
- **Security**: Helmet, CORS, rate limiting, and session security
- **Real-time**: WebSocket support for live features
- **Performance**: Memory optimization and connection pooling

## Tech Stack

- **Runtime**: Node.js 18+ with TypeScript 5.6.3
- **Framework**: Express.js 4.21.2 with middleware
- **Database**: PostgreSQL with Drizzle ORM 0.39.1
- **Authentication**: Passport.js with session storage
- **Payment**: Stripe 18.3.0 for subscription management
- **AI**: OpenAI 5.10.2 for GPT-4o integration
- **Validation**: Zod for request/response validation

## Getting Started

### Prerequisites
- Node.js 18+ and npm 8+
- PostgreSQL database (local or cloud)
- Stripe account (test/live keys)
- OpenAI API key

### Installation
```bash
npm install
```

### Environment Setup
```bash
cp .env.example .env
```

Configure your environment variables:
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Secure session secret key
- `STRIPE_SECRET_KEY`: Stripe secret key
- `OPENAI_API_KEY`: OpenAI API key

### Database Setup
```bash
npm run db:push
```

### Development
```bash
npm run dev
```
Runs on http://localhost:5000 with hot reload

### Production
```bash
npm run build
npm start
```

## Project Structure

```
├── shared/             # Database schemas and shared types
│   ├── schema.ts      # Complete database schema
│   └── simple-schema.ts # Simplified schema
├── db.ts              # Database connection and configuration
├── index.ts           # Main application entry point
├── routes.ts          # API route definitions
├── replitAuth.ts      # Authentication middleware
├── stripe.ts          # Stripe integration
├── services/          # External service integrations
│   └── openai.ts     # OpenAI service
├── middleware/        # Custom middleware
├── utils/             # Utility functions
└── integrations/      # Third-party integrations
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Courses
- `GET /api/courses` - List all courses
- `GET /api/courses/:id` - Get course details
- `POST /api/user-progress` - Update course progress

### Social Features
- `GET /api/posts` - Get posts feed
- `POST /api/posts` - Create new post
- `POST /api/posts/:id/like` - Like/unlike post
- `GET /api/communities` - List communities
- `POST /api/communities` - Create community

### Financial Tools
- `GET /api/financial/accounts` - Get user accounts
- `POST /api/financial/accounts` - Create account
- `GET /api/financial/transactions` - Get transactions
- `POST /api/financial/transactions` - Add transaction
- `GET /api/financial/budgets` - Get budgets
- `POST /api/financial/budgets` - Create budget

### AI Tutoring
- `GET /api/ai/conversations` - Get conversation history
- `POST /api/ai/conversations` - Start new conversation
- `POST /api/ai/chat` - Send chat message

### Payment Processing
- `POST /api/stripe/create-subscription` - Create subscription
- `POST /api/stripe/webhook` - Handle Stripe webhooks
- `GET /api/stripe/subscription` - Get subscription status

### Health & Monitoring
- `GET /api/health` - Health check endpoint
- `GET /api/metrics` - Performance metrics

## Database Schema

The backend uses PostgreSQL with comprehensive schemas:

### Core Tables
- **users**: User accounts and profiles
- **sessions**: Session storage (PostgreSQL-based)
- **courses**: Course catalog and metadata
- **user_progress**: Course completion tracking

### Social Features
- **posts**: User posts and content
- **comments**: Post comments and replies
- **likes**: Like tracking for posts/comments
- **communities**: Community management

### Financial Management
- **financial_accounts**: User financial accounts
- **transactions**: Financial transactions
- **budgets**: Budget creation and tracking
- **financial_goals**: Goal setting and progress

### AI & Communication
- **ai_conversations**: AI chat history
- **chat_messages**: Individual chat messages

### Credit Management
- **credit_reports**: Credit report data
- **credit_disputes**: Dispute tracking and management
- **bureau_communications**: Communication logs

## Security Features

- **CORS**: Configurable origin restrictions
- **Helmet**: Security headers and protections
- **Rate Limiting**: API request throttling
- **Session Security**: httpOnly cookies with PostgreSQL storage
- **Input Validation**: Zod schema validation
- **SQL Injection Protection**: Parameterized queries via Drizzle
- **Authentication**: Multi-provider auth with session management

## Performance Optimizations

- **Connection Pooling**: Optimized PostgreSQL connections
- **Memory Management**: Garbage collection and monitoring
- **Caching**: Redis integration ready
- **Compression**: Response compression middleware
- **Database Indexing**: Optimized query performance

## Deployment Options

### Railway (Recommended)
```bash
# Connect to GitHub repository
# Railway auto-deploys with PostgreSQL addon
```

### Heroku
```bash
heroku create finance-achiever-api
heroku addons:create heroku-postgresql:hobby-dev
git push heroku main
```

### DigitalOcean App Platform
```bash
# Deploy via GitHub integration
# Add PostgreSQL database addon  
```

### Docker
```bash
docker build -t finance-achiever-backend .
docker run -p 5000:5000 finance-achiever-backend
```

## Environment Variables

### Required
```env
DATABASE_URL=postgresql://...
SESSION_SECRET=your-secret-key
STRIPE_SECRET_KEY=sk_...
OPENAI_API_KEY=sk-...
```

### Optional
```env
PORT=5000
NODE_ENV=production
FRONTEND_URL=https://your-frontend.com
REDIS_URL=redis://...
RATE_LIMIT_MAX_REQUESTS=100
```

## Monitoring & Logging

- **Health Checks**: Built-in health endpoint
- **Error Tracking**: Structured error logging
- **Performance Metrics**: Memory and response time monitoring
- **Database Monitoring**: Connection pool statistics

## Testing

```bash
# Run type checking
npm run check

# Test database connection
curl http://localhost:5000/api/health

# Test authentication
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

## Contributing

1. Follow TypeScript strict mode guidelines
2. Use Zod schemas for request validation
3. Add proper error handling and logging
4. Test all database operations
5. Validate Stripe webhook signatures
6. Use environment variables for all secrets

## License

MIT License - see LICENSE file for details