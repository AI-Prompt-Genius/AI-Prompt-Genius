#!/bin/bash

echo "Please enter the environment (dev/prod):"
read ENVIRONMENT

case $ENVIRONMENT in
    dev)
        echo "Running script for development environment..."
        ./replace_urls.sh
        ;;
    prod)
        echo "Running script for production environment..."
        ./restore_urls.sh
        ;;
    *)
        echo "Invalid input. Please enter 'dev' or 'prod'."
        ;;
esac
