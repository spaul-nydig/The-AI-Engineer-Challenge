# 🚀 AI Chat Interface Frontend

Welcome to the most awesome AI chat interface built with Next.js! This frontend provides a beautiful and intuitive way to interact with OpenAI's GPT models through our FastAPI backend.

## 🎯 Features

- **Beautiful UI**: Clean, modern design with excellent visual contrast
- **Streaming Responses**: Real-time streaming of AI responses for a smooth chat experience
- **Secure API Key Input**: Password-protected field for your OpenAI API key
- **Model Selection**: Choose from different GPT models (GPT-4.1 Mini, GPT-4, GPT-3.5 Turbo)
- **System Messages**: Customize the AI's behavior with system/developer messages
- **Responsive Design**: Works perfectly on desktop and mobile devices
- **Error Handling**: Robust error handling with helpful user feedback

## 🛠️ Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn package manager
- An OpenAI API key

### Installation

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open your browser and navigate to [http://localhost:3000](http://localhost:3000)

### Building for Production

To build the application for production:

```bash
npm run build
```

To start the production server:

```bash
npm start
```

## 🎮 How to Use

1. **Enter your OpenAI API Key**: In the API Key field (password protected for security)
2. **Select a Model**: Choose your preferred GPT model from the dropdown
3. **Set System Message** (Optional): Customize how the AI behaves
4. **Start Chatting**: Type your message and hit Send!

## 🔧 Configuration

The frontend is configured to work with the FastAPI backend running on the same domain. The API endpoints are:

- `POST /api/chat` - Send messages to the AI
- `GET /api/health` - Check backend health

## 🎨 Tech Stack

- **Next.js 15** - React framework for production
- **TypeScript** - Type safety and better developer experience
- **Tailwind CSS** - Utility-first CSS framework for styling
- **React Hooks** - State management and side effects

## 📦 Deployment

This frontend is configured for deployment on Vercel:

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Deploy automatically!

The `vercel.json` configuration handles routing for both the frontend and backend.

## 🔐 Security Notes

- API keys are handled securely with password input fields
- All sensitive data is transmitted over HTTPS in production
- No API keys are stored in localStorage or cookies

## 🎯 Development Notes

This frontend follows the guidelines from `.cursor/rules`:
- ✅ Excellent visual clarity and contrast
- ✅ Pleasant UX with proper component sizing
- ✅ Password-style input for sensitive information
- ✅ Built with Next.js for Vercel compatibility
- ✅ Locally testable with clear run instructions

## 🚀 What's Next?

- Add chat history persistence
- Implement user authentication
- Add more customization options
- Support for file uploads
- Dark mode toggle

Happy chatting! 🎉
