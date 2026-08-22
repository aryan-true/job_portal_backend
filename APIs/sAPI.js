import express from 'express'
export const sRouter = express.Router()

//JobSeeker Signup
sRouter.post('/register',(req,res)=>{
    
})

//Login and receive the authentication cookie.
sRouter.post('/login',(req,res)=>{
    
})

//view profile
sRouter.get('/view-profile',(req,res)=>{
    
})

//update their own profile.
sRouter.put('/update-profile',(req,res)=>{
    
})

//View all available jobs
sRouter.get('/view-jobs',(req,res)=>{
    
})

//View a single job by ID
sRouter.get('/view-jobs/:id',(req,res)=>{
    
})

//Apply for a job.
sRouter.post('/apply/:id',(req,res)=>{
    
})

//View their submitted applications
sRouter.get('/view-applications',(req,res)=>{
    
})

//logout from application
sRouter.post('/logout',(req,res)=>{
    
})