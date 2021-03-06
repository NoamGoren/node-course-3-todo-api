const expect = require('expect');
const request = require('supertest');
const {ObjectID}= require('mongodb');
const _ = require('lodash');


const{app} = require('./../server');
const{Todo} = require('./../models/todo');
const{User} =require('./../models/user');
const{todos,populateTodos,users,populateUsers}=require('./seed/seed');

beforeEach(populateUsers);
beforeEach(populateTodos);

describe('POST /todos',()=>{
  it('should create a new todo', (done) => {
    var text = 'Test todo text';

    request(app)
      .post('/todos')
      .set('x-auth', users[0].tokens[0].token)
      .send({text})
      .expect(200)
      .expect((res) => {
        expect(res.body.text).toBe(text);
      })
      .end((err, res) => {
        if (err) {
          return done(err);
        }

        Todo.find({text}).then((todos) => {
          expect(todos.length).toBe(1);
          expect(todos[0].text).toBe(text);
          done();
        }).catch((e) => done(e));
      });
  });

  it('should not create todo with invalid body data',(done)=>{


    request(app)
      .post('/todos')
      .set('x-auth',users[0].tokens[0].token)
      .send({})
      .expect(400)
      .end((err,res)=>{
        if (err) {
          return done(err);
        }
        Todo.find().then((todos)=>{
          expect(todos.length).toBe(2);
          done();
        }).catch((e)=>done(e));
      });
  });
});


describe('GET /todos',()=>{
  it('should get all todos by user',(done)=>{
    request(app)
    .get('/todos')
    .set('x-auth',users[0].tokens[0].token)
    .expect(200)
    .expect((res)=>{
      expect(res.body.todos.length).toBe(1);
    })
    .end(done);
  })
})

describe('GET /todos/:id',()=>{
  it('Should retun todo doc',(done)=>{
    request(app)
      .get(`/todos/${todos[0]._id.toHexString()}`)
      .set('x-auth',users[0].tokens[0].token)
      .expect(200)
      .expect((res)=>{
        expect(res.body.todo.text).toBe(todos[0].text);
      })
      .end(done);
  });

  it('Should NOT retun todo doc creator by other user',(done)=>{
    request(app)
      .get(`/todos/${todos[1]._id.toHexString()}`)
      .set('x-auth',users[0].tokens[0].token)
      .expect(404)
      .end(done);
  });

  it('should return 404 if todo not found',(done)=>{
var hexId=new ObjectID().toHexString();

    request(app)
      .get(`/todos/${hexId}`)
      .set('x-auth',users[0].tokens[0].token)
      .expect(404)
      .end(done);
  });

  it('should return 404 for non ObjectID',(done)=>{
    request(app)
      .get(`/todos/123`)
      .set('x-auth',users[0].tokens[0].token)
      .expect(404)
      .end(done);
  });
});


//delete case

describe('DELETE /todos/:id',()=>{
  it('should remove a todo',(done)=>{
    var hexId=todos[1]._id.toHexString();
    var hexCreator= users[1]._id.toHexString();

    request(app)
      .delete(`/todos/${hexId}`)
      .set('x-auth',users[1].tokens[0].token)
      .expect(200)
      .expect((res)=>{
        expect(res.body.todo._id).toBe(hexId);
        expect(res.body.todo._creator).toBe(hexCreator);
      })
      .end((err,res)=>{
        if (err) {
          return done(err);
        }
        //query database using FindOne TO
        Todo.findOne({
          _id:hexId,
          _creator: hexCreator
        }).then((todo)=>{
          expect(todo).toBeFalsy();
          done();
        }).catch((e)=>done(e));
      });
  });

  it('should not remove a todo',(done)=>{
    var hexId=todos[0]._id.toHexString();
    var hexCreator= users[1]._id.toHexString();

    request(app)
      .delete(`/todos/${hexId}`)
      .set('x-auth',users[1].tokens[0].token)
      .expect(404)
      .end((err,res)=>{
        if (err) {
          return done(err);
        }
        //query database using findById TO
        Todo.findById(hexId).then((todo)=>{
          expect(todo).toBeTruthy();
          done();
        }).catch((e)=>done(e));
      });
  });



  it('should return 404 if todo not found',(done)=>{
    var hexId=new ObjectID().toHexString();

        request(app)
          .delete(`/todos/${hexId}`)
          .set('x-auth',users[1].tokens[0].token)
          .expect(404)
          .end(done);
  });
it('should return 404 if ObjectID is invalid',(done)=>{
  request(app)
    .delete(`/todos/123`)
    .set('x-auth',users[1].tokens[0].token)
    .expect(404)
    .end(done);
});


});

describe('PATCH /todos/:id',()=>{
  it('should update the todo',(done)=>{
    var hexId=todos[0]._id.toHexString();
    var hexCreator= users[0]._id.toHexString();
    var text='Update todo text';



    request(app)
      .patch(`/todos/${hexId}`)
      .set('x-auth',users[0].tokens[0].token)
      .send({
        completed:true,
        text
      })
      .expect(200)
      .expect((res)=>{
        expect(res.body.todo._creator).toBe(hexCreator)
        expect(res.body.todo.text).toBe(text);
        expect(res.body.todo.completed).toBe(true);
        // expect(res.body.todo.completedAt).toBeA('number');
        expect(typeof res.body.todo.completedAt).toBe('number');
      })
      .end(done);
    //grab id of first item
    //update text,set completed true
    // 200
    //text is changed,completed is true,completedAtt is a number .toBeA
  });

  it('should Not update other user todo',(done)=>{
    var hexId=todos[0]._id.toHexString();
    var test;
    var text='Update todo text';



    request(app)
      .patch(`/todos/${hexId}`)
      .set('x-auth',users[1].tokens[0].token)
      .send({
        completed:true,
        text
      })
      .expect(404)
      .end(done);
    //grab id of first item
    //update text,set completed true
    // 200
    //text is changed,completed is true,completedAtt is a number .toBeA
  });

  it('should clear completedAt when todo is not completed',(done)=>{
  var hexId=todos[1]._id.toHexString();
  var hexCreator= users[1]._id.toHexString();
  var text='Update todo text';
  request(app)
    .patch(`/todos/${hexId}`)
    .set('x-auth',users[1].tokens[0].token)
    .send({
      completed:false,
      text
    })
    .expect(200)
    .expect((res)=>{
      expect(res.body.todo.text).toBe(text);
      expect(res.body.todo.completed).toBe(false);
      expect(res.body.todo.completedAt).toBeFalsy();
    })
    .end(done);
    //grab id of second todo item
    //update text,set completed to false
    //200
    //text is changed,completed fakse,completedAt is null .toNotExist
  });
});

describe('GET /users/me',()=>{
  it('should return user if authenticated',(done)=>{
    request(app)
    .get('/users/me')
    .set('x-auth',users[0].tokens[0].token)
    .expect(200)
    .expect((res)=> {
      expect(res.body._id).toBe(users[0]._id.toHexString());
      expect(res.body.email).toBe(users[0].email);
    })
    .end(done);
  });

  it('should return 401 if not authenticated',(done)=>{
    request(app)
    .get('/users/me')
    .expect(401)
    .expect((res)=>{
      expect(res.body).toEqual({});
    })
    .end(done);
  });
});

describe('POST /users',()=>{
  it('should create a user',(done)=>{
    var email='noam.gon@gmail.com';
    var password ='InigoPass123';

    request(app)
      .post('/users')
      .send({email,password})
      .expect(200)
      .expect((res)=>{
        expect(res.headers['x-auth']).toBeTruthy();
        expect(res.body._id).toBeTruthy();
        expect(res.body.email).toBe(email);

      })
      .end((err)=>{
        if (err) {
         return done(err);
        }

        User.findOne({email}).then((user)=>{
          expect(user).toBeTruthy();
          expect(user.password).not.toBe(password);
          done();
        }).catch((e) => done(e));
      });
  });

  it('should return validation error if request is invalid',(done)=>{
    var email='noam.gongmail.com';
    var password ='I';

    request(app)
    .post('/users')
    .send({email,password})
    .expect(400)
    .end(done);

  });
  it('should not create user if email in use',(done)=>{
    var email='noam@ngmail.com';
    var password ='InigoPass123';

    request(app)
    .post('/users')
    .send({
      email:users[0].email,
      password:'InigoPass123'
    })
    .expect(400)
    .end(done);
  });
});

describe('POST /users/login', () => {
  it('should login user and return auth token', (done) => {
    request(app)
      .post('/users/login')
      .send({
        email: users[1].email,
        password: users[1].password
      })
      .expect(200)
      .expect((res) => {
        expect(res.header['x-auth']).toBeTruthy();
        User.findById(users[1]._id).then((user) => {
            expect(user.toObject().tokens[1]).toMatchObject({
                access: 'auth',
                token: res.header['x-auth']
            });
        }).catch((e) => done(e));
    })
    .end(done);
  });

  it('should reject invalid login',(done) => {
    request(app)
      .post('/users/login')
      .send({
        email: users[1].email,
        password: '123456'
      })
      .expect(400)
      .expect((res) => {
        expect(res.headers['x-auth']).toBeFalsy();
      })
      .end((err,res) =>{
        if (err) {
          return done(err);
      }
      User.findById(users[1]._id).then((user) => {
        expect(user.tokens.length).toBe(1);
        done();
      }).catch((e) => done(e));
        
      });

  });
})

//Gonna verify that when we send across a token
//it does indeed get remove from user collection

describe('DELETE /users/me/token',() => {
it('should remove auth token on logout',(done) =>{
request(app)
.delete('/users/me/token')
.set('x-auth',users[0].tokens[0].token)
.expect(200)
.end((err,res) =>{
  if(err) {
    return done(err);
  }
  User.findById(users[0]._id).then((user) =>{
    expect(user.tokens.length).toBe(0);
    done();
  }).catch((e) => done(e));
});

  //DELETE /users/me/token
  //set x-auth equal to token
  //expect 200
  //find user,verify that tokens array has length of zero

});
});