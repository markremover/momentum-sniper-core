
# Kill any lingering node processes (just in case)
pkill -f node

# 1. Unzip safely (Overwrite without asking)
unzip -o MomentumSniper_V18_RESTORED_FIX.zip

# 2. Install Dependencies (Terminal)
npm install

# 3. Restart Docker Containers (n8n + Scanner if dockerized)
# (Using docker-compose is safest to get network back)
docker-compose down
docker-compose up -d

# 4. Wait for n8n to warm up
echo "Waiting 10s for n8n..."
sleep 10

# 5. Check if n8n is alive
curl -I http://localhost:5678

# 6. Start the Terminal (Standard Mode)
# Note: User typically runs 'npx ts-node src/index.ts' manually or via start script
echo "Setup Complete. Run: npx ts-node src/index.ts"
