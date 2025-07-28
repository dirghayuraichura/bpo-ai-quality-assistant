# Contact Center AI Analysis Frontend

A modern React frontend application for the Contact Center AI Analysis system, built with Next.js 15, TypeScript, Tailwind CSS, and shadcn/ui components.

## Features

- 🎨 **Modern UI**: Clean, responsive design with shadcn/ui components
- 📱 **Mobile Responsive**: Optimized for all device sizes
- 🚀 **Fast Performance**: Built with Next.js 15 and optimized for speed
- 🔄 **Real-time Updates**: Live status updates and progress indicators
- 📊 **Interactive Dashboards**: Comprehensive analytics and insights
- 🎯 **Workflow Integration**: Seamless flow from upload to coaching
- 🔍 **Advanced Filtering**: Search and filter capabilities
- 📤 **Export Functionality**: Download transcripts and coaching plans

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Icons**: Lucide React
- **Forms**: React Hook Form with Zod validation
- **HTTP Client**: Axios
- **Notifications**: Sonner (Toast notifications)
- **State Management**: React hooks (useState, useEffect)

## Project Structure

```
frontend/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── page.tsx           # Dashboard
│   │   ├── upload/page.tsx    # Upload page
│   │   ├── transcripts/page.tsx # Transcripts page
│   │   ├── analysis/page.tsx  # Analysis page
│   │   ├── coaching/page.tsx  # Coaching page
│   │   ├── layout.tsx         # Root layout
│   │   └── globals.css        # Global styles
│   ├── components/
│   │   ├── ui/                # shadcn/ui components
│   │   └── layout/            # Layout components
│   │       ├── Header.tsx     # Navigation header
│   │       └── Layout.tsx     # Main layout wrapper
│   └── lib/
│       └── api.ts             # API service layer
├── public/                    # Static assets
├── package.json
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Backend API running on `http://localhost:3001`

### Installation

1. **Navigate to the frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Create .env.local file
   echo "NEXT_PUBLIC_API_URL=http://localhost:3001" > .env.local
   ```

4. **Start the development server**
```bash
npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

## Environment Variables

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## Pages Overview

### Dashboard (`/`)
- Overview statistics and metrics
- Quick action cards
- Recent activity feed
- Navigation to other sections

### Upload (`/upload`)
- Drag and drop file upload
- File validation (WAV, MP3, 50MB limit)
- Upload progress indicators
- Recent uploads list
- Auto-navigation to transcripts

### Transcripts (`/transcripts`)
- List of all transcripts
- Confidence scores and metadata
- Detailed transcript viewer
- Export functionality
- Auto-navigation to analysis

### Analysis (`/analysis`)
- AI analysis results
- Sentiment analysis
- Communication metrics
- Compliance assessment
- Detailed insights with tabs
- Auto-navigation to coaching

### Coaching (`/coaching`)
- Coaching plan overview
- Performance scores and levels
- Strengths and improvement areas
- Action items and training recommendations
- Export coaching plans

## API Integration

The frontend integrates with the backend API through the `apiService` in `src/lib/api.ts`:

### Key Features
- **Type-safe API calls**: Full TypeScript integration
- **Error handling**: Comprehensive error management
- **Loading states**: Progress indicators and loading spinners
- **Toast notifications**: User feedback for all actions
- **Auto-navigation**: Seamless workflow between pages

### API Endpoints Used
- `GET /api/health` - Health check
- `GET /api/status` - Service status
- `POST /api/upload` - Upload audio files
- `GET /api/upload` - List uploaded files
- `POST /api/transcript/:audioFileId` - Transcribe audio
- `GET /api/transcript` - List transcripts
- `POST /api/analysis/:transcriptId` - Analyze transcript
- `GET /api/analysis` - List analyses
- `POST /api/coaching/:analysisId` - Generate coaching plan
- `GET /api/coaching` - List coaching plans

## Component Architecture

### Layout Components
- **Header**: Navigation with mobile menu
- **Layout**: Main wrapper with toast notifications

### UI Components (shadcn/ui)
- **Button**: Various button styles and states
- **Card**: Content containers with headers
- **Badge**: Status indicators
- **Progress**: Loading and progress bars
- **Tabs**: Tabbed content organization
- **Form**: Form components with validation
- **Toast**: Notification system

### Custom Components
- **API Service**: Centralized API communication
- **File Upload**: Drag and drop functionality
- **Modal Dialogs**: Detailed content viewers
- **Status Indicators**: Loading and error states

## Styling

The application uses Tailwind CSS with a custom design system:

### Color Palette
- **Primary**: Blue (#3B82F6)
- **Success**: Green (#10B981)
- **Warning**: Yellow (#F59E0B)
- **Error**: Red (#EF4444)
- **Neutral**: Gray scale

### Typography
- **Font**: Inter (Google Fonts)
- **Weights**: 400, 500, 600, 700
- **Sizes**: Responsive text sizing

### Spacing
- **Grid**: 8px base unit
- **Gaps**: 1.5rem (24px) standard
- **Padding**: Consistent spacing system

## Performance Optimizations

- **Code Splitting**: Automatic with Next.js
- **Image Optimization**: Next.js Image component
- **Bundle Analysis**: Built-in performance monitoring
- **Lazy Loading**: Components loaded on demand
- **Caching**: API response caching
- **Minification**: Production build optimization

## Browser Support

- **Modern Browsers**: Chrome, Firefox, Safari, Edge
- **Mobile**: iOS Safari, Chrome Mobile
- **Minimum**: ES2020 support required

## Development Workflow

1. **Feature Development**
   - Create feature branch
   - Implement with TypeScript
   - Add proper error handling
   - Test with mock data
   - Update API integration

2. **Testing**
   - Manual testing on different devices
   - API integration testing
   - Error scenario testing
   - Performance testing

3. **Deployment**
   - Build optimization
   - Environment configuration
   - API endpoint updates
   - Monitoring setup

## Troubleshooting

### Common Issues

1. **API Connection Errors**
   - Check backend server is running
   - Verify `NEXT_PUBLIC_API_URL` in `.env.local`
   - Check CORS configuration

2. **Build Errors**
   - Clear `.next` folder
   - Reinstall dependencies
   - Check TypeScript errors

3. **Styling Issues**
   - Verify Tailwind CSS configuration
   - Check component imports
   - Clear browser cache

### Debug Mode

Enable debug logging by adding to `.env.local`:
```env
NEXT_PUBLIC_DEBUG=true
```

## Contributing

1. Follow the existing code style
2. Add proper TypeScript types
3. Include error handling
4. Test on multiple devices
5. Update documentation

## License

This project is licensed under the ISC License.

## Support

For technical support or questions:
- Check the API documentation
- Review browser console for errors
- Verify environment configuration
- Test with sample audio files
