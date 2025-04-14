const mongoose = require('mongoose');

const obraSchema = new mongoose.Schema({
    nome: {
        type: String,
        required: true
    },
    cliente: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Cliente',
        default: null // Selecione "nenhum cliente" por padrão
    },
    status: {
        type: String,
        enum: ['aberta', 'fechada'],
        default: 'aberta'
    }
});

const Obra = mongoose.model('Obra', obraSchema);

module.exports = Obra;
