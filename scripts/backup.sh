#!/bin/bash
mkdir -p /backups/wpanel

tar --exclude='node_modules' \
    --exclude='.next' \
    --exclude='.git' \
    --exclude='dist' \
    --exclude='logs' \
    -czf /backups/wpanel/backup-$(date +%F).tar.gz /docker/wpanel/

# Delete backups older than 7 days
find /backups/wpanel/ -type f -name "*.tar.gz" -mtime +7 -exec rm {} \;
echo "Backup completed: /backups/wpanel/backup-$(date +%F).tar.gz"
echo "Old backups deleted."
# send to proton drive
rclone copy /backups/wpanel/backup-$(date +%F).tar.gz protondrive:/backups/wpanel/ -v
echo "Backup uploaded to Proton Drive."
