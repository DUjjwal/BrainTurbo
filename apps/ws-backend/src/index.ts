import express from "express"

import { PrismaClient } from "@repo/db/client"
const client = new PrismaClient()

const app = express()

app.listen(4000, async () => {
    await client.room.findMany({})
    console.log('server is listening at port 4000')
})