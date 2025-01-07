#!/bin/bash

# Script to replace all remaining upload routes with MinIO versions

# List of routes to replace with their categories
declare -A routes
routes["/api/upload/supplier-image"]="suppliers"
routes["/api/upload/category-image"]="general"
routes["/api/upload/manufacturer-image"]="general"
routes["/api/upload/provider-image"]="suppliers"

echo "This would replace the remaining upload routes with MinIO versions..."
echo "Routes to update:"
for route in "${!routes[@]}"; do
    echo "$route -> ${routes[$route]} category"
done