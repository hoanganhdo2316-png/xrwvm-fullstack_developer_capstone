const express = require('express');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const Reviews = require('./review');
const Dealerships = require('./dealership');
const app = express();
const port = Number(process.env.PORT || 3030);
const mongoUrl = process.env.MONGODB_URL || 'mongodb://mongo_db:27017/dealershipsDB';
app.use(cors());
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: false }));
const seedData = (file, key) => JSON.parse(fs.readFileSync(path.join(__dirname, 'data', file), 'utf8'))[key];
async function seedIfEmpty() {
  if (await Reviews.countDocuments() === 0) await Reviews.insertMany(seedData('reviews.json', 'reviews'));
  if (await Dealerships.countDocuments() === 0) await Dealerships.insertMany(seedData('dealerships.json', 'dealerships'));
}
const integer = (value) => Number.parseInt(value, 10);
const validId = (value) => Number.isInteger(value) && value > 0;
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
app.get('/', (req, res) => res.json({ message: 'Dealership MongoDB API', status: 'ok' }));
app.get('/fetchReviews', async (req, res) => { try { res.json(await Reviews.find().sort({ id: 1 }).lean()); } catch { res.status(500).json({ error: 'Unable to fetch reviews' }); } });
app.get('/fetchReviews/dealer/:id', async (req, res) => { const id=integer(req.params.id); if(!validId(id))return res.status(400).json({error:'Invalid dealer ID'}); try{return res.json(await Reviews.find({dealership:id}).sort({id:1}).lean());}catch{return res.status(500).json({error:'Unable to fetch dealer reviews'});} });
app.get('/fetchDealers', async (req,res)=>{try{res.json(await Dealerships.find().sort({id:1}).lean());}catch{res.status(500).json({error:'Unable to fetch dealerships'});}});
app.get('/fetchDealers/:state', async (req,res)=>{const state=req.params.state.trim();const exact=new RegExp(`^${escapeRegex(state)}$`,'i');const query=/^all$/i.test(state)?{}:{$or:[{state:exact},{st:exact}]};try{res.json(await Dealerships.find(query).sort({id:1}).lean());}catch{res.status(500).json({error:'Unable to fetch dealerships by state'});}});
app.get('/fetchDealer/:id', async (req,res)=>{const id=integer(req.params.id);if(!validId(id))return res.status(400).json({error:'Invalid dealer ID'});try{const dealer=await Dealerships.findOne({id}).lean();return dealer?res.json(dealer):res.status(404).json({error:'Dealership not found'});}catch{return res.status(500).json({error:'Unable to fetch dealership'});}});
app.post('/insert_review', async (req,res)=>{const data=req.body||{};const required=['name','dealership','review','purchase_date','car_make','car_model','car_year'];const missing=required.filter((field)=>data[field]===undefined||String(data[field]).trim()==='');if(missing.length)return res.status(400).json({error:`Missing fields: ${missing.join(', ')}`});const dealership=integer(data.dealership),carYear=integer(data.car_year);if(!validId(dealership)||!Number.isInteger(carYear))return res.status(400).json({error:'Invalid dealership or car year'});try{if(!(await Dealerships.exists({id:dealership})))return res.status(404).json({error:'Dealership not found'});const latest=await Reviews.findOne().sort({id:-1}).select('id').lean();const saved=await Reviews.create({id:latest?latest.id+1:1,name:String(data.name).trim(),dealership,review:String(data.review).trim(),purchase:Boolean(data.purchase),purchase_date:String(data.purchase_date),car_make:String(data.car_make).trim(),car_model:String(data.car_model).trim(),car_year:carYear});return res.status(201).json(saved.toObject());}catch{return res.status(500).json({error:'Unable to insert review'});}});
async function start(){await mongoose.connect(mongoUrl);await seedIfEmpty();app.listen(port,()=>console.log(`Server is running on http://localhost:${port}`));}
if(require.main===module)start().catch((error)=>{console.error(error.message);process.exit(1);});
module.exports={app,start,seedIfEmpty};
