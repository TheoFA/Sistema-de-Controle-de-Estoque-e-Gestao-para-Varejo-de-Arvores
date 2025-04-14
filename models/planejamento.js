const mongoose = require('mongoose');

const planejamentoSchema = new mongoose.Schema({
    titulo: String,
    data: Date,
    funcionarios: [String],
    descricao: String
});

module.exports = mongoose.model('Planejamento', planejamentoSchema);
