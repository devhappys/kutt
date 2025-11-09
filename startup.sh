#!/bin/sh
set -e

# Function to check if package.json exists
check_package_json() {
    if [ ! -f "package.json" ]; then
        echo "ERROR: package.json not found in $(pwd)"
        echo "Expected location: $(pwd)/package.json"
        echo ""
        echo "Directory contents:"
        ls -la
        echo ""
        return 1
    fi
    return 0
}

echo "Starting Hapxs SUrl application..."
echo "Working directory: $(pwd)"
echo ""

# Check if package.json exists before proceeding
if ! check_package_json; then
    echo "FATAL: Cannot proceed without package.json"
    exit 1
fi

echo "Running database migrations..."
if ! pnpm migrate; then
    echo "ERROR: Database migration failed"
    echo "Please check your database configuration and connection"
    exit 1
fi

echo "Migrations completed successfully"
echo ""
echo "Starting server..."
pnpm start
