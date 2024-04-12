const express = require('express');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = 'secret_key';

app.use(bodyParser.json());

const users = [
    {
        username: 'use1',
        password: 'pass1'
    }
];

// Middleware for JWT authentication
const authenticateJWT = (req, res) => {
    const token = req.headers.authorization;
    if (!token) {
        return res.status(401).json({ message: 'Authentication failed: No token provided' });
    }

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Authentication failed: Invalid token' });
        }
        req.user = user;
        next();
    });
};

// Authentication endpoint
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username && u.password === password);

    if (!user) {
        return res.status(401).json({ message: 'Authentication failed: Invalid username or password' });
    }

    const token = jwt.sign({ username: user.username }, SECRET_KEY);
    res.json({ token });
});

// Arithmetic operations endpoints
app.post('/add', authenticateJWT, (req, res) => {
    const { num1, num2 } = req.body;
    const result = num1 + num2;
    res.json({ result });
});

app.post('/subtract', authenticateJWT, (req, res) => {
    const { num1, num2 } = req.body;
    const result = num1 - num2;
    res.json({ result });
});

app.post('/multiply', authenticateJWT, (req, res) => {
    const { num1, num2 } = req.body;
    const result = num1 * num2;
    res.json({ result });
});

app.post('/divide', authenticateJWT, (req, res) => {
    const { num1, num2 } = req.body;
    if (num2 === 0) {
        return res.status(400).json({ message: 'Division by zero is not allowed' });
    }
    const result = num1 / num2;
    res.json({ result });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});



