const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const userRouter = require('./routes/user');
const itemRouter = require('./routes/item');
const cartRouter = require('./routes/cart');
const orderRouter = require('./routes/order');
app.use(bodyParser.urlencoded({extended : true}));
app.use(bodyParser.json());


app.use((req, res, next) => {
  
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET,POST,PUT,PATCH,DELETE,OPTIONS'
  );
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});


app.use('/user',userRouter);
app.use('/item',itemRouter);
app.use('/cart',cartRouter);
app.use('/order',orderRouter);

app.listen(3011);