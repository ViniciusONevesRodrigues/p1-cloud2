const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer();
const { uploadStreamToBlob } = require('../services/azureBlob');
const { getTableClient, ensureTable } = require('../services/azureTable');
const { v4: uuidv4 } = require('uuid');

const TABLE_NAME = process.env.AZURE_TABLE_NAME_VEHICLES || 'ViniciusONevesCarros';
const tableClient = getTableClient(TABLE_NAME);

ensureTable(TABLE_NAME).catch(e => console.error('Table ensure error', e));

router.get('/', async (req, res) => {
  try {
    const vehicles = [];
    for await (const e of tableClient.listEntities()) vehicles.push(e);
    res.render('vehicles/list', { vehicles });
  } catch (err) {
    console.error('Erro ao listar veículos:', err);
    res.status(500).send('Erro ao listar veículos');
  }
});

router.get('/new', (req, res) => res.render('vehicles/form', { vehicle: {} }));

router.post('/', upload.single('photo'), async (req, res) => {
  try {
    const { brand, model, year, plate, price, available } = req.body;
    let photoUrl = null;

    if (req.file) {
      photoUrl = await uploadStreamToBlob(req.file.buffer, req.file.originalname, req.file.mimetype);
    }

    const entity = {
      partitionKey: brand || 'unknown',
      rowKey: uuidv4(),
      brand,
      model,
      year: Number(year),
      plate,
      price: Number(price || 0),
      available: available === 'on',
      photoUrl
    };

    await tableClient.createEntity(entity);
    req.flash('success_msg', 'Veículo cadastrado com sucesso');
    res.redirect('/vehicles');
  } catch (err) {
    console.error('Erro ao cadastrar veículo:', err);
    req.flash('error_msg', 'Erro ao cadastrar veículo');
    res.redirect('/vehicles');
  }
});

router.get('/edit/:rowKey', async (req, res) => {
  try {
    const { rowKey } = req.params;
    const entities = tableClient.listEntities({ queryOptions: { filter: `RowKey eq '${rowKey}'` } });
    let found = null;
    for await (const e of entities) found = e;
    res.render('vehicles/form', { vehicle: found });
  } catch (err) {
    console.error('Erro ao buscar veículo:', err);
    res.status(500).send('Erro ao buscar veículo');
  }
});

router.put('/:rowKey', upload.single('photo'), async (req, res) => {
  try {
    const { rowKey } = req.params;
    const { brand, model, year, plate, price, available, partitionKey } = req.body;
    let photoUrl;

    if (req.file) {
      photoUrl = await uploadStreamToBlob(req.file.buffer, req.file.originalname, req.file.mimetype);
    }

    const updated = {
      partitionKey: partitionKey || (brand || 'unknown'),
      rowKey,
      brand,
      model,
      year: Number(year),
      plate,
      price: Number(price || 0),
      available: available === 'on'
    };

    if (photoUrl) updated.photoUrl = photoUrl;

    await tableClient.updateEntity(updated, 'Merge');
    req.flash('success_msg', 'Veículo atualizado');
    res.redirect('/vehicles');
  } catch (err) {
    console.error('Erro ao atualizar veículo:', err);
    req.flash('error_msg', 'Erro ao atualizar veículo');
    res.redirect('/vehicles');
  }
});


router.delete('/:rowKey', async (req, res) => {
  try {
    const { rowKey } = req.params;
    const entities = tableClient.listEntities({ queryOptions: { filter: `RowKey eq '${rowKey}'` } });
    let found = null;
    for await (const e of entities) found = e;

    if (found) {
      await tableClient.deleteEntity(found.partitionKey, found.rowKey);
      req.flash('success_msg', 'Veículo excluído');
    } else {
      req.flash('error_msg', 'Veículo não encontrado');
    }
    res.redirect('/vehicles');
  } catch (err) {
    console.error('Erro ao excluir veículo:', err);
    req.flash('error_msg', 'Erro ao excluir veículo');
    res.redirect('/vehicles');
  }
});

module.exports = router;
