import express from 'express'
import 'dotenv/config'
import cors from 'cors'
import { MongoClient, ObjectId } from 'mongodb';


const app = express()
const port = 5000

app.use(cors())
app.use(express.json())


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


app.get('/', (req, res) => {
    res.send('Hello World!')
})
//http://localhost:5000
app.post('/addevents', async (req, res) => {
    const data = req.body
    const result = await myColl.insertOne(data)
    res.send({ result })
})
//http://localhost:5000/events
app.get('/events', async (req, res) => {
    const result = await myColl.find().toArray()
    res.send(result)
})
//http://localhost:5000/events/:email
app.get('/events/:email', async (req, res) => {
    const { email } = req.params
    const result = await myColl.find({ email: email }).toArray()
    res.send(result)

})
//update
app.patch('/events/:id', async (req, res) => {
    const { id } = req.params
    const data = req.body
    const result = await myColl.updateOne(
        { _id: new ObjectId(id) },
        { $set: data }
    )
    res.send(result)
})
//delete
app.delete('/events/:id', async (req, res) => {
    const { id } = req.params
    const result = await myColl.deleteOne({ _id: new ObjectId(id) })
    res.send(result)
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
export default app