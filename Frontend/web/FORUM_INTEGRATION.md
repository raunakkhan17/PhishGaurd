# Forum API Integration

This document describes the forum integration features implemented in the PhishGuard application.

## Features Implemented

### 1. Forum Service (`src/services/forumService.ts`)
- **Create Forum Post**: POST `/api/community`
- **Get Forum Posts**: GET `/api/community` with filters and pagination
- **Get Categories**: GET `/api/community/categories`
- **Get Single Forum**: GET `/api/community/{forumId}`
- **Like Forum Post**: PUT `/api/community/{forumId}/like`
- **Add Comment**: POST `/api/community/{forumId}/comments`

### 2. Components Created

#### CommunityHub (`src/components/CommunityHub.tsx`)
- Displays list of forum posts with real-time data
- Implements search, category filtering, and sorting
- Pagination support
- Click to navigate to forum detail
- Toast notifications for success/error messages

#### ForumDetail (`src/components/ForumDetail.tsx`)
- Shows complete forum post with all details
- Displays comments section
- Allows adding new comments
- Like/unlike functionality
- Responsive design with header

#### CreateForumPost (`src/components/CreateForumPost.tsx`)
- Form to create new forum posts
- Category selection from API
- Tag management with static suggestions
- Validation and error handling
- Toast notifications

#### Toast (`src/components/Toast.tsx`)
- Reusable toast notification component
- Success and error message types
- Auto-dismiss functionality
- Responsive positioning

### 3. API Integration

#### Base URL
- Updated to use forum API: `https://2f27a217d424.ngrok-free.app/api`
- Includes ngrok-skip-browser-warning header

#### Authentication
- Uses existing auth token from localStorage
- Automatic 401 handling with redirect to login

### 4. Routing

#### New Routes Added
- `/forum/:forumId` - Forum detail page
- `/create-post` - Create new forum post

#### Navigation
- Forum posts are clickable and navigate to detail view
- "New Post" button navigates to create form
- Back buttons return to community hub

### 5. Data Management

#### State Management
- Real-time data fetching from API
- Optimistic updates for likes
- Local state for form inputs
- Error handling and loading states

#### Filtering & Pagination
- Category-based filtering
- Sort options: latest, oldest, most liked, most viewed
- Page-based pagination with configurable limits

### 6. UI/UX Features

#### Responsive Design
- Mobile-first approach
- Consistent with existing design system
- Smooth transitions and hover effects

#### User Experience
- Loading states and spinners
- Toast notifications for feedback
- Form validation
- Optimistic UI updates

#### Static Tags
Pre-defined tag suggestions include:
- phishing, email, banking, social-media
- workplace, education, scam, fraud
- security, awareness, training, incident
- prevention, detection, response, recovery

### 7. Error Handling

#### API Errors
- Network error handling
- Validation error display
- Graceful fallbacks for missing data

#### User Feedback
- Toast notifications for success/error
- Form validation messages
- Loading states during operations

## Usage

### Creating a Forum Post
1. Navigate to Community Hub
2. Click "New Post" button
3. Fill in title, content, category, and tags
4. Submit form
5. Redirected back with success message

### Viewing Forum Posts
1. Browse posts in Community Hub
2. Use filters and search
3. Click on any post to view details
4. Navigate through pagination

### Adding Comments
1. View forum detail page
2. Scroll to comments section
3. Type comment in input field
4. Press Enter or click Post button

### Liking Posts
1. Click like button on forum detail page
2. Optimistic update shows immediate feedback
3. API call updates server state

## Technical Details

### Dependencies
- React Router for navigation
- Axios for API calls
- Lucide React for icons
- Tailwind CSS for styling

### State Management
- React hooks for local state
- Context API for authentication
- No external state management libraries

### Performance
- Lazy loading of forum posts
- Pagination to limit data transfer
- Optimistic updates for better UX
- Debounced search (can be implemented)

## Future Enhancements

### Potential Improvements
- Real-time updates with WebSocket
- Advanced search with filters
- User profile pages
- Forum post editing/deletion
- Rich text editor for posts
- Image upload support
- Email notifications
- Forum moderation tools

### Scalability Considerations
- Implement virtual scrolling for large lists
- Add caching layer for frequently accessed data
- Implement search indexing
- Add rate limiting for API calls
