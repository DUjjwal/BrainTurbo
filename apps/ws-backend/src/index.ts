import express from "express"
import {WebSocketServer} from "ws"
import jwt from "jsonwebtoken"
import dotenv from "dotenv";
dotenv.config();

import { OAuth2Client } from "google-auth-library";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

async function verifyGoogleToken(token: string) {
  console.log('token', token)
  const ticket = await client.verifyIdToken({
    idToken: token,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  return ticket.getPayload();
}

const app = express()

const httpServer = app.listen(4000, async () => {
    console.log('server is listening at port 4000')
})

const wss = new WebSocketServer({server: httpServer})

wss.on("connection", async function (socket, req) {
    const token = req.url?.slice(8)
    try {
        const payload = await verifyGoogleToken(token!)
        
    }catch(err) {
        socket.close();
        return;
    }
    
    
    
    


    
})