const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Item2Schema = new Schema({
    descricao: String,
    quantidade: Number,
    altura: Number,
    valor: Number,
});

const VendaSchema = new Schema({
    cliente: { type: Schema.Types.ObjectId, ref: 'Obra' },
    data: { type: Date, default: Date.now },
    itens: [Item2Schema],
    valorTotal: Number
});

module.exports = mongoose.model('Venda', VendaSchema);
