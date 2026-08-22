import express from 'express'

export const aRouter = express.Router()

//View all registered users.
aRouter.get('/view-users',(req,res)=>{
    
})

//View a user by ID.
aRouter.get('/view-user/:id',(req,res)=>{
    
})

//Update user status when required.
aRouter.put('/update-status/:id',(req,res)=>{
    
})

//Delete a user when required.
aRouter.delete('/delete-user/:id',(req,res)=>{
    
})

//View all job postings.
aRouter.get('/view-jobs',(req,res)=>{
    
})

//View a job posting by ID.
aRouter.get('/view-job/:id',(req,res)=>{
    
})

//Remove inappropriate or invalid job postings.
aRouter.delete('/delete-job/:id',(req,res)=>{
    
})

//Review platform data through protected admin APIs.