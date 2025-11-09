#!/bin/sh
set -e

# Function to display npm error logs
display_npm_error_logs() {
    echo ""
    echo "========================================"
    echo "NPM ERROR DETECTED - Displaying logs..."
    echo "========================================"
    echo ""
    
    # Find the most recent npm debug log
    NPM_LOG_DIR="${HOME}/.npm/_logs"
    
    if [ -d "$NPM_LOG_DIR" ]; then
        LATEST_LOG=$(ls -t "$NPM_LOG_DIR"/*-debug-*.log 2>/dev/null | head -n 1)
        
        if [ -n "$LATEST_LOG" ]; then
            echo "Found npm debug log: $LATEST_LOG"
            echo "========================================"
            echo "LOG CONTENTS:"
            echo "========================================"
            cat "$LATEST_LOG"
            echo ""
            echo "========================================"
            echo "END OF LOG"
            echo "========================================"
        else
            echo "No npm debug logs found in $NPM_LOG_DIR"
        fi
    else
        echo "NPM log directory not found: $NPM_LOG_DIR"
    fi
    
    echo ""
    echo "Current working directory: $(pwd)"
    echo "Directory contents:"
    ls -la
    echo ""
}

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

# Trap errors and display logs before exiting
trap 'EXIT_CODE=$?; if [ $EXIT_CODE -ne 0 ]; then display_npm_error_logs; fi; exit $EXIT_CODE' EXIT

echo "Starting Kutt application..."
echo "Working directory: $(pwd)"
echo ""

# Check if package.json exists before proceeding
if ! check_package_json; then
    echo "FATAL: Cannot proceed without package.json"
    exit 1
fi

echo "Running database migrations..."
if ! node node_modules/.bin/knex migrate:latest; then
    echo "ERROR: Database migration failed"
    display_npm_error_logs
    exit 1
fi

echo "Migrations completed successfully"
echo ""
echo "Starting server..."
exec pnpm start
