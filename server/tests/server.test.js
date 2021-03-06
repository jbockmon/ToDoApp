const expect = require('expect');
const request = require('supertest');
const {ObjectID} = require('mongodb');

const {app} = require('./../server');
const {Todo} = require('./../models/todo');
const {User} = require('./../models/user');
const {todos, populateTodos, users, populateUsers} = require('./seed/seed');

beforeEach(populateUsers);
beforeEach(populateTodos);

describe('POST /todos', () => {
   it('should create a new todo', (done) => {
      var text = 'Task 1';

      request(app)
         .post('/todos')
         .set('Host', 'api.jotdo.com:3000')
         .set('x-auth', users[0].tokens[0].token)
         .send({text})
         .expect(200)
         .expect((res) => {
            expect(res.body.text).toBe(text);
         })
         .end(async (err, res) => {
            if (err) {
               return done(err);
            } 

            try {
              const todos = await Todo.find();
              expect(todos.length).toBe(3);
              expect(todos[0].text).toBe(text);
              done();

            } catch (e) {
              done(e);
            }   
         });
   });

   it('should not create todo with invalid body data', (done) => {
    var text = {};
  
    request(app)
        .post('/todos')
        .set('Host', 'api.jotdo.com:3000')
        .set('x-auth', users[0].tokens[0].token)
        .send(text)
        .expect(400)
        .end(async (err, res) => {
          if (err) {
              return done(err);
          }
          
          try {
            const todos = await Todo.find();
            expect(todos.length).toBe(2);
            done();
          } catch (e) {
            done(e);
          }
        });
    });

  });



describe('GET /todos', ()=> {
  it('should get all todos', (done) => {
      request(app)
        .get('/todos')
        .set('Host', 'api.jotdo.com:3000')
        .set('x-auth', users[0].tokens[0].token)
        .expect(200)
        .expect((res) => {
            expect(res.body.todos.length).toBe(1)
        })
        .end(done);
  });
});

describe('GET /todos/:id', () => {
  it('should return todo doc', (done) => {
      request(app)
      .get(`/todos/${todos[0]._id.toHexString()}`)
      .set('Host', 'api.jotdo.com:3000')
      .set('x-auth', users[0].tokens[0].token)
      .expect(200)
      .expect((res) => {
        expect(res.body.todo.text).toBe(todos[0].text);
      })
      .end(done);
  });

  it('should not return todo doc created by another user', (done) => {
    request(app)
    .get(`/todos/${todos[1]._id.toHexString()}`)
    .set('Host', 'api.jotdo.com:3000')
    .set('x-auth', users[0].tokens[0].token)
    .expect(404)
    .end(done);
});

  it('should return a 404 if todo not found', (done) => {
      request(app)
      .get(`/todos/${new ObjectID().toHexString()}`)
      .set('Host', 'api.jotdo.com:3000')
      .set('x-auth', users[0].tokens[0].token)
      .expect(404)
      .end(done);
  });

  it('should return a 404 for non-object ids', (done) => {
      request(app)
      .get('/todos/123')
      .set('Host', 'api.jotdo.com:3000')
      .set('x-auth', users[0].tokens[0].token)
      .expect(404)
      .end(done);
  });
});

describe('DELETE /todos/:id', () => {
  it('should remove a todo', (done) => {
      var hexID = todos[1]._id.toHexString();

      request(app)
      .delete(`/todos/${hexID}`)
      .set('Host', 'api.jotdo.com:3000')
      .set('x-auth', users[1].tokens[0].token)
      .expect(200)
      .expect((res) => {
        expect(res.body.todo._id).toBe(hexID);
      })
      .end(async (err, res) => {
        if (err) {
            return done(err);
        }

        try {
          const todo = await Todo.findById(hexID);
          expect(todo).toBeFalsy();
          done();
        } catch (e) {
          done(e);
        }
      });
  });

  it('should not remove a todo without auth', (done) => {
    var hexID = todos[0]._id.toHexString();

    request(app)
    .delete(`/todos/${hexID}`)
    .set('Host', 'api.jotdo.com:3000')
    .set('x-auth', users[1].tokens[0].token)
    .expect(404)
    .end(async (err, res) => {
      if (err) {
          return done(err);
      }

      try {
        const todo = Todo.findById(hexID);
        expect(todo).toBeTruthy();
        done();
      } catch (e) {
        done(e);
      }
    });
});

  it('should return 404 if todo not found', (done) => {
      request(app)
      .delete(`/todos/${new ObjectID().toHexString()}`)
      .set('Host', 'api.jotdo.com:3000')
      .set('x-auth', users[1].tokens[0].token)
      .expect(404)
      .end(done);

  });

  it('should return 404 if object id is invalid', (done) => {
      request(app)
      .delete('/todos/123')
      .set('Host', 'api.jotdo.com:3000')
      .set('x-auth', users[1].tokens[0].token)
      .expect(404)
      .end(done);
  });
});

describe('PATCH /todos/:id', () => {
  it('should update the todo', done => {
    const hexId = todos[0]._id.toHexString();
    const text = 'This is new updated text';

    request(app)
      .patch(`/todos/${hexId}`)
      .set('Host', 'api.jotdo.com:3000')
      .set('x-auth', users[0].tokens[0].token)
      .send({
        completed: true,
        text,
      })
      .expect(200)
      .expect(res => {
        expect(res.body.todo.text).toBe(text);
        expect(res.body.todo.completed).toBe(true);
        expect(typeof res.body.todo.completedAt).toEqual('number');
      })
      .end(done);
  });

  it('should not update the todo from another user', done => {
    const hexId = todos[0]._id.toHexString();
    const text = 'This is new updated text';

    request(app)
      .patch(`/todos/${hexId}`)
      .set('Host', 'api.jotdo.com:3000')
      .set('x-auth', users[1].tokens[0].token)
      .send({
        completed: true,
        text,
      })
      .expect(404)
      .end(done);
  });

  it('should clear completedAt when todo is not completed', done => {
    const hexId = todos[1]._id.toHexString();
    const text = 'This is new updated text!!!';

    request(app)
      .patch(`/todos/${hexId}`)
      .set('Host', 'api.jotdo.com:3000')
      .set('x-auth', users[1].tokens[0].token)
      .send({
        completed: false,
        text,
      })
      .expect(200)
      .expect(res => {
        expect(res.body.todo.text).toBe(text);
        expect(res.body.todo.completed).toBe(false);
        expect(res.body.todo.completedAt).toBeFalsy();
      })
      .end(done);
  });
});

describe('GET /users/me', () => {
  it('should return user if authenticated', (done) => {
    request(app)
    .get('/users/me')
    .set('Host', 'api.jotdo.com:3000')
    .set('x-auth', users[0].tokens[0].token)
    .expect(200)
    .expect((res) => {
      expect(res.body._id).toBe(users[0]._id.toHexString());
      expect(res.body.email).toBe(users[0].email);
    })
    .end(done);
  });

  it('should return a 401 if not authenticated', (done) => {
    request(app)
    .get('/users/me')
    .set('Host', 'api.jotdo.com:3000')
    .expect(401)
    .expect((res) => {
      expect(res.body).toEqual({})
    })
    .end(done);
  });
});

describe('POST users', () => {
  it('should create a user', (done) => {
    var email = 'example@example.com';
    var password = 'abc123';

    request(app)
    .post('/users')
    .set('Host', 'api.jotdo.com:3000')
    .send({email, password})
    .expect(200)
    .expect((res) => {
        expect(res.headers['x-auth']).toBeTruthy();
        expect(res.body._id).toBeTruthy();
      expect(res.body.email).toBe(email);
    })
    .end(async (err) => {
      if (err) {
        return done(err);
      }

      try {
        const user = await User.findOne({email});
        expect(user).toBeTruthy();
        expect(user.password).not.toBe(password);
        done();
      } catch (e) {
        done(e);
      }
    });
  });

  it('should return validation errors if request invalid', (done) => {
    var email = '123456';
    var password = '1';
    request(app)
    .post('/users')
    .set('Host', 'api.jotdo.com:3000')
    .send({email, password})
    .expect(400)
    .end(done);
  });

  it('should not create user if email in use', (done) => {
    var password = 'abc123';
    
    request(app)
    .post('/users')
    .set('Host', 'api.jotdo.com:3000')
    .send({email: users[0].email, password})
    .expect(400)
    .end(done);
  });
});


describe('POST /users/login', () => {
  it('should login user and return auth token', (done) => {
    request(app)
      .post('/users/login')
      .set('Host', 'api.jotdo.com:3000')
      .send({
        email: users[1].email,
        password: users[1].password
      })
      .expect(200)
      .expect((res) => {
        expect(res.headers['x-auth']).toBeTruthy();
      })
      .end(async (err, res) => {
        if (err) {
          return done(err);
        }

        try {
          const user = await User.findById(users[1]._id);

          expect(user.toObject().tokens[1]).toMatchObject({
            access: 'auth',
            token: res.headers['x-auth']
          });
          done();
        } catch (e) {
          done(e);
        }
      });
  });

  it('should reject invalid login', (done) => {
    request(app)
      .post('/users/login')
      .set('Host', 'api.jotdo.com:3000')
      .send({
        email: users[1].email,
        password: users[1].password + '1'
      })
      .expect(400)
      .expect((res) => {
        expect(res.headers['x-auth']).toBeFalsy();
      })
      .end(async (err, res) => {
        if (err) {
          return done(err);
        }

        try {
          const user = await User.findById(users[1]._id);

          expect(user.tokens.length).toBe(1);
          done();          
        } catch (e) {
          done(e);
        }
      });
  });
});

describe('DELETE /users/me/token', () => {
  it('should remove auth token on logout', (done) => {
    request(app)
      .delete('/users/me/token')
      .set('Host', 'api.jotdo.com:3000')
      .set('x-auth', users[0].tokens[0].token)
      .expect(200)
      .end(async (err, res) => {
        if (err) {
          return done(err);
        }

        try {
          const user = await User.findById(users[0]._id);
          
          expect(user.tokens.length).toBe(0);
          done();
        } catch (e) {
          done(e);
        }
      });
  });
});
    
