# Perplexity Clone

A minimal web-based conversational search engine that combines web search capabilities (via Exa AI API) with AI-powered answer generation (via Mistral API). Get synthesized answers with source citations in a clean, modern interface.

## Features

- 🔍 **Web Search Integration**: Powered by Exa AI for relevant, real-time web content
- 🤖 **AI-Generated Answers**: Uses Mistral AI to synthesize comprehensive responses
- 📚 **Source Citations**: View and verify all sources used in answer generation
- ⚡ **Streaming Responses**: Progressive answer display for faster perceived performance
- 🎨 **Modern UI**: Clean, minimalist design built with Next.js and Tailwind CSS
- 🔒 **Secure**: API credentials stored server-side only

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18.x or higher
- **npm** or **yarn** package manager

You'll also need API keys from:
- [Exa AI](https://exa.ai)
- [Mistral AI](https://mistral.ai)

## Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd perplexity-clone
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your API keys:

```env
# Exa AI API Key
EXA_API_KEY=your_actual_exa_api_key

# Mistral AI API Key
MISTRAL_API_KEY=your_actual_mistral_api_key

# CORS Configuration (optional)
ALLOWED_ORIGIN=*
```

### 4. Run the Development Server

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Obtaining API Keys

### Exa AI API Key

1. Visit [https://exa.ai](https://exa.ai)
2. Sign up for an account or log in
3. Navigate to your dashboard or API settings
4. Generate a new API key
5. Copy the key and add it to your `.env.local` file

**Documentation**: [Exa AI API Docs](https://docs.exa.ai)

### Mistral AI API Key

1. Visit [https://console.mistral.ai](https://console.mistral.ai)
2. Create an account or sign in
3. Go to API Keys section in your account settings
4. Create a new API key
5. Copy the key and add it to your `.env.local` file

**Documentation**: [Mistral AI API Docs](https://docs.mistral.ai)

## Project Structure

```
perplexity-clone/
├── app/
│   ├── api/
│   │   └── search/
│   │       └── route.ts          # Backend API endpoint
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Main search interface
├── components/
│   ├── AnswerDisplay.tsx         # Answer rendering component
│   ├── ErrorMessage.tsx          # Error display component
│   ├── LoadingIndicator.tsx      # Loading state component
│   ├── SearchInput.tsx           # Search input component
│   └── SourcesList.tsx           # Source citations component
├── lib/
│   ├── exa-client.ts             # Exa API integration
│   ├── mistral-client.ts         # Mistral API integration
│   ├── prompt-formatter.ts       # Prompt construction utilities
│   └── input-sanitizer.ts        # Input validation and sanitization
├── .env.local.example            # Environment variables template
└── README.md                     # This file
```

## Available Scripts

### Development

```bash
npm run dev
```

Starts the development server on [http://localhost:3000](http://localhost:3000)

### Build

```bash
npm run build
```

Creates an optimized production build

### Start Production Server

```bash
npm run start
```

Runs the production build (must run `npm run build` first)

### Run Tests

```bash
npm test
```

Runs the test suite using Vitest

### Security Verification

```bash
npm run verify-security
```

Verifies that API credentials are not exposed in client-side code

### Linting

```bash
npm run lint
```

Runs ESLint to check code quality

## Deployment

### Vercel (Recommended)

Vercel is the easiest way to deploy Next.js applications:

1. **Install Vercel CLI** (optional):
   ```bash
   npm install -g vercel
   ```

2. **Deploy via Vercel Dashboard**:
   - Push your code to GitHub, GitLab, or Bitbucket
   - Visit [vercel.com](https://vercel.com)
   - Import your repository
   - Configure environment variables in the Vercel dashboard:
     - `EXA_API_KEY`
     - `MISTRAL_API_KEY`
     - `ALLOWED_ORIGIN` (set to your production domain)
   - Deploy!

3. **Deploy via CLI**:
   ```bash
   vercel
   ```
   Follow the prompts and add environment variables when requested

**Documentation**: [Next.js Deployment](https://nextjs.org/docs/deployment)

### Netlify

1. Push your code to a Git repository
2. Visit [netlify.com](https://netlify.com) and create a new site
3. Connect your repository
4. Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `.next`
5. Add environment variables in Netlify dashboard:
   - `EXA_API_KEY`
   - `MISTRAL_API_KEY`
   - `ALLOWED_ORIGIN`
6. Deploy!

### Docker

1. **Create a Dockerfile**:
   ```dockerfile
   FROM node:18-alpine
   
   WORKDIR /app
   
   COPY package*.json ./
   RUN npm ci --only=production
   
   COPY . .
   RUN npm run build
   
   EXPOSE 3000
   
   CMD ["npm", "start"]
   ```

2. **Build and run**:
   ```bash
   docker build -t perplexity-clone .
   docker run -p 3000:3000 \
     -e EXA_API_KEY=your_key \
     -e MISTRAL_API_KEY=your_key \
     perplexity-clone
   ```

### Environment Variables for Production

When deploying to production, ensure you set:

- `EXA_API_KEY`: Your Exa AI API key
- `MISTRAL_API_KEY`: Your Mistral AI API key
- `ALLOWED_ORIGIN`: Your production domain (e.g., `https://yourdomain.com`)
- `NODE_ENV`: Set to `production` (usually automatic)

## Security Considerations

- ✅ API keys are stored server-side only (never exposed to client)
- ✅ Input sanitization prevents XSS attacks
- ✅ CORS configured for production domain
- ✅ HTTPS required in production
- ✅ No conversation history stored (stateless queries)

Run `npm run verify-security` to verify API credentials are not exposed.

## Usage

1. Enter your question in the search box
2. Press Enter or click the search button
3. Wait for the AI to search the web and generate an answer
4. View the synthesized answer with source citations
5. Click on sources to explore further

Each query is independent - no conversation history is maintained.

## Troubleshooting

### "Service configuration error"

- Verify your API keys are correctly set in `.env.local`
- Ensure there are no extra spaces or quotes around the keys
- Restart the development server after changing environment variables

### "Network error"

- Check your internet connection
- Verify the Exa and Mistral APIs are accessible from your network
- Check if you've exceeded API rate limits

### "Too many requests"

- You've hit the rate limit for Exa or Mistral API
- Wait a few moments before trying again
- Consider upgrading your API plan for higher limits

### Build Errors

- Delete `.next` folder and `node_modules`
- Run `npm install` again
- Try `npm run build` again

## Technology Stack

- **Framework**: Next.js 15+ with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **APIs**: Exa AI (search), Mistral AI (LLM)
- **Testing**: Vitest, React Testing Library, fast-check
- **Deployment**: Vercel, Netlify, or Docker

## Contributing

This is a minimal implementation focused on core functionality. Feel free to extend it with:

- Conversation history
- Multiple AI model options
- Advanced search filters
- User authentication
- Result caching
- Analytics

## License

[Your License Here]

## Support

For issues or questions:
- Check the [Exa AI Documentation](https://docs.exa.ai)
- Check the [Mistral AI Documentation](https://docs.mistral.ai)
- Review the [Next.js Documentation](https://nextjs.org/docs)

---

Built with ❤️ using Next.js, Exa AI, and Mistral AI
