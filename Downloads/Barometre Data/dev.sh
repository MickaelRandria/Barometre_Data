#!/bin/bash
echo "🚀 Démarrage de Barometre Data..."
echo ""
echo "📦 Backend sur http://localhost:3001"
cd backend && npm run dev &
BACKEND_PID=$!
sleep 2
echo "💻 Frontend sur http://localhost:3000"
cd ../frontend && npm run dev
trap "kill $BACKEND_PID" EXIT
