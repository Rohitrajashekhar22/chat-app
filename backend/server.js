import express from 'express';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import authRoutes from "./routes/authroutes.js";
import http from "http";
const { createServer } = http;
import messageRoutes from "./routes/messageRoutes.js";
import {Server} from "socket.io";
import initSocket from "./socket/socket.js";
import cors from "cors";
import userRoutes from "./routes/userRoutes.js";
dotenv.config();

const app = express();

// Create HTTP server and Socket.IO instance
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

initSocket(io);

app.use(express.json());
app.use(cors()); // Enable CORS for all routes
app.get('/', (req, res) => {
    res.send('Hello World!');
});

//routes
app.use("/api/auth", authRoutes);

//userRoute
app.use("/api/users", userRoutes);

//msg routes
app.use("/api/messages", messageRoutes);
 
const startServer = async () => {
    await connectDB();

    server.listen(process.env.PORT, () => {
        console.log(`Server is running on port http://localhost:${process.env.PORT}`);
    });
};

startServer();

