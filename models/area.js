// models/especie.js
const mongoose = require('mongoose');

const areaSchema = new mongoose.Schema({
    nome: {
        type: String,
        required: true
    },
});

module.exports = mongoose.model('Area', areaSchema);
