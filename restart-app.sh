#!/bin/bash

# Restart wPanel application using PM2
echo "Restarting wPanel application..."
pm2 restart 0

# Show status after restart
echo "Application status:"
pm2 status
