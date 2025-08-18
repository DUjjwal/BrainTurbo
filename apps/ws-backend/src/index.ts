import express from "express"
import {WebSocketServer} from "ws"
import jwt from "jsonwebtoken"
import dotenv from "dotenv";
dotenv.config();

import { OAuth2Client } from "google-auth-library";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

async function verifyGoogleToken(token: string) {
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
    const url = new URL(req.url ?? "", "http://localhost")
    const token = url.searchParams.get("token")

    const buffer: any[] = []

    socket.on("message", (data) => {
        buffer.push(data)
    })
    try {
        const payload = await verifyGoogleToken(token!)
        
        buffer.forEach((data) => {
            console.log('Buffer checking')
            let parsedData;
            if(typeof data === 'string')
                parsedData = JSON.parse(data)
            else
                parsedData = JSON.parse(data.toString("utf-8"))
            console.log(parsedData)
        })

        buffer.length = 0


        socket.on("message", function (data) {
            console.log('message received on server')
            let parsedData;
            if(typeof data === 'string')
                parsedData = JSON.parse(data)
            else
                parsedData = JSON.parse(data.toString("utf-8"))
            console.log(parsedData)
        }) 
        
    }catch(err) {
        console.log('rejected')
        socket.close();
        return;
    }
    
    
    
    


    
})