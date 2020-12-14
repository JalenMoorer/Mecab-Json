const express = require('express');
const cors = require('cors');
const mecab = require('../index.js');

const { promisify } = require('util');

const mecabSentence = promisify(mecab);

// create server
const server = express();
const port = 4000;

// GET question endpoint
server.get("/api/v1/morph", cors(), async (req, res) => {
    const sentence = req.query.sentence;
    const data = await mecabSentence(sentence, res);
});

// starting server
server.listen(port, () => {
    console.log(`Server listening at ${port}`);
});