const Router = require('express').Router;
const MongoClient = require('mongodb').MongoClient
const md5 = require('md5');
const url = "mongodb://localhost:27017";
const client = new MongoClient(url);
const dbName = 'sezzle';
const router = Router();

router.post('/create' , async (req,res) => {
    const name = req.body.name;
    const email = req.body.email;
    const password = md5(req.body.password);
    const token = md5(req.body.email);
    await client.connect();
    client.db(dbName).collection('users').countDocuments({username : email} , {limit : 1})
    .then((resp) => {
        if(resp === 0)
        {
            return client.db(dbName).collection('users').insertOne({name : name, username : email, password : password, token : token, cart_id : null , created_at : new Date()})
        }
        else
        {
            throw new Error('user already exists');
        }
    })
    .then((resp) => {
        return client.db(dbName).collection('carts').insertOne({user_id : resp.insertedId, is_purchased : false, created_at : new Date() , items : []})
    })
    .then((resp) => {
        res.status(201).json({message : 'user created' ,token : token})
        client.close();
    })
    .catch((err)=>{
        console.log(err);
        res.status(500).json({message : err.message});
        client.close();
    })
})

router.post('/login' , async(req,res) => {
    const email = req.body.email;
    const password = md5(req.body.password);
    await client.connect();
    client.db(dbName).collection('users').findOne({username : email , password : password})
    .then(resp => {
        if(resp)
        {
            res.status(201).json({message : 'Success' , token : resp.token})
            client.close();
        }
        else
        {
            throw new Error('User not found');
        }
    })
    .catch(err => {
        console.log(err);
        res.status(500).json({message : err.message})
        client.close();
    })
})

router.post('/cart' , async(req,res) => {
    const token = req.body.token;
    let user_id = null;
    let itemsInCart = [];
    await client.connect();
    client.db(dbName).collection('users').findOne({token : token})
    .then(resp => {
        if(resp)
        {
            user_id= resp._id;
            return client.db(dbName).collection('carts').findOne({user_id : user_id , is_purchased : false})
        }
        else
        {
            throw new Error('invalid token');
        }
    })
    .then(resp => {
        if(resp)
        {
            resp.items.forEach(item => {
                itemsInCart.push(item.toString());
            })
            res.status(200).json({cart_id : resp._id.toString() , itemsInCart : itemsInCart});
            client.close();
        }
        else
        {
            throw new Error('unable to find cart');
        }
    })
    .catch(err => {
        res.status(500);
        client.close();
    })
})

router.post('/orders',async(req,res) => {
    token = req.body.token;
    await client.connect();
    let orders = []
    client.db(dbName).collection('users').findOne({token : token})
    .then(resp => {
        if(resp)
        {
            client.db(dbName).collection('carts').find({user_id : resp._id ,is_purchased : true}).forEach(order => {
                let itemInOrder = [];
                order.items.forEach(itemId => {
                    itemInOrder.push(itemId);
                })
                orders.push({
                    orderId : order._id,
                    items : itemInOrder 
                })
            })
            .then(resp => {
                res.status(200).json({orders});
                client.close();
            })
        }
        else
        {
            throw new Error('Not Found');
        }
    })
    .catch(err => {
        res.status(500);
        client.close();
    })
})

router.get('/list' , async(req,res) => {
    await client.connect();
    let users = [];
    client.db(dbName).collection('users').find().forEach(doc => {
        users.push({
            name : doc.name,
            email : doc.username,
        })
    })
    .then(resp => {
        res.status(200).json({message : 'success', users})
        client.close();
    })
    .catch(err => {
        console.log(err);
        res.status(501).json({message : 'Something went wrong'})
        client.close();
    })
})

module.exports = router;