//mongoose user: theofamaral senha: theo1234
const express = require('express');
const mongoose = require('mongoose');
const Item = require('./models/item');
const Especie = require('./models/especie');
const Area = require('./models/area');
const Planta = require('./models/planta');
const Ponto = require('./models/ponto'); 
const Cliente = require('./models/cliente');
const Obra = require('./models/obra');
const Gasto = require('./models/gasto');
const Orcamento = require('./models/orcamento');
const Venda = require('./models/venda');
const pdf = require('html-pdf');
const ejs = require('ejs');


////////////////

/////

let path = require('path')

const app = express();

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: false }));
app.use(express.static('public'));
app.use(express.static(path.join(__dirname, 'public')));
mongoose.connect('mongodb+srv://theofamaral:theo1234@cluster0.iat2dkb.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Conectado ao MongoDB');
}).catch((err) => {
    console.error('Erro ao conectar ao MongoDB', err);
});


/////////
app.get('/', (req, res) => {
    res.render('home');
});

///////
app.get('/adicionar-arvores', async (req, res) => {
    try {
        const itens = await Item.find();
        const especies = await Especie.find(); // Supondo que você tenha um modelo chamado 'Especie'
        const areas = await Area.find();
        itens.reverse();
        res.render('adicionar-arvores', { itens, especies, areas });
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao buscar itens.');
    }
});


app.post('/adicionar', async (req, res) => {
    const item = new Item({
        especie: req.body.especie,
        quantidade: parseInt(req.body.quantidade),
        altura: req.body.altura,
        local: req.body.area,
        data: formatarData(req.body.data.toString()),
        valor: req.body.valor
    });

    try {
        await item.save();
        console.log(item);
        // Atualiza a coleção de Plantas
        await atualizarPlantas(item);
        res.redirect('/adicionar-arvores');
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao adicionar item.');
    }
});
function formatarData(dataOriginal) {
    const partes = dataOriginal.split("-"); // Divide a data em partes usando o hífen como separador
    const novaData = partes[2] + "/" + partes[1] + "/" + partes[0]; // Rearranja as partes da data
    return novaData;
}

app.post('/remover', async (req, res) => {
    try {
        await Item.findByIdAndDelete(req.body.id); 
        res.redirect('/');
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao remover item.');
    }
});

////////
app.get('/cadastrar-especie', async (req, res) => {
    try {
        const especies = await Especie.find();
        res.render('cadastrar-especie', { especies });
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao carregar página de cadastro de espécies.');
    }
});

app.post('/cadastrar-especie', async (req, res) => {
    const especieData = {
        nome: req.body.especie
           };

    try {
        const novaEspecie = new Especie(especieData);
        await novaEspecie.save();
        console.log('Nova espécie cadastrada:', novaEspecie);
        res.redirect('/cadastrar-especie');
    } catch (err) {
        console.error('Erro ao cadastrar nova espécie:', err);
        res.status(500).send('Erro ao cadastrar nova espécie.');
    }
});
///////
app.get('/cadastrar-area', async (req, res) => {
    try {
        const areas = await Area.find();
        res.render('cadastrar-area', { areas });
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao carregar página de cadastro de espécies.');
    }
});

app.post('/cadastrar-area', async (req, res) => {
    const areaData = {
        nome: req.body.area
          };

    try {
        const novaArea= new Area(areaData);
        await novaArea.save();
        console.log('Nova area cadastrada:', novaArea);
        res.redirect('/cadastrar-area');
    } catch (err) {
        console.error('Erro ao cadastrar nova area:', err);
        res.status(500).send('Erro ao cadastrar nova area.');
    }
});
/////////
app.get('/visualizar-itens', async (req, res) => {
    try {
        const itensPorLocal = await Item.aggregate([
            {
                $sort: { altura: -1 }
            },
            {
                $group: {
                    _id: "$local",
                    itens: { $push: "$$ROOT" }
                }
            }
        ]);

        const itensPorEspecie = await Item.aggregate([
            {
                $sort: { altura: -1 }
            },
            {
                $group: {
                    _id: "$especie",
                    itens: { $push: "$$ROOT" }
                }
            }
        ]);

        res.render('visualizar-itens', { itensPorLocal, itensPorEspecie });
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao carregar página de visualização de itens.');
    }
});
////////////////
// Função para atualizar a coleção de Plantas
async function atualizarPlantas(item) {
    const planta = await Planta.findOneAndUpdate(
        {
            especie: item.especie,
            altura: item.altura,
            local: item.local
        },
        {
            $inc: { quantidade: item.quantidade }
        },
        { upsert: true }
    );
    console.log('Planta atualizada:', planta);
}

// Rota para remover quantidades de plantas
app.post('/remover-quantidade', async (req, res) => {
    const { especie, quantidade, altura, local } = req.body;
    try {
        // Busca a planta correspondente no local específico
        const planta = await Planta.findOne({ especie, altura, local });

        if (!planta) {
            return res.status(404).send('Planta não encontrada no local especificado.');
        }

        // Calcula a quantidade a ser removida
        const novaQuantidade = planta.quantidade - quantidade;

        // Verifica se a nova quantidade é menor ou igual a zero
        if (novaQuantidade <= 0) {
            // Remove completamente as plantas do local específico
            await Planta.deleteMany({ especie, altura, local });
        } else {
            // Atualiza a quantidade de plantas no local específico
            await Planta.updateOne(
                { especie, altura, local },
                { $set: { quantidade: novaQuantidade } }
            );
        }

        // Redireciona para a página de visualização de plantas
        res.redirect('/visualizar-plantas-por-especie');
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao remover quantidade de planta.');
    }
});



////////////
// Rota para visualizar plantas por espécie
app.get('/visualizar-plantas-por-especie', async (req, res) => {
    try {
        const plantasPorEspecie = await Planta.aggregate([
            { $group: { _id: '$especie', plantas: { $push: '$$ROOT' } } }
        ]);
          // Ordena as espécies em ordem alfabética
          plantasPorEspecie.sort((a, b) => a._id.localeCompare(b._id));
        res.render('visualizar-plantas-por-especie', { plantasPorEspecie })
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao carregar plantas por espécie.');
    }
});

// Rota para visualizar plantas por área
app.get('/visualizar-plantas-por-area', async (req, res) => {
    try {
        const plantasPorArea = await Planta.aggregate([
            { $group: { _id: '$local', plantas: { $push: '$$ROOT' } } }
        ]);
        plantasPorArea.sort((a, b) => a._id.localeCompare(b._id));
        res.render('visualizar-plantas-por-area', { plantasPorArea });
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao carregar plantas por área.');
    }
});


/////////////////MAPEAMENTO
const bodyParser = require('body-parser');



// Middleware para análise de corpo da requisição
app.use(bodyParser.json());

const mapeamentoRoutes = require('./routes/mapeamento');
app.use('/mapeamento', mapeamentoRoutes);


////////////////////
/////CADASTRO DE CLIENTES

// Rota para renderizar a página de cadastro de clientes
// Rota para a página inicial (página de clientes)
app.get('/clientes', async (req, res) => {
    try {
        const clientes = await Cliente.find();
        res.render('clientes', { clientes });
    } catch (err) {
        console.error('Erro ao carregar página de clientes:', err);
        res.status(500).send('Erro ao carregar página de clientes.');
    }
});

// Rota para cadastrar um novo cliente
app.post('/cadastrar-cliente', async (req, res) => {
    const { nome, cidade, tipoObra, indicacao, contato } = req.body;
    const novoCliente = new Cliente({ nome, cidade, tipoObra, indicacao, contato });
    
    try {
        await novoCliente.save();
        console.log('Novo cliente cadastrado:', novoCliente);
        res.redirect('/clientes'); // Redireciona de volta para a página de clientes após o cadastro
    } catch (err) {
        console.error('Erro ao cadastrar novo cliente:', err);
        res.status(500).send('Erro ao cadastrar novo cliente.');
    }
});

// Rota para visualizar detalhes de um cliente específico
app.get('/clientes/:id', async (req, res) => {
    const clienteId = req.params.id;
    try {
        const cliente = await Cliente.findById(clienteId);
        if (!cliente) {
            return res.status(404).send('Cliente não encontrado.');
        }
        console.log(cliente);
        res.render('detalhes-cliente', { cliente });
    } catch (err) {
        console.error('Erro ao carregar detalhes do cliente:', err);
        res.status(500).send('Erro ao carregar detalhes do cliente.');
    }
});


const multer = require('multer');

// Configuração do multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, 'uploads')); // Diretório onde os arquivos serão salvos
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`); // Nome único para o arquivo
    }
});

const upload = multer({ storage });

// Rota para lidar com upload de múltiplos documentos
app.post('/clientes/:id/upload-orcamentos', upload.array('orcamentos'), async (req, res) => {

    const clienteId = req.params.id;
    try {
        const cliente = await Cliente.findById(clienteId);
        if (!cliente) {
            return res.status(404).send('Cliente não encontrado.');
        }

        if (!req.files || req.files.length === 0) {
            return res.status(400).send('Nenhum arquivo enviado.');
        }

        req.files.forEach(file => {
            cliente.orcamento.push(file.filename);
        });

        await cliente.save();

        res.redirect(`/clientes/${clienteId}`);
    } catch (error) {
        console.error('Erro ao fazer upload dos documentos:', error);
        res.status(500).send('Erro ao fazer upload dos documentos.');
    }
});

// Rota para visualizar ou baixar um arquivo de orçamento
app.get('/uploads/:filename', (req, res) => {
    const filePath = path.join(__dirname, 'uploads', req.params.filename);
    res.setHeader('Content-Disposition', 'inline');
    res.setHeader('Content-Type', 'application/pdf');
    res.download(filePath, 'documento.pdf', err => {
        if (err) {
            console.error('Erro ao baixar o arquivo:', err);
            res.status(500).send('Erro ao baixar o arquivo.');
        }
    });
});


///////////////////////////////////////////////
///OBRAS

// Rota para página de obras
app.get('/obras', async (req, res) => {
    try {
        const obrasAbertas = await Obra.find({ status: 'aberta' }).populate('cliente');
        const obrasFechadas = await Obra.find({ status: 'fechada' }).populate('cliente');
        const clientes = await Cliente.find();
        res.render('obras', { obrasAbertas, obrasFechadas, clientes });
    } catch (err) {
        console.error('Erro ao carregar página de obras:', err);
        res.status(500).send('Erro ao carregar página de obras.');
    }
});

// Rota para criar uma nova obra
app.post('/nova-obra', async (req, res) => {
    const { nome, cliente } = req.body;
    const novaObra = new Obra({ nome, cliente });
    try {
        await novaObra.save();
        console.log('Nova obra aberta:', novaObra);
        res.redirect('/obras');
    } catch (err) {
        console.error('Erro ao abrir nova obra:', err);
        res.status(500).send('Erro ao abrir nova obra.');
    }
});

// Rota para fechar uma obra
app.post('/fechar-obra/:id', async (req, res) => {
    const obraId = req.params.id;
    try {
        const obra = await Obra.findById(obraId);
        if (!obra) {
            return res.status(404).send('Obra não encontrada.');
        }
        obra.status = 'fechada';
        await obra.save();
        console.log('Obra fechada:', obra);
        res.redirect('/obras');
    } catch (err) {
        console.error('Erro ao fechar obra:', err);
        res.status(500).send('Erro ao fechar obra.');
    }
});

// Rota para reabrir uma obra
app.post('/reabrir-obra/:id', async (req, res) => {
    const obraId = req.params.id;
    try {
        const obra = await Obra.findById(obraId);
        if (!obra) {
            return res.status(404).send('Obra não encontrada.');
        }
        obra.status = 'aberta';
        await obra.save();
        console.log('Obra reaberta:', obra);
        res.redirect('/obras');
    } catch (err) {
        console.error('Erro ao reabrir obra:', err);
        res.status(500).send('Erro ao reabrir obra.');
    }
});

// rota para exibir os detalhes da obra
app.get('/obras/:id', async (req, res) => {
    const obraId = req.params.id;
    try {
        const obra = await Obra.findById(obraId).populate('cliente');
        if (!obra) {
            return res.status(404).send('Obra não encontrada.');
        }
        const gastos = await Gasto.find({ obra: obraId });
        res.render('detalhes-obra', { obra, gastos });
    } catch (err) {
        console.error('Erro ao carregar detalhes da obra:', err);
        res.status(500).send('Erro ao carregar detalhes da obra.');
    }
});


////////////////////////////////////////////////


// Rota para a página de registro de gastos
app.get('/registro-gastos', async (req, res) => {
    try {
        const especies = await Especie.find().exec(); 
        const obras = await Obra.find({ status: 'aberta' });
        console.log('salve',obras);
        res.render('registro-gastos', { obras ,especies});
    } catch (err) {
        console.error('Err  o ao carregar página de registro de gastos:', err);
        res.status(500).send('Erro ao carregar página de registro de gastos.');
    }
});

// Rota para registrar novo gasto
app.post('/registrar-gasto', async (req, res) => {
    const { tipoGasto, categoria, produto, obra, quantidade, valor, data } = req.body;
    const novoGasto = new Gasto({
        tipoGasto,
        categoria,
        produto,
        quantidade,
        valor,
        data
    });
    if (tipoGasto === 'obra-cliente') {
        novoGasto.obra = obra;
    }

    try {
        await novoGasto.save();
        console.log('Novo gasto registrado:', novoGasto);
        res.redirect('/registro-gastos');
    } catch (err) {
        console.error('Erro ao registrar novo gasto:', err);
        res.status(500).send('Erro ao registrar novo gasto.');
    }
});


//Rota para visualizar os gastos
app.get('/visualizar-gastos', async (req, res) => {
    try {
        const { tipoGasto, categoria, produto } = req.query;
        let query = {};

        if (tipoGasto) {
            query.tipoGasto = tipoGasto;
        }
        if (categoria) {
            query.categoria = categoria;
        }
        if (produto) {
            query.produto = { $regex: new RegExp(produto, 'i') };
        }

        const gastos = await Gasto.find(query).sort({ data: -1 }).populate('obra');
        const tiposGasto = await Gasto.distinct('tipoGasto');
        const categorias = await Gasto.distinct('categoria');

        res.render('visualizar-gastos', { gastos, tiposGasto, categorias });
    } catch (err) {
        console.error('Erro ao carregar página de visualização de gastos:', err);
        res.status(500).send('Erro ao carregar página de visualização de gastos.');
    }
});
//////////////////////////////////////////////////////////////
// GRAFICOS E ESTATISTICAS


// Rota para a página de estatísticas
app.get('/estatisticas', async (req, res) => {
    try {
        const clientes = await Cliente.aggregate([
            { $group: { _id: '$indicacao', count: { $sum: 1 } } }
        ]);

        const clientesPorCidade = await Cliente.aggregate([
            { $group: { _id: '$cidade', count: { $sum: 1 } } }
        ]);

        const clientesPorTipoObra = await Cliente.aggregate([
            { $group: { _id: '$tipoObra', count: { $sum: 1 } } }
        ]);

        const gastosPorTipo = await Gasto.aggregate([
            { $group: { _id: '$tipoGasto', total: { $sum: '$valor' } } }
        ]);

        const gastosPorCategoria = await Gasto.aggregate([
            { $group: { _id: '$categoria', total: { $sum: '$valor' } } }
        ]);

        const gastosPorProduto = await Gasto.aggregate([
            { $group: { _id: '$produto', total: { $sum: '$valor' } } }
        ]);

        const gastosPorData = await Gasto.aggregate([
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$data" } },
                    total: { $sum: '$valor' }
                }
            }
        ]);

        const totalArvores = await Planta.aggregate([
            { $group: { _id: null, total: { $sum: '$quantidade' } } }
        ]);

        const arvoresPorEspecie = await Planta.aggregate([
            { $group: { _id: '$especie', total: { $sum: '$quantidade' } } }
        ]);

        const arvoresPorArea = await Planta.aggregate([
            { $group: { _id: '$local', total: { $sum: '$quantidade' } } }
        ]);

        res.render('estatisticas', {
            clientes,
            clientesPorCidade,
            clientesPorTipoObra,
            gastosPorTipo,
            gastosPorCategoria,
            gastosPorProduto,
            gastosPorData,
            totalArvores: totalArvores[0] ? totalArvores[0].total : 0,
            arvoresPorEspecie,
            arvoresPorArea
        });
    } catch (err) {
        console.error('Erro ao carregar estatísticas:', err);
        res.status(500).send('Erro ao carregar estatísticas.');
    }
});


// 
app.get('/estatisticas-plantas', async (req, res) => {
    try {
        const plantas = await Planta.find().exec();
        const totalArvores = plantas.reduce((sum, planta) => sum + planta.quantidade, 0);

        const arvoresPorEspecie = plantas.reduce((acc, planta) => {
            acc[planta.especie] = (acc[planta.especie] || 0) + planta.quantidade;
            return acc;
        }, {});

        const arvoresPorArea = plantas.reduce((acc, planta) => {
            acc[planta.local] = (acc[planta.local] || 0) + planta.quantidade;
            return acc;
        }, {});

        res.render('estatisticas-plantas', {
            totalArvores,
            arvoresPorEspecie,
            arvoresPorArea
        });
    } catch (error) {
        console.error('Erro ao carregar as estatísticas das plantas:', error);
        res.status(500).send('Erro ao carregar as estatísticas das plantas');
    }
});
















////////////////////////////////////////Planejamento

const Planejamento = require('./models/planejamento');

// Rota para a página de planejamento de serviço
app.get('/planejamento', async (req, res) => {
    try {
        const planejamentos = await Planejamento.find();
        res.render('planejamento', { planejamentos });
    } catch (err) {
        console.error('Erro ao carregar planejamento:', err);
        res.status(500).send('Erro ao carregar planejamento.');
    }
});

// Rota para criar um novo planejamento de serviço
app.post('/planejamento', async (req, res) => {
    const { titulo, data, funcionarios, descricao } = req.body;
    const novoPlanejamento = new Planejamento({
        titulo,
        data,
        funcionarios: funcionarios.split(','), // Convertendo string em array
        descricao
    });

    try {
        await novoPlanejamento.save();
        console.log('Novo planejamento criado:', novoPlanejamento);
        res.redirect('/planejamento');
    } catch (err) {
        console.error('Erro ao criar novo planejamento:', err);
        res.status(500).send('Erro ao criar novo planejamento.');
    }
});
//ver cada compromisso
app.get('/planejamento/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const planejamento = await Planejamento.findById(id);
        if (!planejamento) {
            return res.status(404).send('Planejamento não encontrado');
        }
        res.render('detalhes-planejamento', { planejamento });
    } catch (err) {
        console.error('Erro ao buscar detalhes do planejamento:', err);
        res.status(500).send('Erro ao buscar detalhes do planejamento');
    }
});

// Rota para excluir um planejamento
app.post('/planejamento/:id/delete', async (req, res) => {
    const { id } = req.params;
    try {
        await Planejamento.findByIdAndDelete(id);
        res.redirect('/planejamento');
    } catch (err) {
        console.error('Erro ao excluir o planejamento:', err);
        res.status(500).send('Erro ao excluir o planejamento');
    }
});


///////////////////////////////////////////////////////
///Orçamentos


// Página para criar um novo orçamento
app.get('/:id/orcamentos/novo', async (req, res) => {
    const obra = await Obra.findById(req.params.id).exec();
    const especies = await Especie.find().exec(); 
    res.render('novo-orcamento', { obra, especies });
});


app.post('/:id/orcamentos', async (req, res) => {
    try {
        // Encontrar a obra pelo ID
        const obra = await Obra.findById(req.params.id).exec();

        if (!obra) {
            return res.status(404).send('Obra não encontrada');
        }

        // Extrair os dados do corpo da requisição
        const { valorTotal, itens } = req.body;

        // Verificar e processar valorTotal
        const valorTotalNum = parseFloat(valorTotal);
        if (isNaN(valorTotalNum)) {
            return res.status(400).send('Valor total inválido');
        }

        // Processar itens JSON
        let itensArray = [];
        try {
            itensArray = JSON.parse(itens);
        } catch (error) {
            return res.status(400).send('Itens inválidos');
        }

        // Garantir que cada item tenha as propriedades corretas
        const itensValidos = itensArray.map(item => ({
            categoria: item.categoria,
            descricao: item.descricao,
            quantidade: parseFloat(item.quantidade),
            altura: parseFloat(item.altura),
            valor: parseFloat(item.valor)
        }));

        // Criar uma nova instância de Orcamento
        const orcamento = new Orcamento({
            cliente: obra._id,
            itens: itensValidos,
            valorTotal: valorTotalNum,
            status: 'Aguardando'
        });

        // Salvar o orçamento no banco de dados
        await orcamento.save();

        // Redirecionar para a página da obra
        res.redirect(`/obras/${obra._id}`);
    } catch (error) {
        // Tratar erros e enviar uma resposta adequada
        console.error('Erro ao salvar o orçamento:', error);
        res.status(500).send('Erro ao salvar o orçamento');
    }
});





// Página para listar os orçamentos da obra
app.get('/:id/orcamentos', async (req, res) => {
    const obra = await Obra.findById(req.params.id).exec();
    const orcamentos = await Orcamento.find({ cliente: obra._id }).exec();
    res.render('listar-orcamentos', { obra, orcamentos });
});


// abrir os detalhes do orçamento
app.get('/orcamentos/:id', async (req, res) => {
    try {
        const especies = await Especie.find().exec(); 
        const orcamento = await Orcamento.findById(req.params.id).exec();
        if (!orcamento) {
            return res.status(404).send('Orçamento não encontrado');
        }

        const obra = await Obra.findById(orcamento.cliente).exec();
    
        res.render('detalhes-orcamento', { orcamento, obra, especies });
    } catch (error) {
        console.error('Erro ao carregar orçamento:', error);
        res.status(500).send('Erro ao carregar orçamento');
    }
});

app.post('/orcamentos/:id', async (req, res) => {
    try {
        const orcamento = await Orcamento.findById(req.params.id).exec();
        if (!orcamento) {
            return res.status(404).send('Orçamento não encontrado');
        }

        // Atualizar o orçamento com os novos dados
        const { valorTotal, itens } = req.body;
        orcamento.valorTotal = parseFloat(valorTotal);
        orcamento.itens = JSON.parse(itens);

        await orcamento.save();

        res.redirect(`/orcamentos/${orcamento._id}`);
    } catch (error) {
        console.error('Erro ao atualizar orçamento:', error);
        res.status(500).send('Erro ao atualizar orçamento');
    }
});

//Aprovar orçamento e colocar em vendas
app.post('/orcamentos/:id/aprovar', async (req, res) => {
    try {
        // Encontrar o orçamento pelo ID
        const orcamento = await Orcamento.findById(req.params.id).exec();
        if (!orcamento) {
            return res.status(404).send('Orçamento não encontrado');
        }

        // Atualizar o status para "Aprovado"
        orcamento.status = 'Aprovado';
        await orcamento.save();

        // Criar uma cópia do orçamento para a coleção de vendas
        const venda = new Venda({
            cliente: orcamento.cliente,
            itens: orcamento.itens,
            valorTotal: orcamento.valorTotal,
            data: new Date()
        });

        await venda.save();

        // Redirecionar para a página de detalhes do orçamento
        res.redirect(`/orcamentos/${orcamento._id}`);
    } catch (error) {
        console.error('Erro ao aprovar orçamento:', error);
        res.status(500).send('Erro ao aprovar orçamento');
    }
});


/////////////transformar orçamento em pdf

app.get('/orcamentos/:id/pdf', async (req, res) => {
    try {
        const orcamento = await Orcamento.findById(req.params.id).populate('cliente').lean();
        if (!orcamento) {
            return res.status(404).send('Orçamento não encontrado');
        }

        const filePath = path.join(__dirname, 'views', 'orcamento-pdf.ejs');
        
        ejs.renderFile(filePath, { orcamento }, (err, html) => {
            if (err) {
                console.error('Erro ao renderizar EJS:', err);
                return res.status(500).send('Erro ao gerar PDF');
            }

            pdf.create(html).toStream((err, stream) => {
                if (err) {
                    console.error('Erro ao criar PDF:', err);
                    return res.status(500).send('Erro ao criar PDF');
                }

                res.setHeader('Content-Type', 'application/pdf');
                stream.pipe(res);
            });
        });
    } catch (err) {
        console.error('Erro ao buscar orçamento:', err);
        res.status(500).send('Erro ao buscar orçamento');
    }
});






////////////////////
//Vendas 
app.get('/visualizar-vendas', async (req, res) => {
    try {
        const vendas = await Venda.find().populate('cliente').exec();
        res.render('visualizar-vendas', { vendas });
    } catch (error) {
        console.error('Erro ao carregar as vendas:', error);
        res.status(500).send('Erro ao carregar as vendas');
    }
});

//detalhes da venda
app.get('/vendas/:id', async (req, res) => {
    try {
        const venda = await Venda.findById(req.params.id).populate('cliente').exec();
        res.render('detalhes-venda', { venda });
    } catch (error) {
        console.error('Erro ao carregar a venda:', error);
        res.status(500).send('Erro ao carregar a venda');
    }
});

//////////////////////////////
app.get('/estatisticas-lucro', (req, res) => {
    res.render('estatisticas-lucro');
});

////////////////////////////////////////////////////////////////////////
//Lucro por obra

app.get('/lucros-por-obra', async (req, res) => {
    try {
        const obras = await Obra.find(); // Obtém todas as obras
        const obrasSaldo = await Promise.all(obras.map(async (obra) => {
            // Calcula as vendas e os gastos para cada obra
            const vendas = await Venda.find({ cliente: obra._id });
            const gastos = await Gasto.find({ obra: obra._id });

            const totalVendas = vendas.reduce((acc, venda) => acc + venda.valorTotal, 0);
            const totalGastos = gastos.reduce((acc, gasto) => acc + gasto.valor, 0);

            // Calcula o saldo (vendas - gastos)
            const saldo = totalVendas - totalGastos;

            return {
                obra,
                totalVendas,
                totalGastos,
                saldo
            };
        }));

        res.render('lucros-por-obra', { obrasSaldo });
    } catch (error) {
        console.error(error);
        res.status(500).send('Erro ao calcular lucros por obra.');
    }
});

/////////////////
// Valor de venda media por produto

// Rota para obter o preço médio de venda, preço médio de compra e lucro médio por produto

app.get('/preco-medio', async (req, res) => {
    try {
        const vendas = await Venda.find().populate('cliente');
        const gastos = await Gasto.find({ categoria: 'compra-de-planta' });

        const produtoMap = {};

        vendas.forEach(venda => {
            venda.itens.forEach(item => {
                if (item.altura > 0) { // Filtrar apenas itens com altura > 0
                    const nomeProdutoVenda = item.descricao.trim().toLowerCase(); // Normalizar nome

                    if (!produtoMap[nomeProdutoVenda]) {
                        produtoMap[nomeProdutoVenda] = { totalValor: 0, totalQuantidade: 0, totalCompraValor: 0, totalCompraQuantidade: 0 };
                    }

                    // Acumular o valor e a quantidade da venda
                    produtoMap[nomeProdutoVenda].totalValor += item.valor;
                    produtoMap[nomeProdutoVenda].totalQuantidade += item.quantidade;
                }
            });
        });

        gastos.forEach(gasto => {
            const nomeProdutoGasto = gasto.produto.trim().toLowerCase(); // Normalizar nome

            const quantidadeGasto = gasto.quantidade || 1; // Usar 1 como fallback para quantidade indefinida

            if (produtoMap[nomeProdutoGasto]) {
                // Acumular o valor e a quantidade do gasto
                produtoMap[nomeProdutoGasto].totalCompraValor += gasto.valor;
                produtoMap[nomeProdutoGasto].totalCompraQuantidade += quantidadeGasto;
            }
        });

        // Calcular preço médio de venda, compra e lucro médio, além dos preços totais
        const precoMedio = Object.entries(produtoMap).map(([descricao, { totalValor, totalQuantidade, totalCompraValor, totalCompraQuantidade }]) => {
            const precoMedioVenda = totalValor / totalQuantidade;
            const precoMedioCompra = totalCompraQuantidade > 0 ? totalCompraValor / totalCompraQuantidade : 0;
            const lucroMedio = precoMedioVenda - precoMedioCompra;
            return {
                descricao,
                precoMedioVenda,
                precoMedioCompra,
                lucroMedio,
                totalValorVenda: totalValor, // Preço total de venda
                totalValorCompra: totalCompraValor // Gasto total
            };
        });

        res.render('preco-medio', { precoMedio });
    } catch (error) {
        console.error(error);
        res.status(500).send('Erro ao buscar preços médios');
    }
});

////////////////////////////
//calendario de saldo diario e mensal

app.get('/lucros-por-dia', async (req, res) => {
    try {
        const vendas = await Venda.find();
        const gastos = await Gasto.find();

        const mapaDiario = {};
        const mapaMensal = {};

        // Função auxiliar para formatar datas
        const formatDate = (date) => {
            const d = new Date(date);
            const year = d.getFullYear();
            const month = ('0' + (d.getMonth() + 1)).slice(-2); // Mês de 1 a 12
            const day = ('0' + d.getDate()).slice(-2); // Dia com zero à esquerda
            return { year, month, day, fullDate: `${year}-${month}-${day}`, yearMonth: `${year}-${month}` };
        };

        // Processar vendas
        vendas.forEach(venda => {
            const { year, month, day, fullDate, yearMonth } = formatDate(venda.data);
            
            // Acumular vendas diárias
            if (!mapaDiario[fullDate]) {
                mapaDiario[fullDate] = { totalVendas: 0, totalGastos: 0 };
            }
            mapaDiario[fullDate].totalVendas += venda.itens.reduce((total, item) => total + item.valor, 0);

            // Acumular vendas mensais
            if (!mapaMensal[yearMonth]) {
                mapaMensal[yearMonth] = { totalVendas: 0, totalGastos: 0 };
            }
            mapaMensal[yearMonth].totalVendas += venda.itens.reduce((total, item) => total + item.valor, 0);
        });

        // Processar gastos
        gastos.forEach(gasto => {
            const { year, month, day, fullDate, yearMonth } = formatDate(gasto.data);
            
            // Acumular gastos diários
            if (!mapaDiario[fullDate]) {
                mapaDiario[fullDate] = { totalVendas: 0, totalGastos: 0 };
            }
            mapaDiario[fullDate].totalGastos += gasto.valor;

            // Acumular gastos mensais
            if (!mapaMensal[yearMonth]) {
                mapaMensal[yearMonth] = { totalVendas: 0, totalGastos: 0 };
            }
            mapaMensal[yearMonth].totalGastos += gasto.valor;
        });

        // Calcular saldo diário e mensal
        const dias = Object.entries(mapaDiario).map(([data, valores]) => ({
            data,
            totalVendas: valores.totalVendas,
            totalGastos: valores.totalGastos,
            saldo: valores.totalVendas - valores.totalGastos
        }));

        const meses = Object.entries(mapaMensal).map(([mes, valores]) => ({
            mes,
            totalVendas: valores.totalVendas,
            totalGastos: valores.totalGastos,
            saldo: valores.totalVendas - valores.totalGastos
        }));

        res.render('lucros-por-dia', { dias, meses });
    } catch (error) {
        console.error(error);
        res.status(500).send('Erro ao buscar lucros por dia.');
    }
});




///////////////////
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
