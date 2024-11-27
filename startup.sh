#!/bin/bash

# Exit if any command fails
set -e

# Set admin details as environment variables
export ADMIN_FIRST_NAME="Test"
export ADMIN_LAST_NAME="Admin"
export ADMIN_EMAIL="adminUser@gmail.com"
export ADMIN_PASSWORD="123"
export ADMIN_AVATAR="\avatars\admin.jpg"
export ADMIN_PHONE="1234567890"
export ADMIN_ROLE="ADMIN"

# Install npm dependencies
echo "Installing npm dependencies..."
npm install
echo "Done."

# Run Prisma migrations
echo "Running Prisma migrations..."
npx prisma migrate deploy
echo "Done."

# Check if required compilers/interpreters are installed
echo "Checking for required compilers and interpreters..."

# Create an admin user in the database

echo "Creating admin user..."

node createAdmin.js

echo "Admin user created."

echo "Startup script completed successfully."

# Set executable permission
chmod +x run.sh
#!/bin/bash

# Exit if any command fails
set -e

# Set admin details as environment variables
export ADMIN_FIRST_NAME="Test"
export ADMIN_LAST_NAME="Admin"
export ADMIN_EMAIL="adminUser@gmail.com"
export ADMIN_PASSWORD="123"
export ADMIN_AVATAR="Test Avatar"
export ADMIN_PHONE="1234567890"
export ADMIN_ROLE="ADMIN"

# Install npm dependencies
echo "Installing npm dependencies..."
npm install
echo "Done."

# Run Prisma migrations
echo "Running Prisma migrations..."
npx prisma migrate deploy
echo "Done."

# Check if required compilers/interpreters are installed
echo "Checking for required compilers and interpreters..."

# Create an admin user in the database

echo "Creating admin user..."

node createAdmin.js

echo "Admin user created."

echo "Startup script completed successfully."

# Set executable permission
chmod +x run.sh

# Build docker images
chmod +x buildDockerImages.sh
./buildDockerImages.sh

echo "Ready to start the server!"