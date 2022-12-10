const express = require("express");
const app = express();
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const TodoTask = require("./models/todoTask");

dotenv.config();


app.set("view engine","ejs");
app.use(express.urlencoded({extended:true}));

app.get('/', (req,res)=>{
    TodoTask.find({}, (err,tasks)=>{
        res.render("todo.ejs",{todoTasks: tasks});
    });
});

app.post('/',async (req,res)=> {
    const todoTask = new TodoTask({
        content: req.body.content,
    });
    try{
        await todoTask.save();
        res.redirect("/");
    }
    catch(err)
    {
        res.redirect("/");
    }
    
});

app.route("/edit/:id")
.get((req,res)=>{
    const id=req.params.id;
    TodoTask.find({},(err,tasks)=>{
        res.render("todoEdit.ejs",{todoTasks:tasks,idTask:id});
    });
})
.post((req,res)=>{
    const id=req.params.id;
    TodoTask.findByIdAndUpdate(id,{content:req.body.content},err=>{
        if(err) 
            return res.send(500,err);
            res.redirect("/");
    });
});

app.route("/remove/:id")
.get((req,res)=>
{
    const id=req.params.id;
    TodoTask.findByIdAndRemove(id,err=>{
        if(err)
            return res.send(500,err);
        res.redirect('/');
    });
});




app.use("/static",express.static("public"));


//connection to mongodb
mongoose.connect(process.env.DB_CONNECT,{
    useNewUrlParser: true,
},()=>{
    console.log("Connected to Mongo DB");
    app.listen(3000, () => console.log("Server Up and running again"));
});




