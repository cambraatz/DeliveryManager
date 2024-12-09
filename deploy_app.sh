#!/bin/bash

# Targets...
APP_DIR="/var/www/deliverymanager"
BACKUP_DIR="/var/www/backups/deliverymanager_$(date +%Y%m%d_%H%M%S)"
USER="DM_User"

# Backup existing deployment, if one exists
if [ -d "$APP_DIR" ]; then
    echo "Creating backup of the existing deployment..."
    sudo mv "$APP_DIR" "$BACKUP_DIR"
    echo "Backup created: $BACKUP_DIR"
fi

# Remove previous deployment
echo "Removing previous deployment..."
rm -Rf "$APP_DIR"

# Create a new directory for the app
echo "Creating directory for new deployment..."
mkdir -p "$APP_DIR"
cd "$APP_DIR" || exit
pwd

# Upload new application files
echo "Uploading files..."
rz

# Extract and remove wwwroot.zip
echo "Unzipping wwwroot.zip..."
unzip wwwroot.zip
rm wwwroot.zip

# Prepare target directories for deployment
echo "Creating directories in target location..."
mkdir -p "$APP_DIR/html"
mkdir -p "$APP_DIR/log"

# Set permissions/ownership
cd .. || exit
pwd
echo "Setting ownership and permissions..."
sudo chown -R "$USER:$USER" "$APP_DIR"
sudo chmod -R 755 "$APP_DIR"

# Restart web server and app server
echo "Restarting web server and application server..."
sudo systemctl restart httpd
sudo systemctl restart kestrel-deliverymanager.service

echo "Deployment completed successfully!"
