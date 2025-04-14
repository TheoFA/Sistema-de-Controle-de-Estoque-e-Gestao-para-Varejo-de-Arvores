const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Item2Schema = new Schema({
    categoria: String,
    descricao: String,
    quantidade: Number,
    altura: Number,
    valor: Number,
});

const OrcamentoSchema = new Schema({
    cliente: { type: Schema.Types.ObjectId, ref: 'Obra' },
    data: { type: Date, default: Date.now },
    itens: [Item2Schema],
    valorTotal: Number,
    status: String
});

module.exports = mongoose.model('Orcamento', OrcamentoSchema);
