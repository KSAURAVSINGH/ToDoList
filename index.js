const express = require("express");
const bodyParser = require('body-parser')
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const passport = require('passport');
const session = require('express-session')
const MongoStore = require('connect-mongo')
const LocalStrategy = require('passport-local').Strategy;
const TodoTask = require("./models/todoTask");
const User = require("./models/user");
dotenv.config();

const app = express();

app.use(bodyParser.urlencoded({
    extended:true
}));
app.use(bodyParser.json())

app.set("view engine","ejs");


// SESSION
const sessionStore = MongoStore.create({
    mongoUrl: process.env.DB_CONNECT,
    collection: "ToDoSessions"
})

app.use(session({
    secret: 'some new secret',
    store: sessionStore,
    resave: false,
    saveUninitialized: true,
    cookie: {
        maxAge: 1000*60*60*24
    }
}))

// PASSPORT
const verifyCallback = (username,password,done) =>{
    
    console.log("In the verify CAllback")
    User.find({username: username,password:password},(err,data)=>{
        if(err)
            return done(err);
        if(!data)
            return done(null,false);
        return done(null,data[0]);
    })
}
const strategy = new LocalStrategy(verifyCallback);
passport.use(strategy);

passport.serializeUser((user,done)=>{
    done(null,user._id);
})

passport.deserializeUser((userId,done) =>{
    User.findById(userId,(err,data)=>{
        if(err)
            done(err);
        console.log(data)
        return done(null,data);
    })
})

app.use(passport.initialize());
app.use(passport.session());



// ROUTE

app.get('/',(req,res,next) =>{
    console.log(req.session);
   
    res.render('welcome',{
        success: false
    });
})

app.get('/register',(req,res,next) =>{
    res.render('register')
})

app.post('/register', (req,res,next)=>{

    console.log("In the register post page")
    let username = req.body.username;
    let password = req.body.password;

    console.log(username);
    console.log(password);

    let newUser = new User({
        username: username,
        password: password
    });

    User.find({"username":username},async (err,data)=>{
        if(err)
            throw err;
        if(data.length>0)
        {
            res.send("User exits");
        }
        else
        {
            console.log("Before await")
            await newUser.save();
            res.redirect('/');
        }
    })

})
 
app.get('/login',(req,res,next)=>{
    res.render('login')
})

app.post('/login',passport.authenticate('local'),(req,res,next)=>{

    console.log(req.user);
    console.log(req.session);
    let userID = req.user._id;
    
    res.redirect(`/home/${userID}`)
})


 

app.get('/home/:userID', async (req,res)=>{

    let userID = req.params.userID;

    const data = await User.findById(userID).populate({path:"task"});

    console.log(data);
    res.render('todo.ejs',{
        todoTasks: data.task,
        userID: userID
    })
    
   
});

app.post('/home/:userID',async (req,res)=> {

    let userID = req.params.userID;

    const todoTask ={
        content: req.body.content,
    };

    TodoTask.create(todoTask,(err,data)=>{
        if(err)
            throw err;
            
            User.findById(userID,async (err,result)=>{
                if(err)
                    throw err;
                else
                {
                    console.log(result);
                    console.log("Before data")
                    console.log(data);
                    let dataID = data._id;
                    result.task.push(dataID);
                    await result.save();
                    console.log("Before redirecting")
                    res.redirect(`/home/${userID}`);
                }
            })
    })
});
 
app.route("/edit/:userID/:id")
.get((req,res)=>{

    const id=req.params.id;
    let userID = req.params.userID;

    TodoTask.find({},(err,tasks)=>{
        res.render("todoEdit.ejs",{todoTasks:tasks,idTask:id,userID:userID});
    });


})
.post((req,res)=>{
    const id=req.params.id;
    let userID = req.params.userID;

    TodoTask.findByIdAndUpdate(id,{content:req.body.content},err=>{
        if(err) 
            return res.send(500,err);
            res.redirect(`/home/${userID}`);
    });
});

app.route("/remove/:userID/:id")
.get((req,res)=>
{
    const id=req.params.id;
    const userID = req.params.userID;

    let userQuery = {
        "_id" : userID
    };

    TodoTask.findByIdAndRemove(id,err=>{
        if(err)
            return res.send(500,err);

        User.findOneAndUpdate(userQuery, {
            $pull: {
                'task': id
            }
        },(err, model) =>{
            if(err)
                throw err;
            else    
            {
                res.redirect(`/home/${userID}`);
            }
        })
    });
});

app.get('/logout',(req,res,next)=>{
    req.logout((err)=>{
        if(err)
            throw err;
        else    
        res.redirect('/')
    });
    
})

app.use("/static",express.static("public"));



// CONNECTION TO MONGODB
mongoose.connect(process.env.DB_CONNECT,{
    useNewUrlParser: true,
},(err)=>{
    if(err)
        console.log(err);
    console.log("Connected to Mongo DB");
    app.listen(8000, () => console.log("Server Up and running again"));
});




