const Router = require('express').Router;
const MongoClient = require('mongodb').MongoClient
const url = "mongodb://localhost:27017";
const client = new MongoClient(url);
const dbName = 'sezzle';
const router = Router();


router.get('/list' , async (req,res) => {
    await client.connect();
    let orders = []
    client.db(dbName).collection('carts').find({is_purchased : true})
    .forEach(cart => {
        let items = []
        cart.items.forEach(item => {
            items.push(item.toString());
        })
        orders.push({
            orderId : cart._id.toString(),
            userId : cart.user_id.toString(),
            items : items
        })
    })
    .then(resp => {
        res.status(200).json(orders);
        client.close();
    })
    .catch(err => {
        console.log(err);
        res.status(500);
        client.close();
    })
})

module.exports = router;
