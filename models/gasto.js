const mongoose = require('mongoose');

const gastoSchema = new mongoose.Schema({
    tipoGasto: {
        type: String,
        enum: ['gastos-gerais', 'obra-cliente'],
        required: true
    },
    categoria: {
        type: String,
        required: true
    },
    produto: {
        type: String,
        required: true
    },
    obra: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Obra'
    },
    quantidade: {
        type: Number,
    },
    valor: {
        type: Number,
        required: true
    },
    data: {
        type: Date,
        required: true
    }
});

const Gasto = mongoose.model('Gasto', gastoSchema);

module.exports = Gasto;
