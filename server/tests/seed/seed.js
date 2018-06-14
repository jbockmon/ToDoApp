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
      token: jwt.sign({_id: userOneID, access: 'auth'}, 'abc123').toString()
   }]
}, {
   _id: userTwoID,
   email: 'jason@whatever.com',
   password: 'userTwoPass'
}];

const todos = [{ 
   _id: new ObjectID(),
   text: 'Task 1'
}, {
   _id: new ObjectID(),
   text: 'Task 2',
   completed: true,
   completedAt: 333
}, { 
   _id: new ObjectID(),
   text: 'Task 3'
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