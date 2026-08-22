import express from 'express'

export const eRouter = express.Router()

//Register as an Employer.
eRouter.post('/register',(req,res)=>{
    
})

//Login
eRouter.post('/login',(req,res)=>{
    
})

//Create a new job posting.
eRouter.post('/create-job',(req,res)=>{
    
})

//View their own job postings.
eRouter.get('/view-jobs',(req,res)=>{
    
})

//View a specific job posting.
eRouter.get('/view-jobs/:id',(req,res)=>{
    
})

//Update their own job posting.
eRouter.put('/update-job/:id',(req,res)=>{
    
})

//Delete their own job posting.
eRouter.delete('/delete-job/:id',(req,res)=>{
    
})

//View applications received for their jobs.
eRouter.get('/view-applications',(req,res)=>{
    
})

//Update the status of an application.
eRouter.put('/update-status/:id',(req,res)=>{
    
})