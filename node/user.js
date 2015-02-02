var 
  _email = require("nodemailer"),
  mysql = require('mysql'),
  hash = require("jshashes"),
  _mysql = mysql.createClient({
    user: 'root',
    password: 'norm1066'
  }),
  fs = require('fs');

_mysql.query("USE mt80s");

function crypt(txt) {
  return hash.MD5().hex(txt);
}

function exists(field, username, cb) {
  _mysql.query(
    "select * from users where " + field + "=?", 
    [username], 
    function(err, res, fields) {
      if(res) {
        cb(res.length > 0, res);
      } else {
        cb(false, res);
      }
    });
};

module.exports = {
  register: function (username, password, email) {
    _mysql.query("insert into users(username, password, email) values(?, ?, ?)",
        [username, crypt(password), email], function(err, last) {
      console.log(err,last);
      doMail(email, "welcome");
    });
  },

  sendreset: function(email) {
    var newPassword = Math.floor(1e9 + Math.random() * 1e9).toString(36);
    findAndSet(
      ['email', email],
      ['password', crypt(newPassword)],
      function(user) {
        console.log(user);
        doMail(email, "reset", "\n" + [
          "username: " + user.username,
          "password: " + newPassword
        ].join("\n\n"));
      }
    )
  },

  exists: exists,

  login: function(username, password, cb) {
   exists("username", username, function(exist, result) {
      if(exist) {
        console.log(result, result[0].password, crypt(password));
        cb(result[0].password == crypt(password));
      } else {
        cb(false);
      }
    });
  }
}

function findAndSet(query, action, cb) {
  _mysql.query("select * from users where ?=?", query, function(err, last) {
    console.log(last);
    if(last) {
      _mysql.query("update users set ?=? where username=?", action.concat(last.username), function() {
        cb(last);
      });
    } 
  });
};

function doMail(email, template, append) {
  var server  = _email.createTransport("SMTP",{
    service: "Gmail",
    auth: {
      user: "chatwithvideos@gmail.com",
      pass: "norm1066"
    }
  });

  fs.readFile("mail/" + template + ".txt", function(err, data) {

    data = data.toString();
    var 
      lines = data.split("\n"),
      subject = lines.shift(),
      body = lines.join("\n");

    server.sendMail({
      from: "Vukkake Robot <chatwithvideos@gmail.com>",
      to: email,
      subject: subject,
      text:  body + (append || ""),
      html: "<pre><tt>" + body + (append || "") + "</tt></pre>"
    }, function(){ 
      server.close();
    });
  });
}
