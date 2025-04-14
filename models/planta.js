// models/planta.js
const mongoose = require('mongoose');

const plantaSchema = new mongoose.Schema({
    especie: {
        type: String,
        required: true
    },
    quantidade: {
        type: Number,
        required: true
    },
    altura: {
        type: String,
        required: true
    },
    local: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model('Planta', plantaSchema);
