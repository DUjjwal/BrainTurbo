import express from "express"
import {WebSocketServer, WebSocket} from "ws"
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

type User = {
    socket: WebSocket,
    roomid: number,
    userid: String,
    username: String
}

const Users: User[] = []

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
            if(parsedData.type === 'connect') {
                console.log('connect happen')
                Users.push({
                    socket,
                    roomid: parsedData.roomid,
                    userid: parsedData.userid,
                    username: parsedData.username
                })
            }
            else if(parsedData.type === 'delete') {
                let sendObj = {
                    type: 'delete',
                    data: parsedData.data
                }
                console.log(sendObj)
                Users.forEach((obj) => {
                    if(obj.roomid === parsedData.roomid && obj.userid !== parsedData.userid) {
                        obj.socket.send(JSON.stringify(sendObj))
                    }
                })
            }
            else if(parsedData.type === 'mousemove' || parsedData.type === 'disconnect' || parsedData.type === 'move' || parsedData.type === 'text' || parsedData.type === 'deltext' || parsedData.type === 'textmove') {
                console.log('disconnect trigger')
                Users.forEach((obj) => {
                    if(obj.roomid === parsedData.roomid && obj.userid !== parsedData.userid) {
                        console.log('sent from here')
                        obj.socket.send(JSON.stringify(parsedData))
                    }
                })
            }
            else if(parsedData.type !== 'text') {
                console.log('traversing shape')
                console.log(Users.length)
                Users.forEach((obj) => {
                    if(obj.roomid === parsedData.roomid && obj.userid !== parsedData.userid) {
                        obj.socket.send(JSON.stringify(parsedData.data))
                    }
                })
            }
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
            if(parsedData.type === 'connect') {
                console.log('connect happen')
                Users.push({
                    socket,
                    roomid: parsedData.roomid,
                    userid: parsedData.userid,
                    username: parsedData.username
                })
            }
            else if(parsedData.type === 'delete') {
                let sendObj = {
                    type: 'delete',
                    data: parsedData.data
                }
                console.log(sendObj)
                Users.forEach((obj) => {
                    if(obj.roomid === parsedData.roomid && obj.userid !== parsedData.userid) {
                        obj.socket.send(JSON.stringify(sendObj))
                    }
                })
            }
            else if(parsedData.type === 'mousemove' || parsedData.type === 'disconnect' || parsedData.type === 'move' || parsedData.type === 'text' || parsedData.type === 'deltext' || parsedData.type === 'textmove') {
                console.log('disconnect trigger')
                console.log(parsedData)
                Users.forEach((obj) => {
                    if(obj.roomid === parsedData.roomid && obj.userid !== parsedData.userid) {
                        console.log('sent from here')
                        obj.socket.send(JSON.stringify(parsedData))

                    }
                })
            }
            else if(parsedData.type !== 'text') {
                console.log('traversing shape')
                console.log(Users.length)
                Users.forEach((obj) => {
                    if(obj.roomid === parsedData.roomid && obj.userid !== parsedData.userid) {
                        obj.socket.send(JSON.stringify(parsedData.data))
                    }
                })
            }

        }) 
        
    }catch(err) {
        console.log('rejected')
        socket.close();
        return;
    }
    
    
    
    


    
})