#!/bin/bash

# This script initializes a Git repository and pushes to GitHub
# Usage: ./setup-github.sh <github_username>

if [ $# -eq 0 ]; then
    echo "Usage: ./setup-github.sh <github_username>"
    exit 1
fi

GITHUB_USERNAME=$1
REPO_NAME="bank-data-app"

echo "Setting up Git repository for $REPO_NAME..."

# Initialize Git repository
git init

# Add all files
git add .

# Commit changes
git commit -m "Initial commit"

echo "Creating remote repository on GitHub..."
echo "Please create a new repository named '$REPO_NAME' on GitHub:"
echo "https://github.com/new"
echo "Do NOT initialize it with a README, .gitignore, or license."
echo ""
echo "Once created, press Enter to continue..."
read

# Add GitHub repository as remote
git remote add origin "https://github.com/$GITHUB_USERNAME/$REPO_NAME.git"

# Push to GitHub
echo "Pushing to GitHub..."
git push -u origin main || git push -u origin master

echo ""
echo "Setup complete! Your code is now on GitHub at:"
echo "https://github.com/$GITHUB_USERNAME/$REPO_NAME"
echo ""
echo "Next steps for Koyeb deployment:"
echo "1. Create a Koyeb account at https://app.koyeb.com/auth/signup"
echo "2. In the Koyeb dashboard, click 'Create App'"
echo "3. Select 'GitHub' as the deployment method"
echo "4. Connect your GitHub account and select the '$REPO_NAME' repository"
echo "5. Configure your app with the following settings:"
echo "   - Name: $REPO_NAME"
echo "   - Region: Choose a region close to your users"
echo "   - Instance Type: Nano (free tier)"
echo "   - Build Settings: Buildpack (Node.js)"
echo "   - Start Command: node server.js"
echo "   - Environment Variables: Add your SECRET_ID and SECRET_KEY"
echo "6. Click 'Deploy'"
