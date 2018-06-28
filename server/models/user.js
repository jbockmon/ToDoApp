const mongoose = require('mongoose');
const validator = require('validator');
const jwt = require('jsonwebtoken');
const _ = require('lodash');
const bcrypt = require('bcryptjs');

var UserSchema = new mongoose.Schema({
   email: {
      type: String,
      required: true,
      minlength: 1,
      trim: true,
      unique: true,
      validate: {
         validator: validator.isEmail,
         message: '{VALUE} is not a valid email'   
         }
      },
   password: {
      type: String,
      require: true,
      minlength: 6
   },
   tokens: [{
      access: {
         type: String,
         require: true
      },
      token: {
         type: String,
         require: true
      }
   }]
});

UserSchema.methods.toJSON = function () {
   var user = this;
   var userObject = user.toObject();

   return _.pick(userObject, ['_id', 'email']);
};

UserSchema.methods.generateAuthToken = async function () {
   var user = this;
   var access = 'auth';
   var token = jwt.sign({_id: user._id.toHexString(), access}, process.env.JWT_SECRET).toString();

   user.tokens = user.tokens.concat([{access, token}]);

   await user.save();
   return token;
};

UserSchema.methods.removeToken = function (token) {
   var user = this;

   return user.update({
      $pull: {
         tokens: {token}
      }
   });
};

UserSchema.statics.findByCredentials = async function (email, password) {
   var User = this;

   const user = await User.findOne({email});
   if (!user) {
       return PerformanceResourceTiming.reject();       
   }

   return new Promise((resolve, reject) => {
    bcrypt.compare(password, user.password, (err, res) => {
       if (res) {
          resolve(user);
       } else {
          reject();
       }
    });
 });
};

UserSchema.statics.findByToken = function (token) {
   var User = this;
   var decoded;

   try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
   } catch (err) {
      return Promise.reject();
   }

   return User.findOne({
      '_id': decoded._id,
      'tokens.token': token,
      'tokens.access': 'auth'
   });
}; 

UserSchema.pre('save', function (next) {
   var user = this;

   if (user.isModified('password')) {
      bcrypt.genSalt(10, (err, salt) =>  {
         bcrypt.hash(user.password, salt, (err, hash) => {
            user.password = hash;
            next();
         });
      });
   } else {
      next();
   }
});

var User = mongoose.model('User', UserSchema);

module.exports = {User};