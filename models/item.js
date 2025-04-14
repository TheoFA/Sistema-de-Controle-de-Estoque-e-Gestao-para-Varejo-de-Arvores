const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
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
    },
    data: {
        type: String,
        required: true
    },
    valor: {
        type: String,
        default: '0' // Define um valor padrão como 0
    }
});

module.exports = mongoose.model('Item', itemSchema);
