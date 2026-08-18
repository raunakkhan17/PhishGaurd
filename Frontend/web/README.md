# PhishGuard - Advanced Threat Protection

A React-based web application with integrated authentication system for advanced threat protection and community features.

## Features

- **Authentication System**: Complete login/register functionality with JWT tokens
- **Protected Routes**: Automatic redirection for unauthenticated users
- **Modern UI**: Beautiful, responsive design with Tailwind CSS
- **Real-time API Integration**: Secure API communication with interceptors
- **Error Handling**: Comprehensive error boundaries and user feedback

## Authentication Flow

### Login
- Users can sign in with email and password
- JWT token is stored in localStorage
- Automatic redirection to main application

### Register
- New users can create accounts with name, email, and password
- Automatic login after successful registration
- Form validation and error handling

### Protected Routes
- All main application routes require authentication
- Unauthenticated users are redirected to login page
- Automatic token validation and refresh handling

## API Integration

The application uses a centralized API configuration with:

- **Base URL**: Configurable API endpoint
- **Request Interceptors**: Automatic token injection
- **Response Interceptors**: 401 error handling and logout
- **Error Handling**: Graceful fallbacks and user notifications

### API Endpoints

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout

## Project Structure

```
src/
├── components/          # React components
│   ├── Header.tsx      # Navigation with auth buttons
│   ├── Login.tsx       # Login/Register form
│   ├── ProtectedRoute.tsx # Route protection
│   └── LoadingSpinner.tsx # Loading states
├── contexts/           # React contexts
│   └── AuthContext.tsx # Authentication state management
├── services/           # API services
│   └── authService.ts  # Authentication API calls
├── lib/                # Utility libraries
│   └── api.ts         # Axios configuration
└── App.tsx            # Main application with routing
```

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure API endpoint in `src/lib/api.ts`:
   ```typescript
   const API_BASE_URL = 'your-api-endpoint';
   ```

3. Start development server:
   ```bash
   npm run dev
   ```

## Dependencies

- **React 18** - UI framework
- **React Router** - Client-side routing
- **Axios** - HTTP client with interceptors
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Icon library
- **TypeScript** - Type safety

## Security Features

- JWT token-based authentication
- Automatic token injection in API requests
- Secure token storage in localStorage
- Automatic logout on 401 responses
- Protected route implementation
- Input validation and sanitization

## UI Components

### Header
- Dynamic navigation based on authentication state
- User avatar and logout button when authenticated
- Login/Register buttons when not authenticated
- Responsive design for mobile and desktop

### Login Form
- Toggle between login and register modes
- Password visibility toggle
- Form validation and error display
- Loading states during API calls
- Beautiful gradient design with Tailwind CSS

### Loading States
- Consistent loading spinners throughout the app
- Skeleton loading for better UX
- Loading indicators for form submissions

## Error Handling

- **Error Boundaries**: Catch React errors gracefully
- **API Error Handling**: User-friendly error messages
- **Form Validation**: Real-time input validation
- **Network Error Handling**: Graceful fallbacks for API failures

## Contributing

1. Follow the existing code structure
2. Use TypeScript for type safety
3. Implement proper error handling
4. Add loading states for async operations
5. Test authentication flows thoroughly

## License

This project is licensed under the MIT License.
