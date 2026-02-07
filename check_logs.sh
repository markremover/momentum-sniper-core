#!/bin/bash

echo "🔍 Checking Docker container status..."
echo ""

# Check if container exists
if docker ps -a | grep -q momentum-scanner; then
    echo "📋 Container exists. Getting last 50 lines of logs..."
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    docker logs --tail 50 momentum-scanner
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "📊 Container inspect:"
    docker inspect momentum-scanner --format='{{.State.Status}}: {{.State.ExitCode}} ({{.State.Error}})'
else
    echo "❌ Container 'momentum-scanner' does not exist!"
    echo "Running containers:"
    docker ps -a
fi

echo ""
echo "🔧 Checking docker-compose services:"
docker-compose ps
