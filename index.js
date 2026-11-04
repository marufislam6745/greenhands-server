import express from 'express'
import 'dotenv/config'
import cors from 'cors'
import { MongoClient, ObjectId } from 'mongodb';
import { createRemoteJWKSet, jwtVerify } from 'jose';


const app = express()
const port = 5000

app.use(cors())
app.use(express.json())

const verifyToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    //console.log(authHeader)
    if (!authHeader) {
        return res.status(401).send({ meg: 'You are Unauthorized' })
    }
    const token=authHeader.split(" ")[1]
    if(!token){
        return res.status(401).send({ meg: 'You are Unauthorized' })
    }

    const JWKS=createRemoteJWKSet(
         new URL(`${process.env.CLIENT_URL}/api/auth/jwks`)
    )
    try{
        const {payload}=await jwtVerify(token,JWKS)  
        console.log(payload)
        next()
    }catch(error){
        return res.status(500).send({ meg: 'Server error!' })
    }
    
}

const client = new MongoClient(process.env.MONGODB_URL);

export async function connectToMongoDB() {
    try {
        await client.connect();
        console.log("You successfully connected to MongoDB!");
        return client;
    } catch (err) {
        console.dir(err);
    }
}
const mongoClient = await connectToMongoDB()
const myDB = mongoClient.db('greenhands')
const myColl = myDB.collection('events')

const joinColl = myDB.collection('joinEvent')
const staticColl = myDB.collection('staticdata')


app.get('/', (req, res) => {
    res.send('Hello World!')
})
//http://localhost:5000
app.post('/addevents',verifyToken, async (req, res) => {
    const data = req.body
    const result = await myColl.insertOne(data)
    res.send({ result })
})
//http://localhost:5000/events
app.get('/events', async (req, res) => {
    const today = new Date().toLocaleDateString('en-CA', {
        timeZone: 'Asia/Dhaka'
    })

    const result = await myColl.find({
        date: { $gte: today }
    }).toArray()
    res.send(result)
})
//Recent events
app.get('/recentevents', async (req, res) => {
    const today = new Date().toLocaleDateString('en-CA', {
        timeZone: 'Asia/Dhaka'
    })
    const result = await myColl.find({
        date: { $gte: today }
    }).limit(6).toArray()
    res.send(result)
})

//search api
app.get('/eventsear/search', async (req, res) => {
    const search = req.query.search;

    const today = new Date().toLocaleDateString('en-CA', {
        timeZone: 'Asia/Dhaka'
    });
    const result = await myColl.find({
        data: { $gte: today },
        $or: [
            { title: { $regex: search, $options: 'i' } },
            { type: { $regex: search, $options: 'i' } }
        ]
    }).toArray()
    res.send(result)
})

//http://localhost:5000/events/:email
app.get('/events/:email',verifyToken, async (req, res) => {
    const { email } = req.params
    const result = await myColl.find({ email: email }).toArray()
    res.send(result)

})

app.get('/eventsby/:id', verifyToken, async (req, res) => {
    const { id } = req.params
    const result = await myColl.findOne({ _id: new ObjectId(id) })
    res.send(result)
})


//update
app.patch('/events/:id',verifyToken, async (req, res) => {
    const { id } = req.params
    const data = req.body
    const result = await myColl.updateOne(
        { _id: new ObjectId(id) },
        { $set: data }
    )
    res.send(result)
})
//delete
app.delete('/events/:id',verifyToken, async (req, res) => {
    const { id } = req.params
    const result = await myColl.deleteOne({ _id: new ObjectId(id) })
    res.send(result)
})


//http://localhost:5000/join
app.post('/join',verifyToken, async (req, res) => {
    const data = req.body
    delete data._id
    const result = await joinColl.insertOne(data)
    res.send(result)
})
app.get('/join/:email',verifyToken, async (req, res) => {
    const { email } = req.params
    const result = await joinColl.find({ useremail: email }).toArray()
    res.send(result)
})
app.delete('/joins/:id',verifyToken, async (req, res) => {
    const { id } = req.params
    const result = await joinColl.deleteOne({ _id: new ObjectId(id) })
    res.send(result)
})


//gallery section
app.get('/gallery', async (req, res) => {
    const result = await staticColl.find().toArray()
    res.send(result)
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
export default app