require('./config/config');

const _ = require('lodash');
const subdomain = require('express-subdomain');
const express = require('express');
const bodyParser = require('body-parser');
const {ObjectID} = require('mongodb');

var {mongoose} = require('./db/mongoose');
var {Todo} = require('./models/todo');
var {User} = require('./models/user');
var {authenticate} = require('./middleware/authenticate');

var app = express();
var router = express.Router();
const port = process.env.PORT;

app.use(bodyParser.json());
app.use(subdomain('api', router));



app.get('/', (req, res) => {
    res.send('Homepage');
});



router.get('/', function(req, res) {
    res.send('Welcome to our API!');
});
 


router.post('/todos', authenticate, async (req, res) => {
   const todo = new Todo({
      text: req.body.text,
      _creator: req.user._id
   });

   try {
      const doc = await todo.save();
      res.send(doc);
   } catch (e) {
      res.status(400).send(e);
   }
});

router.get('/todos', authenticate, async (req, res) => {

   try {
      const todos = await Todo.find({
         _creator: req.user._id
      });
      res.send({todos});
   } catch (e) {
      res.status(400).send(e);
   }
});

router.get('/todos/:id', authenticate, async (req, res) => {
   const id = req.params.id;

   if (!ObjectID.isValid(id)) {
      return res.status(404)
      .send();
   }

   try {
      const todo = await Todo.findOne({
         _id: id,
         _creator: req.user._id
      });
      if (!todo) {
         return res.status(404).send();
      } 
      res.send({todo});
   } catch (e) {
      res.status(400).send();
   }
});

router.delete('/todos/:id', authenticate, async (req, res) => {
   const id = req.params.id;

   if (!ObjectID.isValid(id)) {
      return res.status(404).send();
   }

   try { 
      const todo = await Todo.findOneAndRemove({
         _id: id,
         _creator: req.user._id
      });

      if (!todo) {
         return res.status(404).send();
      }
      res.send({todo});

   } catch (e) {
      return res.send(400);
   }
});

router.patch('/todos/:id', authenticate, async (req, res) => {
   const id = req.params.id;
   const body = _.pick(req.body, ['text', 'completed']);

   if (!ObjectID.isValid(id)) {
      return res.status(404)
      .send();
   }

   if (_.isBoolean(body.completed) && body.completed) {
      body.completedAt = new Date().getTime();
   } else {
      body.completed = false;
      body.completedAt = null;
   }

   try {
      const todo = await Todo.findOneAndUpdate({
         _id: id,
         _creator: req.user._id
      }, {$set: body}, {new: true});
      if (!todo) {
         return res.status(404).send();
      }
      res.send({todo});
   } catch (e) {
      res.status(400).send();
   }
});

router.post('/users', async (req, res) => {
   try {
      const body = _.pick(req.body, ['email', 'password']);
   const user = new User(body);
      await user.save();
      const token = await user.generateAuthToken();
      res.header('x-auth', token).send(user);
   } catch (e) {
      res.status(400).send(e);
   }
});

router.get('/users/me', authenticate, (req, res) => {
   res.send(req.user);
});

router.post('/users/login', async (req, res) => {
   try {
      const body = _.pick(req.body, ['email', 'password']);
      const user = await User.findByCredentials(body.email, body.password);
      const token = await user.generateAuthToken();
      res.header('x-auth', token).send(user);
   } catch (e) {
      res.status(400).send();
   }
});

router.delete('/users/me/token', authenticate, async (req, res) => {
   try {
      await req.user.removeToken(req.token);
      res.status(200).send();
   } catch (e) {
      res.status(400).send();
   }
});





// app.get('/', (req, res) => {
//     res.send('Homepage');
// });

// app.post('/todos', authenticate, async (req, res) => {
//    const todo = new Todo({
//       text: req.body.text,
//       _creator: req.user._id
//    });

//    try {
//       const doc = await todo.save();
//       res.send(doc);
//    } catch (e) {
//       res.status(400).send(e);
//    }
// });

// app.get('/todos', authenticate, async (req, res) => {

//    try {
//       const todos = await Todo.find({
//          _creator: req.user._id
//       });
//       res.send({todos});
//    } catch (e) {
//       res.status(400).send(e);
//    }
// });

// app.get('/todos/:id', authenticate, async (req, res) => {
//    const id = req.params.id;

//    if (!ObjectID.isValid(id)) {
//       return res.status(404)
//       .send();
//    }

//    try {
//       const todo = await Todo.findOne({
//          _id: id,
//          _creator: req.user._id
//       });
//       if (!todo) {
//          return res.status(404).send();
//       } 
//       res.send({todo});
//    } catch (e) {
//       res.status(400).send();
//    }
// });

// app.delete('/todos/:id', authenticate, async (req, res) => {
//    const id = req.params.id;

//    if (!ObjectID.isValid(id)) {
//       return res.status(404).send();
//    }

//    try { 
//       const todo = await Todo.findOneAndRemove({
//          _id: id,
//          _creator: req.user._id
//       });

//       if (!todo) {
//          return res.status(404).send();
//       }
//       res.send({todo});

//    } catch (e) {
//       return res.send(400);
//    }
// });

// app.patch('/todos/:id', authenticate, async (req, res) => {
//    const id = req.params.id;
//    const body = _.pick(req.body, ['text', 'completed']);

//    if (!ObjectID.isValid(id)) {
//       return res.status(404)
//       .send();
//    }

//    if (_.isBoolean(body.completed) && body.completed) {
//       body.completedAt = new Date().getTime();
//    } else {
//       body.completed = false;
//       body.completedAt = null;
//    }

//    try {
//       const todo = await Todo.findOneAndUpdate({
//          _id: id,
//          _creator: req.user._id
//       }, {$set: body}, {new: true});
//       if (!todo) {
//          return res.status(404).send();
//       }
//       res.send({todo});
//    } catch (e) {
//       res.status(400).send();
//    }
// });

// app.post('/users', async (req, res) => {
//    try {
//       const body = _.pick(req.body, ['email', 'password']);
//    const user = new User(body);
//       await user.save();
//       const token = await user.generateAuthToken();
//       res.header('x-auth', token).send(user);
//    } catch (e) {
//       res.status(400).send(e);
//    }
// });

// app.get('/users/me', authenticate, (req, res) => {
//    res.send(req.user);
// });

// app.post('/users/login', async (req, res) => {
//    try {
//       const body = _.pick(req.body, ['email', 'password']);
//       const user = await User.findByCredentials(body.email, body.password);
//       const token = await user.generateAuthToken();
//       res.header('x-auth', token).send(user);
//    } catch (e) {
//       res.status(400).send();
//    }
// });

// app.delete('/users/me/token', authenticate, async (req, res) => {
//    try {
//       await req.user.removeToken(req.token);
//       res.status(200).send();
//    } catch (e) {
//       res.status(400).send();
//    }
// });

app.listen(port, () => {
   console.log(`Server started on port ${port}`);
});

module.exports = {app};


