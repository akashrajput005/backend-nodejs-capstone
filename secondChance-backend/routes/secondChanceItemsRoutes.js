const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const connectToDatabase = require('../models/db');
const logger = require('../logger');
const { ObjectId } = require('mongodb');

const directoryPath = 'public/images';

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, directoryPath);
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage: storage });

// GET all items
router.get('/', async (req, res, next) => {
  logger.info('/ called');
  try {
    const db = await connectToDatabase();
    const collection = db.collection("secondChanceItems");
    const secondChanceItems = await collection.find({}).toArray();
    res.json(secondChanceItems);
  } catch (e) {
    logger.console.error('oops something went wrong', e);
    next(e);
  }
});

// POST a new item
router.post('/', upload.single('image'), async (req, res, next) => {
  try {
    const db = await connectToDatabase();
    const collection = db.collection("secondChanceItems");

    const newItem = req.body;
    const lastItem = await collection.find({}).sort({ id: -1 }).limit(1).toArray();
    const newId = (lastItem[0]?.id || 0) + 1;
    newItem.id = newId;
    newItem.createdAt = new Date();

    if (req.file) {
      newItem.image = req.file.filename;
    }

    const result = await collection.insertOne(newItem);
    res.status(201).json(result.ops[0]);
  } catch (e) {
    next(e);
  }
});

// GET item by ID
router.get('/:id', async (req, res, next) => {
  try {
    const db = await connectToDatabase();
    const collection = db.collection("secondChanceItems");
    const id = parseInt(req.params.id);
    const secondChanceItem = await collection.findOne({ id: id });

    if (!secondChanceItem) {
      return res.status(404).json({ message: 'Item not found' });
    }

    res.json(secondChanceItem);
  } catch (e) {
    next(e);
  }
});

// PUT update item by ID
router.put('/:id', async (req, res, next) => {
  try {
    const db = await connectToDatabase();
    const collection = db.collection("secondChanceItems");
    const id = parseInt(req.params.id);
    const existingItem = await collection.findOne({ id: id });

    if (!existingItem) {
      return res.status(404).json({ message: 'Item not found' });
    }

    const updatedItem = {
      ...existingItem,
      ...req.body,
      age_years: (req.body.age_days / 365).toFixed(1),
      updatedAt: new Date()
    };

    await collection.updateOne({ id: id }, { $set: updatedItem });
    res.json({ message: 'Item updated successfully' });
  } catch (e) {
    next(e);
  }
});

// DELETE item by ID
router.delete('/:id', async (req, res, next) => {
  try {
    const db = await connectToDatabase();
    const collection = db.collection("secondChanceItems");
    const id = parseInt(req.params.id);

    const existingItem = await collection.findOne({ id: id });
    if (!existingItem) {
      return res.status(404).json({ message: 'Item not found' });
    }

    await collection.deleteOne({ id: id });
    res.json({ message: 'Item deleted successfully' });
  } catch (e) {
    next(e);
  }
});

module.exports = router;