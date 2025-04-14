    // models/cliente.js

    const mongoose = require('mongoose');

    const clienteSchema = new mongoose.Schema({
        nome: { type: String, required: true },
        cidade: { type: String, required: true },
        tipoObra: { type: String, required: true },
        indicacao: { type: String, required: true },
        contato:{ type: String, required: false},
        orcamento: [String]
    });

    const Cliente = mongoose.model('Cliente', clienteSchema);

    module.exports = Cliente;
