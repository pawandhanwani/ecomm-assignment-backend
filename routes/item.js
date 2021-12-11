const Router = require('express').Router;
const MongoClient = require('mongodb').MongoClient
const Double = require('mongodb').Double
const url = "mongodb://localhost:27017";
const client = new MongoClient(url);
const dbName = 'sezzle';
const router = Router();

router.post('/create', async (req,res) => {
    const itemName = req.body.itemName;
    const price = new Double(req.body.price);
    await client.connect();
    client.db(dbName).collection('items').insertOne({itemName : itemName , price : price , created_at : new Date()})
    .then(resp => {
        res.status(201).json({message : 'item created'});
        client.close();
    })
    .catch(err => {
        res.status(503).json({message : 'something went wrong'});
        client.close();
    })
})

router.get('/list' , async(req,res) => {
    await client.connect();
    let items = [];
    client.db(dbName).collection('items').find().forEach(doc => {
        items.push({
            itemId : doc._id.toString(),
            name : doc.itemName,
            price : doc.price,
        })
    })
    .then(resp => {
        res.status(200).json({message : 'success', items})
        client.close();
    })
    .catch(err => {
        console.log(err);
        res.status(501).json({message : 'Something went wrong'})
        client.close();
    })
})

module.exports = router;