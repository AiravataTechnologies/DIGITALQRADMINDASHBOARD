#!/bin/bash

# Vercel Deployment Script
# Run this script to deploy your restaurant management system to Vercel

echo "🚀 Starting Vercel Deployment Process..."

# Step 1: Build the project
echo "📦 Building the project..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed! Please fix the errors before deploying."
    exit 1
fi

echo "✅ Build successful!"

# Step 2: Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📥 Installing Vercel CLI..."
    npm install -g vercel
fi

# Step 3: Deploy to Vercel
echo "🌐 Deploying to Vercel..."
echo "📝 Make sure to set these environment variables in Vercel dashboard:"
echo "   MONGODB_URI=mongodb+srv://airavatatechnologiesprojects:Em8TkAdcVXOWAClC@digitalmenuqr.dyyiyen.mongodb.net/?retryWrites=true&w=majority&appName=DigitalMenuQR"
echo "   JWT_SECRET=your-super-secret-jwt-key"
echo "   SESSION_SECRET=your-session-secret-key"
echo "   FALLBACK_ADMIN_USERNAME=admin"
echo "   FALLBACK_ADMIN_PASSWORD=admin123"
echo "   NODE_ENV=production"
echo ""

# Deploy to Vercel
vercel --prod

echo "🎉 Deployment complete!"
echo "📋 Next steps:"
echo "   1. Set up environment variables in Vercel dashboard"
echo "   2. Configure MongoDB Atlas to allow connections from 0.0.0.0/0"
echo "   3. Test your application at the provided URL"
echo "   4. Login with admin credentials to verify everything works"