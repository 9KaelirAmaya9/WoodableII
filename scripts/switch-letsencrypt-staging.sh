#!/bin/bash
# Script to switch Traefik to Let's Encrypt staging mode
# This deletes the existing acme.json and restarts Traefik

set -e

echo "🔄 Switching Traefik to Let's Encrypt Staging Mode..."
echo ""

# Check if Traefik container is running
if docker ps --format '{{.Names}}' | grep -q "base2_traefik"; then
    echo "✓ Traefik container is running"
    
    # Delete acme.json file
    echo "🗑️  Deleting existing acme.json file..."
    docker exec base2_traefik rm -f /etc/traefik/acme/acme.json || echo "⚠️  acme.json not found (this is okay)"
    
    # Restart Traefik container
    echo "🔄 Restarting Traefik container..."
    docker-compose -f local.docker.yml restart traefik
    
    echo ""
    echo "✅ Done! Traefik is now using Let's Encrypt staging environment."
    echo "📝 Note: Staging certificates will show as untrusted in browsers (this is expected)."
    echo "🔍 Check logs: docker-compose -f local.docker.yml logs -f traefik"
else
    echo "⚠️  Traefik container is not running."
    echo ""
    echo "When you start the services, the old acme.json will be used."
    echo "To delete it before starting, run:"
    echo ""
    echo "  docker volume ls | grep acme"
    echo "  docker volume rm base2_traefik_acme  # or whatever the volume name is"
    echo ""
    echo "Or start services and then run this script again."
fi

echo ""
echo "📋 To switch back to production mode later:"
echo "   1. Edit traefik/traefik.yml"
echo "   2. Comment staging caServer, uncomment production caServer"
echo "   3. Run this script again to delete acme.json and restart"
