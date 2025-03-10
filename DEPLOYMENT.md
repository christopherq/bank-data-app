# Deploying Bank Data App to Koyeb

This guide provides step-by-step instructions for deploying the Bank Data App to Koyeb.

## Prerequisites

1. A GitHub account
2. A Koyeb account (sign up at [app.koyeb.com](https://app.koyeb.com/auth/signup))
3. Your GoCardless API credentials (SECRET_ID and SECRET_KEY)

## Deployment Steps

### 1. Push Your Code to GitHub

First, push your code to GitHub using the provided script:

```bash
# Make the script executable if not already
chmod +x setup-github.sh

# Run the script with your GitHub username
./setup-github.sh YOUR_GITHUB_USERNAME
```

Follow the prompts to create a GitHub repository and push your code.

### 2. Deploy to Koyeb

#### Option 1: Using the Koyeb Web Interface

1. Log in to your Koyeb account at [app.koyeb.com](https://app.koyeb.com)
2. Click on "Create App"
3. Select "GitHub" as the deployment method
4. Connect your GitHub account if not already connected
5. Select the "bank-data-app" repository
6. Configure your app with the following settings:
   - **Name**: bank-data-app
   - **Region**: Choose a region close to your users (e.g., fra for Europe)
   - **Instance Type**: Nano (free tier)
   - **Build Settings**: Buildpack (Node.js)
   - **Start Command**: node server.js
   - **Environment Variables**: 
     - Add SECRET_ID with your GoCardless Secret ID
     - Add SECRET_KEY with your GoCardless Secret Key
7. Click "Deploy"

#### Option 2: Using the Koyeb CLI

1. Install the Koyeb CLI:
   ```bash
   # macOS
   brew install koyeb/tap/cli
   
   # Linux
   curl -fsSL https://cli.koyeb.com/install.sh | bash
   ```

2. Log in to your Koyeb account:
   ```bash
   koyeb login
   ```

3. Deploy your app using the koyeb.yaml configuration:
   ```bash
   # First, set your secrets
   koyeb secrets create secret-id --value "your-gocardless-secret-id"
   koyeb secrets create secret-key --value "your-gocardless-secret-key"
   
   # Then deploy
   koyeb app init bank-data-app --git github.com/YOUR_USERNAME/bank-data-app --git-branch main
   ```

## Verifying Your Deployment

1. Once deployed, Koyeb will provide you with a URL for your application (e.g., https://bank-data-app-username.koyeb.app)
2. Open this URL in your browser to access your Bank Data App
3. You should see the bank selection interface
4. Test the application by selecting a bank and following the authentication flow

## Troubleshooting

If you encounter issues with your deployment:

1. **Check Logs**: In the Koyeb dashboard, go to your app > Deployments > Logs
2. **Verify Environment Variables**: Make sure your SECRET_ID and SECRET_KEY are correctly set
3. **Check Build Process**: Ensure the build process completed successfully
4. **CORS Issues**: If you encounter CORS errors, update the CORS configuration in server.js to include your Koyeb domain

## Custom Domain (Optional)

To use a custom domain with your Koyeb app:

1. In the Koyeb dashboard, go to your app > Settings > Domains
2. Click "Add a domain"
3. Enter your domain name
4. Follow the instructions to set up DNS records

## Updating Your App

To update your app after making changes:

1. Commit and push your changes to GitHub:
   ```bash
   git add .
   git commit -m "Your update message"
   git push
   ```

2. Koyeb will automatically detect the changes and deploy a new version

## Monitoring and Scaling

- **Monitoring**: Koyeb provides basic monitoring in the dashboard
- **Scaling**: You can adjust the instance type and number of instances in the Koyeb dashboard if needed

## Additional Resources

- [Koyeb Documentation](https://www.koyeb.com/docs)
- [Node.js on Koyeb](https://www.koyeb.com/docs/deploy/node-js)
- [Custom Domains on Koyeb](https://www.koyeb.com/docs/domains-and-certificates/custom-domains)
