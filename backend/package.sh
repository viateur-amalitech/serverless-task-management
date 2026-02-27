#!/bin/bash
rm -rf dist
mkdir -p dist
npx tsc

echo "Creating deployment packages..."

# Install production dependencies
cp package.json dist/
cd dist
npm install --production --no-package-lock
rm package.json

# Create bundle with node_modules
zip -r lambda_bundle.zip .
cd ..

# Copy bundle for each handler
cp dist/lambda_bundle.zip dist/pre_signup.zip
cp dist/lambda_bundle.zip dist/post_confirmation.zip
cp dist/lambda_bundle.zip dist/task_handler.zip
cp dist/lambda_bundle.zip dist/notification_handler.zip

echo "Deployment packages created in backend/dist/"
