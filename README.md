NeighborConnect
A real-time community messaging platform connecting neighbors for local events, assistance requests, and neighborhood communication. Built for the Congressional App Challenge.
Features

Real-time messaging via Socket.IO WebSockets
Secure auth with bcrypt hashing + JWT tokens
Progressive Web App — installable on mobile with offline support
Rate limiting & security via Helmet.js and express-rate-limit

Tech Stack
Frontend: HTML, CSS, JavaScript · Backend: Node.js, Express · Real-time: Socket.IO · Database: SQLite3 · Auth: JWT, bcryptjs · Deployment: Railway
Quick Start
bashgit clone https://github.com/Pawnshurricane5000/neighborhood-connect.git
cd neighborhood-connect
npm install
cp env.example .env    # configure your secrets
npm start              # http://localhost:3000
For development with auto-reload: npm run dev
Author
Hemanth Samayamantri · @Pawnshurricane5000 · samayh09@gmail.com
License
MIT
