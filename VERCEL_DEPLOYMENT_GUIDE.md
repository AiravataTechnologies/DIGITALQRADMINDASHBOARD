# Vercel Deployment Guide

## Quick Deploy Steps

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit for Vercel deployment"
   git branch -M main
   git remote add origin https://github.com/yourusername/your-repo.git
   git push -u origin main
   ```

2. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Configure environment variables (see below)
   - Deploy!

## Environment Variables Setup

In your Vercel dashboard, add these environment variables:

```
MONGODB_URI=mongodb+srv://airavatatechnologiesprojects:Em8TkAdcVXOWAClC@digitalmenuqr.dyyiyen.mongodb.net/?retryWrites=true&w=majority&appName=DigitalMenuQR
JWT_SECRET=your-super-secret-jwt-key-here
SESSION_SECRET=your-session-secret-key-here
FALLBACK_ADMIN_USERNAME=admin
FALLBACK_ADMIN_PASSWORD=admin123
NODE_ENV=production
```

## Build Configuration

The project is configured with:
- **Framework Preset**: Other
- **Build Command**: `npm run build`
- **Output Directory**: `dist/public`
- **Install Command**: `npm install`

## Important Notes

1. **Domain Configuration**: After deployment, update the CORS configuration in your server code to include your Vercel domain.

2. **MongoDB Connection**: The MongoDB URI is already configured to use your Atlas database.

3. **Static Files**: The frontend will be served from `/dist/public` after the build process.

4. **API Routes**: All API routes will be available at `https://your-domain.vercel.app/api/*`

5. **Admin Login**: Use the fallback admin credentials or your existing MongoDB admin user.

## Testing Deployment

1. Visit `https://your-domain.vercel.app` for the frontend
2. Test API with `https://your-domain.vercel.app/api/health`
3. Login at `https://your-domain.vercel.app` with admin credentials

## Troubleshooting

- Check Vercel function logs if API calls fail
- Verify environment variables are set correctly
- Ensure MongoDB Atlas allows connections from all IP addresses (0.0.0.0/0) for Vercel functions
- Check that your MongoDB user has proper read/write permissions

## MongoDB Atlas Configuration

1. Go to MongoDB Atlas Dashboard
2. Navigate to Network Access
3. Add IP Address: `0.0.0.0/0` (Allow access from anywhere)
4. Ensure your database user has `readWrite` permissions

Your application will be fully functional on Vercel with all existing features preserved!