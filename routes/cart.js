const Router = require('express').Router;
const MongoClient = require('mongodb').MongoClient
const ObjectID = require('mongodb').ObjectID
const url = "mongodb://localhost:27017";
const client = new MongoClient(url);
const dbName = 'sezzle';
const router = Router();

router.post('/add' , async(req, res) => {
    const token = req.body.token;
    const itemId = req.body.itemId;
    let user_id = null;
    await client.connect();
    client.db(dbName).collection('users').findOne({token : token})
    .then((resp) => {
        user_id = resp._id;
        return client.db(dbName).collection('carts').countDocuments({user_id : resp._id , is_purchased : false , items : {$eq : new ObjectID(itemId)}})
    })
    .then((resp) => {
        if(resp === 0)
        {
            return client.db(dbName).collection('carts').updateOne({user_id : user_id , is_purchased : false}, {$push :{items : new ObjectID(itemId)}})
        }
        else
        {
            throw new Error("Item already present in cart");
        }
    })
    .then((resp) => {
        res.status(201).send({message : 'item added'});
        client.close();
    })
    .catch((err) => {
        res.status(500).json({message : err.message});
        client.close();
    })
})

router.patch('/:cartId/complete' , async(req,res) => {
    const token = req.body.token;
    const cartId = req.params.cartId;
    let user_id = null;
    await client.connect();
    client.db(dbName).collection('users').findOne({token : token})
    .then(resp => {
        user_id = resp._id;
        return client.db(dbName).collection('carts').updateOne({user_id : resp._id , _id : new ObjectID(cartId) } , {$set : {is_purchased : true}})
    })
    .then(resp => {
        if(resp.modifiedCount > 0)
        {
            return client.db(dbName).collection('carts').insertOne({user_id : user_id, is_purchased : false, created_at : new Date() , items : []})
        }
        else
        {
            throw new Error('something went wrong');
        }
    })
    .then(resp => {
        res.status(200).send({message : 'ordered'})
        client.close();
    })
    .catch(err => {
        console.log(err);
        res.status(500).send({message : 'something went wrong'});
        client.close();
    })

})

router.get('/list' , async (req,res) => {
    await client.connect();
    let carts = []
    client.db(dbName).collection('carts').find({is_purchased : false})
    .forEach(cart => {
        let items = []
        cart.items.forEach(item => {
            items.push(item.toString());
        })
        carts.push({
            cartId : cart._id.toString(),
            userId : cart.user_id.toString(),
            items : items
        })
    })
    .then(resp => {
        res.status(200).json(carts);
        client.close();
    })
    .catch(err => {
        console.log(err);
        res.status(500);
        client.close();
    })
})

module.exports = router;
