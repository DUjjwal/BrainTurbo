"use server"
import {PrismaClient} from "@repo/db/client"
const db = new PrismaClient()

export async function roomExist(roomName: string): Promise<boolean> {
    const res = await db.room.findFirst({
        where: {
            name: roomName
        }
    })
    if(!res)return false
    return true
}

export async function getDBID(roomName: string): Promise<string> {
    const res = await db.room.findFirst({
        where: {
            name: roomName
        }
    })
    if(!res)return ""
    return res.name
}

export async function createRoom(roomName: string): Promise<boolean> {
    try {
        await db.room.create({
            data: {
                name: roomName
            }
        })
        return true
    }
    catch(err) {
        console.log(err)
        return false
    }
}
