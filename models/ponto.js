// models/ponto.js
const mongoose = require('mongoose');

const pontoSchema = new mongoose.Schema({
    especie: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Especie',
        required: true
    },
    coordenadas: {
        type: [Number], // [x, y]
        required: true
    }
});

module.exports = mongoose.model('Ponto', pontoSchema);
