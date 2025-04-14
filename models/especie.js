// models/especie.js
const mongoose = require('mongoose');

const especieSchema = new mongoose.Schema({
    nome: {
        type: String,
        required: true
    },
});

module.exports = mongoose.model('Especie', especieSchema);
