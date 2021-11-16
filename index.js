const express = require("express");
const db = require("./database");
const bcrypt = require("bcrypt");
const app = express();
var validator = require("email-validator");

const session = require("express-session");
var FileStore = require("session-file-store")(session);
const cookieParser = require("cookie-parser");
const { urlencoded } = require("body-parser");

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));


app.use(
  session({
    resave: false,
    secret: "thisisdemoproject",
    cookie: {
      maxAge: 1000 * 60 * 5, // 5mins
    },
    store: new FileStore({ logFn: function () {} }),
    saveUninitialized: false,
  })
);

const encryptPassword = async (req, res, password) => {
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      return hashedPassword;
    } catch (err) {
      res.status(501).json({ msg: `${err}` });
    }
  };
  
  const decryptPassword = async (req, res, password, hashedPassword) => {
    try {
      const encodedPassword = await bcrypt.compare(password, hashedPassword);
      return encodedPassword;
    } catch (err) {
      res.status(501).json({ msg: `${err}` });
    }
  };

const validEmail = (email) => {
    return validator.validate(email);
  };

// const dbCheckItem = (item) => { 
//     return new Promise((res,rej) => {
//         mySqlConnection.query(`SELECT * from items where name = '${item}' ` , (e , r , f) =>{
//             if(!e){
//                 var obj = Object.assign({} , r[0]);
//                 res(obj)
//             }          
//             rej({});                                                  
//         })
//     })
// };

// const dbInsertItem = (item,cost) => { 
//     return new Promise((res,rej) => {
//         mySqlConnection.query(`INSERT into items(item,cost) values ('${item}' , '${cost}') ` , (e , r , f) =>{
//             if(!e){
//                 res();
//             }          
//             rej();                                                  
//         })
//     })
// };

// const dbInsertOrder = (address,username,item,quantity) => { 
//     return new Promise((res,rej) => {
//         mySqlConnection.query(`INSERT into items(address,username,item,cost,status) values ('${address}' , '${username}' , '${item}' , '${quantity}' , 0) ` , (e , r , f) =>{
//             if(!e){
//                 res();
//             }          
//             rej();                                                  
//         })
//     })
// };


app.get('/' , (req,res) => {
    return res.sendFile(__dirname + '\\public\\html\\index.html');
})

app.get('/login' , (req,res) => {
    return res.sendFile(__dirname + '/public/html/login.html');
})

app.get('/register' , (req,res) => {
    return res.sendFile(__dirname + '/public/html/register.html');
})

app.get('/profile' , (req,res) => {
    return res.sendFile(__dirname + '/public/html/profile.html');
})

app.get('/scripts/login.js' , (req,res) => {
    return res.sendFile(__dirname + '\\public\\scripts\\login.js');
})

app.get('/scripts/register.js' , (req,res) => {
    return res.sendFile(__dirname + '\\public\\scripts\\register.js');
})

app.get('/scripts/menu.js' , (req,res) => {
    return res.sendFile(__dirname + '\\public\\scripts\\menu.js');
})

app.get('/menu' , (req,res) => {
    try{
        let sql = "SELECT * from items";
        db.con.query(sql, (error, result) => {
            let menu = Object.assign({}, result);
            if(error) throw error;
            return res.status(200).send(menu);
        });
    }catch(e){
        console.log(e);
        res.status(500).json({"msg" : "Problem on our side :( "})
    }
})

app.post('/login' , (req,res) => {
    var { username, password } = req.body;
    try {
        if (req.session.authenticated) {
            return res.status(200).json({"msg" : "sucessfully logged in :)"});
        }
        let sql = `Select * from user where username="${username}"`;
        db.con.query(sql, async (error, result) => {
            let obj = Object.assign({}, result);

            if (Object.keys(obj).length === 1) {
                let flag = await decryptPassword(req, res, password, obj[0].password);
                if (!flag) res.status(400).json({ msg: "password not match" });
                req.session.authenticated = true;
                req.session.username = username;
                return res.status(200).json({"msg" : "sucessfully logged in :)"});
            } else {
                return res.status(400).json({ msg: "invalid user" });
            }
        });
    } catch (err) {
        return res.status(500).json({ msg: `${err}` });
    }
})



app.post("/register", async (req, res) => {;
    var { username, password } = req.body;
    try {
        if (!validEmail(username)){
            console.log('HERE' , username)
            return res.status(400).json({ msg: "enter email correctly" });
        }
        let sql = `Select * from user where username="${username}"`;
        db.con.query(sql, async (error, result) => {
            if (error) res.status(501).json({ msg: `${error}` });

            let obj = Object.assign({}, result);

            if (Object.keys(obj).length === 0) {
                password = await encryptPassword(req, res, password);
                var sql = `INSERT into user (username,password) values ("${username}","${password}")`;
                try {
                db.con.query(sql, (er, result) => {
                    if (er) throw res.status(501).json({ msg: `${er}` });
                     return res.status(400).json({ msg: "valid request" });
                });
                } catch (err) {
                res.status(501).json({ msg: `${er}` });
                }
            } else {
                return res.status(400).json({ msg: "existing user" });
            }
        });
    } catch (err) {
       
      res.status(500).json({ msg: `${err}` });
    }
});

app.post("/placeOrder", (req, res) => {
    if (req.session.authenticated) {
      try {
        var { address } = req.body.address;
        if (address === null || address === "")
          res.status(401).json({ msg: "enter address cannot be empty" });
  
        for (var key in req.body.order) {
          {
            let sql = `INSERT INTO pendingorders (address,item,quantity,username) values("${address}","${key}","${req.body.order[key]}","${req.session.username}")`;
            db.con.query(sql, (error, result) => {
              if (error) {
                res.status(501).json({ msg: `${error}` });
              }
            });
          }
          res.status(200).json({ msg: "waiting for confirmation" });
        }
      } catch (err) {
        res.status(501).json({ msg: `${err}` });
      }
    } else {
      res.status(401).json({ msg: "first log in" });
    }
  });

app.listen(3000 , () => {
    console.log('Server is up and running on port 3000');
});