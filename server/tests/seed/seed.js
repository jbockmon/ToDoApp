const {ObjectID} = require('mongodb');
const jwt = require('jsonwebtoken');

const {Todo} = require('./../../models/todo');
const {User} = require('./../../models/user');

const userOneID = new ObjectID();
const userTwoID = new ObjectID();
const users = [{
   _id: userOneID,
   email: 'jbockmon@gmail.com',
   password: 'userOnePass',
   tokens: [{
      access: 'auth',
      token: jwt.sign({_id: userOneID, access: 'auth'}, process.env.JWT_SECRET).toString()
   }]
}, {
   _id: userTwoID,
   email: 'jason@whatever.com',
   password: 'userTwoPass',
   tokens: [{
      access: 'auth',
      token: jwt.sign({_id: userTwoID, access: 'auth'}, process.env.JWT_SECRET).toString()
   }]
}];

const todos = [{ 
   _id: new ObjectID(),
   text: 'Task 1',
   _creator: userOneID
}, {
   _id: new ObjectID(),
   text: 'Task 2',
   completed: true,
   completedAt: 333,
   _creator: userTwoID
}];

const populateTodos = (done) => {
   Todo.remove({}).then(() => {
         Todo.insertMany(todos);
   }).then(() => done());
};

const populateUsers = (done) => {
   User.remove({}).then(() => {
      var userOne = new User(users[0]).save();
      var userTwo = new User(users[1]).save();

      Promise.all([userOne, userTwo])
   }).then(() => done());
};

module.exports = {todos, populateTodos, users, populateUsers};