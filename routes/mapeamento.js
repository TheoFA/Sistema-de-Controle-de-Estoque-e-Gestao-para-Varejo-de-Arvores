const express = require('express');
const router = express.Router();
const Ponto = require('../models/ponto');
const Especie = require('../models/especie');

// Adicionar ponto
router.post('/adicionar', async (req, res) => {
    const { especieId, coordenadas } = req.body;

    const ponto = new Ponto({
        especie: especieId,
        coordenadas
    });

    try {
        await ponto.save();
        res.send('Ponto adicionado com sucesso');
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao adicionar ponto');
    }
});

// Listar pontos filtrados por espécie
router.get('/listar', async (req, res) => {
    const { especieId } = req.query;
    const filtro = especieId ? { especie: especieId } : {};
    try {
        const pontos = await Ponto.find(filtro).populate('especie');
        res.json(pontos);
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao listar pontos');
    }
});

// Renderizar página de mapeamento
router.get('/', async (req, res) => {
    try {
        const especies = await Especie.find();
        res.render('mapeamento', { especies });
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao carregar espécies');
    }
});

module.exports = router;
