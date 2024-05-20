const express = require('express');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const { MongoClient } = require('mongodb');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Create an Express application
const app = express();
app.use(bodyParser.json());

// Define a secret key for JWT signing
const SECRET_KEY = 'aZlG9#s!5kSd2@fPqB8&z^6hW*xCy4uT';

// MongoDB URI and Database Name
const uri = 'mongodb://localhost:27017';
const dbName = 'mydb';

// Create a new MongoClient
const client = new MongoClient(uri);

// Define a middleware function for JWT authentication
const authenticateJWT = (req, res, next) => {
    const token = req.headers.auth;

    if (token) {
        jwt.verify(token, SECRET_KEY, (err, user) => {
            if (err) {
                return res.sendStatus(403);
            }

            req.user = user;
            next();
        });
    } else {
        res.sendStatus(401);
    }
};

// Define a login route
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        await client.connect();
        const database = client.db(dbName);
        const users = database.collection('users');

        const user = await users.findOne({ username, password });
        console.log(user);
        if (user) {
            const token = jwt.sign({ username }, SECRET_KEY);
            res.json({ token });
        } else {
            res.sendStatus(401);
        }
    } catch (error) {
        res.status(500).send('Server error');
    } finally {
        await client.close();
    }
});

// Define a register route
app.post('/register', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).send('Username and password are required');
    }

    try {
        await client.connect();
        const database = client.db(dbName);
        const users = database.collection('users');
        
        // Insert the new user
        await users.insertOne({ username, password });
        res.status(201).send('User created successfully');
    } catch (error) {
        res.status(500).send('Error registering new user');
    } finally {
        await client.close();
    }
});

// Define CRUD operations for products
app.post('/products/create', authenticateJWT, async (req, res) => {
    const { pId, pName } = req.body;

    try {
        await client.connect();
        const database = client.db(dbName);
        const products = database.collection('products');

        // Insert the new product
        await products.insertOne({ pId, pName });
        res.status(201).send('Product created successfully');
    } catch (error) {
        res.status(500).send('Error creating product');
    } finally {
        await client.close();
    }
});

app.get('/products/view', authenticateJWT, async (req, res) => {
    try {
        await client.connect();
        const database = client.db(dbName);
        const products = database.collection('products');

        

        const productsList = await products.find({}).toArray();
        res.json(productsList);
    } catch (error) {
        res.status(500).send('Error retrieving products');
    } finally {
        await client.close();
    }
});

app.put('/products/update', authenticateJWT, async (req, res) => {
    const { pId, pName } = req.body;
    
    try {
        await client.connect();
        const database = client.db(dbName);
        const products = database.collection('products');

        await products.updateOne({ pId }, { $set: { pName } });
        res.send('Product updated successfully');
    } catch (error) {
        res.status(500).send('Error updating product');
    } finally {
        await client.close();
    }
});

app.delete('/products/delete', authenticateJWT, async (req, res) => {
    const { pId, pName } = req.body;

    try {
        await client.connect();
        const database = client.db(dbName);
        const products = database.collection('products');

        await products.deleteOne({ pId });
        res.send('Product deleted successfully');
    } catch (error) {
        res.status(500).send('Error deleting product');
    } finally {
        await client.close();
    }
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
      cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
      cb(null,file.originalname);
  },
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10000000 }, // limit file size to 1MB
  fileFilter: (req, file, cb) => {
      // only allow jpg, jpeg, png file types
      if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
          return cb(new Error('Only jpg, jpeg, png files are allowed.'));
      }
      cb(null, true);
  }
});

// Define a route for uploading files
app.post('/upload', authenticateJWT, upload.single('file'), (req, res) => {
  if (!req.file) {
      return res.status(400).send('No file uploaded');
  }
  res.json({ message: 'File uploaded successfully', filename: req.file.filename });
});

// Define a route for downloading files
app.get('/download', authenticateJWT, (req, res) => {
  const filename = req.body.filename;
  console.log(filename);
  const filepath = path.join(__dirname, 'uploads', filename);
  console.log(filepath);
  
  res.download(filepath, (err) => {
      if (err) {
          res.status(500).send('Error downloading file');
      }
  });
});


// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
