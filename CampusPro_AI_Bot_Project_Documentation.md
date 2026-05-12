# 🎓 CampusPro AI Bot - Complete Project Documentation

## 📋 Project Overview

**CampusPro AI Bot** is a comprehensive AI-powered college companion application built with the MERN stack (MongoDB, Express.js, React, Node.js) integrated with Google Gemini AI. The application serves as an intelligent assistant for college students, providing specialized AI chat experiences across multiple domains including academics, career guidance, event planning, and emotional support.

---

## 🏗️ Architecture & Tech Stack

### Frontend (React + Vite)
- **Framework**: React 18.2.0 with React Router DOM 6.22.0
- **Build Tool**: Vite 5.0.0
- **Styling**: Pure CSS with custom design system
- **HTTP Client**: Axios 1.6.0
- **Key Features**:
  - Responsive mobile-first design
  - Real-time chat interface
  - File upload support (PDF, DOCX, images, text files)
  - Voice input capability
  - Session management and history
  - Multi-mode AI conversations

### Backend (Node.js + Express)
- **Runtime**: Node.js ≥18.0.0
- **Framework**: Express.js 4.18.0
- **Database**: MongoDB with Mongoose ODM 8.1.0
- **AI Integration**: Google Gemini AI 0.21.0
- **Authentication**: JWT (jsonwebtoken 9.0.0) + bcryptjs 2.4.3
- **File Processing**: Multer 2.1.1, pdf-parse 2.4.5, mammoth 1.12.0
- **Security**: CORS, Rate Limiting (express-rate-limit 7.2.0)

### Database Schema
```javascript
// User Model
{
  email: String (required, unique),
  password: String (required, hashed),
  nickname: String,
  createdAt: Date,
  updatedAt: Date
}

// Chat Session Model
{
  userId: ObjectId (ref: User),
  mode: String (enum: ['study', 'placement', 'fest', 'rant']),
  title: String,
  messages: [{
    sender: String (enum: ['user', 'bot']),
    message: String,
    attachment: {
      name: String,
      type: String,
      size: Number,
      data: String (base64)
    },
    timestamp: Date
  }],
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🎯 Core Features

### 1. Multi-Mode AI Chat System
The application features four specialized AI chat modes, each with unique personalities and capabilities:

#### 📚 Study Mode (Default)
- **Purpose**: Academic assistance and doubt clearing
- **AI Personality**: StudyBot - patient, knowledgeable tutor
- **Capabilities**:
  - Subject-specific explanations
  - CGPA calculations
  - Study planning
  - Concept clarification
- **Welcome Message**: "Hi [Name]! 📚 I'm StudyBot. Any doubts, CGPA calculations, or concepts you're struggling with?"

#### 💼 Placement Mode
- **Purpose**: Career guidance and interview preparation
- **AI Personality**: Placement mentor - professional career coach
- **Capabilities**:
  - Resume review and optimization
  - Interview preparation
  - Career advice
  - Job search strategies
- **Welcome Message**: "Welcome [Name]! 💼 I'm your placement mentor. Let's crack those interviews together."

#### 🎉 Fest Mode
- **Purpose**: College event planning and entertainment
- **AI Personality**: FestBot - energetic event coordinator
- **Capabilities**:
  - Event planning assistance
  - Creative ideas for college fests
  - Budget management
  - Entertainment suggestions
- **Welcome Message**: "Hey [Name]! 🎉 I'm FestBot! Ask me anything about college fests, events, or how to make yours legendary!"

#### 😤 Rant Mode
- **Purpose**: Emotional support and stress relief
- **AI Personality**: Supportive friend with humor
- **Capabilities**:
  - Emotional validation
  - Stress management advice
  - Humorous perspective
  - Coping strategies
- **Welcome Message**: "Yooo [Name] 😤 Rant Mode activated! What's bothering you today? I'm all ears (and maybe a few jokes 😂)"

### 2. Advanced File Processing
- **Supported Formats**: PDF, DOCX, images (PNG/JPG), text files
- **Processing Libraries**:
  - PDF parsing with pdf-parse
  - Word document processing with mammoth
  - Image handling with native File API
- **Features**:
  - Drag & drop interface
  - File type validation
  - Size limits and security checks
  - Base64 encoding for storage

### 3. Voice Input Integration
- **Technology**: Web Speech API (SpeechRecognition)
- **Languages**: English (en-IN), fallback to en-US
- **Features**:
  - Real-time speech recognition
  - Visual feedback during recording
  - Error handling for unsupported browsers
  - Seamless integration with text chat

### 4. Session Management
- **Persistent Sessions**: LocalStorage + MongoDB
- **Features**:
  - Auto-save conversations
  - Session restoration
  - Chat history export (JSON/Text)
  - Session renaming and deletion

### 5. User Authentication
- **Registration/Login**: Email + password
- **Security**: JWT tokens, password hashing
- **Features**: Nickname customization, session persistence

---

## 📁 Project Structure

```
CampusPro-AI_Bot-master/
├── client/                          # React Frontend
│   ├── public/
│   │   └── vite.svg
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   └── Navbar.jsx       # Navigation component
│   │   │   └── shared/
│   │   │       └── index.jsx        # Shared components
│   │   ├── context/
│   │   │   └── AppContext.jsx       # Global state management
│   │   ├── pages/                   # Main application pages
│   │   │   ├── ChatHub.jsx          # Main chat interface
│   │   │   ├── BrainSpace.jsx       # Brainstorming tool
│   │   │   ├── TalentArena.jsx      # Talent showcase
│   │   │   ├── CreatorCorner.jsx    # Content creation
│   │   │   ├── PlacementDojo.jsx    # Career preparation
│   │   │   ├── History.jsx          # Chat history
│   │   │   ├── Login.jsx            # Authentication
│   │   │   └── Register.jsx         # User registration
│   │   ├── styles/
│   │   │   └── main.css             # Global styles
│   │   ├── utils/
│   │   │   └── api.js               # API client
│   │   └── main.jsx                 # React entry point
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── vercel.json
│
├── server/                          # Node.js Backend
│   ├── config/
│   │   ├── db.js                    # MongoDB connection
│   │   └── gemini.js                # Gemini AI configuration
│   ├── middleware/
│   │   ├── auth.js                  # JWT authentication
│   │   ├── errorHandler.js          # Error handling
│   │   └── rateLimiter.js           # API rate limiting
│   ├── models/
│   │   └── index.js                 # MongoDB schemas
│   ├── prompts/
│   │   └── allPrompts.js            # AI system prompts
│   ├── routes/                      # API endpoints
│   │   ├── auth.js                  # Authentication routes
│   │   ├── chat.js                  # Chat functionality
│   │   ├── brainstorm.js            # Brainstorming routes
│   │   ├── creator.js               # Creator routes
│   │   ├── placement.js             # Placement routes
│   │   └── talent.js                # Talent routes
│   ├── utils/
│   │   └── fileProcessor.js         # File processing utilities
│   ├── index.js                     # Server entry point
│   ├── setup.js                     # Interactive setup script
│   └── package.json
│
├── DEPLOY.md                        # Deployment guide
├── README.md                        # Quick start guide
└── render.yaml                      # Render deployment config
```

---

## 🔧 Installation & Setup

### Prerequisites
- Node.js ≥18.0.0
- MongoDB Atlas account
- Google Gemini API key

### Step 1: Clone and Install Dependencies
```bash
git clone https://github.com/Hitesh0023/campus-assist-ai.git
cd campus-assist-ai

# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### Step 2: Environment Configuration
```bash
cd server
node setup.js  # Interactive setup (recommended)
```

Or create `.env` manually:
```env
MONGO_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/campusbot
GEMINI_API_KEY=AIzaSy_YOUR_GEMINI_API_KEY_HERE
PORT=5002
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

### Step 3: Start Development Servers
```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
cd client
npm run dev
```

### Step 4: Access Application
Open http://localhost:5173 in your browser

---

## 🚀 Deployment

### Production Hosting
- **Frontend**: Vercel (free tier)
- **Backend**: Render (free tier)
- **Database**: MongoDB Atlas (free tier)
- **AI**: Google Gemini (free tier available)

### Deployment Steps
1. **Database**: Create MongoDB Atlas cluster
2. **Backend**: Deploy to Render with environment variables
3. **Frontend**: Deploy to Vercel with backend URL
4. **Update CORS**: Add production URLs to allowed origins

---

## 🎨 Design System

### Color Palette
```css
:root {
  /* Brand Colors */
  --violet: #7C3AED;        /* Primary brand color */
  --violet-light: #A855F7;  /* Light violet */
  --violet-dim: #3B0764;    /* Dark violet */

  --amber: #F59E0B;         /* Fest mode */
  --green: #10B981;         /* Study mode */
  --red: #EF4444;           /* Error states */
  --pink: #EC4899;          /* Rant mode */
  --cyan: #06B6D4;          /* Placement mode */

  /* Backgrounds */
  --bg: #080810;            /* Main background */
  --bg-card: #10101E;       /* Card backgrounds */
  --bg-elevated: #16162A;   /* Elevated elements */
  --bg-input: #1A1A30;      /* Input fields */
  --bg-hover: #1E1E38;      /* Hover states */

  /* Text */
  --text: #F0EDFF;          /* Primary text */
  --text-muted: #7A7A9D;    /* Secondary text */
  --text-subtle: #3D3D5C;   /* Tertiary text */
}
```

### Typography
- **Display Font**: Syne (Google Fonts)
- **Body Font**: DM Sans (Google Fonts)
- **Font Scale**: Responsive typography with proper hierarchy

### Component Patterns
- **Cards**: Rounded corners (14px-20px), subtle borders, hover effects
- **Buttons**: Consistent padding, hover animations, color-coded by function
- **Inputs**: Dark theme, focus states, validation feedback
- **Navigation**: Mobile-first responsive design

---

## 🔒 Security Features

### Authentication & Authorization
- **JWT Tokens**: Stateless authentication with refresh tokens
- **Password Hashing**: bcryptjs with salt rounds
- **Session Management**: Secure token storage and validation

### API Security
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **CORS**: Configured for specific origins
- **Input Validation**: Server-side validation for all inputs
- **File Upload Security**: Type validation, size limits, content scanning

### Data Protection
- **Environment Variables**: Sensitive data never in code
- **HTTPS**: Enforced in production
- **Error Handling**: No sensitive information in error responses

---

## 📱 Mobile Optimization

### Responsive Design
- **Breakpoint**: 900px mobile/desktop switch
- **Mobile Navigation**: Hamburger menu with slide-out drawer
- **Touch Interactions**: Optimized button sizes (44px minimum)
- **Cursor Behavior**: Auto cursor with pointer for interactive elements

### Mobile-Specific Features
- **Quick Actions**: New Chat and History buttons in navbar
- **Compact Layout**: Optimized spacing and typography
- **Touch Gestures**: Swipe-friendly interface elements
- **Performance**: Lazy loading and optimized bundles

---

## 🔄 API Endpoints

### Authentication Routes (`/api/auth`)
```
POST /api/auth/register     # User registration
POST /api/auth/login        # User login
GET  /api/auth/me          # Get current user
```

### Chat Routes (`/api/chat`)
```
POST /api/chat              # Send message (with file support)
GET  /api/chat/history/:id  # Get chat session
POST /api/chat/sessions     # Create/update session
GET  /api/chat/sessions     # List user sessions
PATCH /api/chat/sessions/:id # Update session (rename)
DELETE /api/chat/sessions/:id # Delete session
```

### Specialized Routes
```
POST /api/brainstorm        # Brainstorming assistance
POST /api/talent           # Talent showcase
POST /api/creator          # Content creation
POST /api/placement        # Career guidance
```

---

## 🤖 AI Integration

### Google Gemini Configuration
```javascript
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: 'gemini-pro',
  generationConfig: {
    temperature: 0.7,
    topK: 40,
    topP: 0.95,
    maxOutputTokens: 2048,
  }
});
```

### System Prompts
Each chat mode has specialized system prompts stored in `/server/prompts/allPrompts.js`:

- **Study Mode**: Academic focus with patient, explanatory tone
- **Placement Mode**: Professional career guidance
- **Fest Mode**: Creative, energetic event planning
- **Rant Mode**: Empathetic emotional support with humor

### Context Management
- **Session History**: Full conversation context maintained
- **File Context**: Uploaded documents processed and included in prompts
- **User Preferences**: Nickname and personalization data

---

## 🧪 Testing & Quality Assurance

### Development Workflow
1. **Local Development**: Hot reload with Vite and Nodemon
2. **Environment Setup**: Automated setup script for easy onboarding
3. **Error Handling**: Comprehensive error boundaries and logging
4. **Code Quality**: ESLint configuration and consistent formatting

### Performance Optimization
- **Bundle Splitting**: Code splitting with Vite
- **Image Optimization**: Lazy loading and responsive images
- **Caching**: Browser caching and CDN optimization
- **Database Indexing**: Optimized MongoDB queries

---

## 📊 Interview Questions & Answers

### Project Overview Questions

**Q: Can you walk us through the CampusPro AI Bot project?**
A: CampusPro AI Bot is a comprehensive AI-powered college companion application I built using the MERN stack with Google Gemini AI integration. The application serves as an intelligent assistant for college students across four specialized domains: academics, career guidance, event planning, and emotional support. The frontend is built with React and Vite, featuring a responsive design with real-time chat capabilities, while the backend uses Node.js, Express, and MongoDB for data persistence and user management.

**Q: What was your motivation for building this project?**
A: As a college student myself, I noticed that students often struggle with finding the right resources for different aspects of college life - from academic doubts to career guidance to event planning. I wanted to create a single, intelligent platform that could serve as a comprehensive companion, using AI to provide personalized, context-aware assistance across multiple domains.

### Technical Architecture Questions

**Q: Why did you choose the MERN stack for this project?**
A: The MERN stack was ideal because:
- **MongoDB**: Flexible document-based storage perfect for chat sessions with varying message structures and file attachments
- **Express.js**: Lightweight and fast for building REST APIs with middleware support
- **React**: Component-based architecture ideal for complex chat interfaces and real-time updates
- **Node.js**: Single language across stack simplifies development and deployment

**Q: How did you implement the multi-mode AI chat system?**
A: I created four distinct AI personalities (StudyBot, Placement Mentor, FestBot, Rant Mode) each with specialized system prompts. The system maintains separate conversation contexts for each mode, allowing users to switch between domains while preserving their conversation history. Each mode has unique welcome messages, color schemes, and AI behavior tailored to its purpose.

**Q: How do you handle file uploads and processing?**
A: I implemented a comprehensive file processing system using:
- **Multer**: For handling multipart/form-data uploads
- **File Type Validation**: Server-side checks for PDF, DOCX, images, and text files
- **Content Processing**: pdf-parse for PDFs, mammoth for Word documents, base64 encoding for images
- **Security**: File size limits, type restrictions, and content validation
- **Storage**: Files converted to base64 and stored in MongoDB alongside chat messages

### Frontend Development Questions

**Q: How did you implement the responsive mobile design?**
A: I used a mobile-first approach with:
- **CSS Media Queries**: Breakpoint at 900px for mobile/desktop switching
- **Flexible Layouts**: CSS Grid and Flexbox for adaptive layouts
- **Mobile Navigation**: Hamburger menu with slide-out drawer
- **Touch Optimization**: Minimum 44px touch targets, swipe-friendly interfaces
- **Performance**: Optimized CSS with minimal repaints and reflows

**Q: How do you manage application state?**
A: I implemented a React Context-based state management system:
- **AppContext**: Global state for user authentication and preferences
- **Local State**: Component-level state for UI interactions
- **Persistence**: localStorage for session data, MongoDB for chat history
- **Real-time Updates**: useEffect hooks for reactive state updates

### Backend Development Questions

**Q: How did you integrate Google Gemini AI?**
A: I created a dedicated configuration module that:
- Initializes the GoogleGenerativeAI client with API key
- Configures generation parameters (temperature, token limits)
- Handles prompt engineering for different chat modes
- Manages conversation context and file attachments
- Implements error handling and rate limiting

**Q: How do you ensure API security and rate limiting?**
A: I implemented multiple security layers:
- **JWT Authentication**: Stateless token-based auth with refresh mechanisms
- **Rate Limiting**: express-rate-limit with 100 requests per 15 minutes per IP
- **CORS**: Configured for specific allowed origins
- **Input Validation**: Server-side validation for all API inputs
- **Password Security**: bcryptjs hashing with salt rounds

### Database Design Questions

**Q: How did you design the database schema?**
A: I created two main collections:
- **Users**: Email, hashed password, nickname, timestamps
- **Chat Sessions**: User reference, mode, title, messages array with attachments
The schema supports flexible message structures with embedded file data, allowing for complex chat histories with multimedia content.

**Q: How do you handle session persistence and restoration?**
A: I implemented a dual-storage approach:
- **Short-term**: localStorage for immediate session restoration
- **Long-term**: MongoDB for permanent chat history storage
- **Auto-save**: Sessions automatically saved after each message
- **Recovery**: URL-based session loading with error handling

### Deployment & DevOps Questions

**Q: How did you deploy this application to production?**
A: I used a microservices deployment approach:
- **Frontend**: Vercel for static hosting with automatic builds
- **Backend**: Render for Node.js hosting with environment variables
- **Database**: MongoDB Atlas for cloud database
- **Configuration**: Environment-specific settings for development/production
- **CORS**: Dynamic origin handling for multiple deployment environments

**Q: What challenges did you face with file uploads?**
A: File uploads presented several challenges:
- **Size Limits**: Implementing proper file size validation and chunking
- **Type Security**: Preventing malicious file uploads through type checking
- **Processing**: Handling different file formats (PDF, DOCX, images) with appropriate libraries
- **Storage**: Converting files to base64 for MongoDB storage while maintaining performance
- **UI/UX**: Creating intuitive drag-and-drop interfaces with progress feedback

### Performance & Optimization Questions

**Q: How did you optimize the application performance?**
A: I implemented several optimization strategies:
- **Frontend**: Code splitting with Vite, lazy loading, optimized CSS
- **Backend**: Database indexing, query optimization, caching
- **Assets**: Image optimization, font loading optimization
- **Network**: Compression, CDN usage, efficient API responses
- **Mobile**: Touch event optimization, reduced repaints

**Q: How do you handle real-time chat updates?**
A: I implemented a polling-based real-time system:
- **Message Updates**: Automatic scrolling to latest messages
- **Typing Indicators**: Visual feedback during AI responses
- **State Synchronization**: Consistent state across components
- **Error Recovery**: Graceful handling of network interruptions

### Future Enhancements Questions

**Q: What features would you add next?**
A: Future enhancements could include:
- **Real-time Collaboration**: Multi-user chat sessions
- **Voice Responses**: Text-to-speech for AI responses
- **Advanced Analytics**: Chat insights and usage patterns
- **Integration APIs**: Calendar integration, assignment tracking
- **Mobile App**: React Native companion app
- **Offline Mode**: Cached responses for offline access

**Q: How would you scale this application?**
A: For scaling, I would:
- **Microservices**: Split into separate services (auth, chat, file processing)
- **Database**: Implement read replicas and sharding
- **Caching**: Redis for session caching and API response caching
- **CDN**: Global content delivery for static assets
- **Load Balancing**: Multiple server instances with load distribution
- **Monitoring**: Application performance monitoring and alerting

---

## 🎯 Key Achievements

### Technical Accomplishments
1. **Full-Stack Development**: Complete MERN application with production deployment
2. **AI Integration**: Successful integration with Google Gemini AI across multiple domains
3. **File Processing**: Comprehensive file upload and processing system
4. **Mobile Optimization**: Responsive design with touch-friendly interactions
5. **Security Implementation**: JWT authentication, rate limiting, input validation
6. **Database Design**: Efficient MongoDB schema for complex chat data

### User Experience Achievements
1. **Intuitive Interface**: Clean, modern design with consistent interactions
2. **Multi-Modal Experience**: Four distinct AI personalities with unique experiences
3. **Accessibility**: Mobile-first design with proper touch targets and navigation
4. **Performance**: Fast loading times and smooth interactions
5. **Persistence**: Seamless session management and history access

### Development Achievements
1. **Code Quality**: Well-structured, documented, and maintainable codebase
2. **Deployment Automation**: Streamlined deployment process with multiple hosting providers
3. **Error Handling**: Comprehensive error boundaries and user feedback
4. **Testing Setup**: Development environment with hot reloading and debugging

---

## 📞 Contact & Support

**Developer**: Hitesh Kumar
**GitHub**: https://github.com/Hitesh0023/campus-assist-ai
**LinkedIn**: [Your LinkedIn Profile]

**Technologies Used**:
- Frontend: React, Vite, CSS
- Backend: Node.js, Express.js, MongoDB
- AI: Google Gemini API
- Hosting: Vercel, Render, MongoDB Atlas

---

*This documentation provides a comprehensive overview of the CampusPro AI Bot project, suitable for portfolio presentations, job interviews, and technical discussions.*