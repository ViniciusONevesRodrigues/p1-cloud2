const express = require('express');
const { TableClient, AzureSASCredential } = require('@azure/data-tables');
const { getTableClient } = require('../services/azureTable'); 
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

const accountUrl = 'https://stop1cn2.table.core.windows.net';
const sasToken = process.env.AZURE_TABLE_SAS_URL.split('?')[1]; 
const TABLE_NAME = process.env.AZURE_TABLE_NAME_RENTALS;
const VEHICLES_TABLE = process.env.AZURE_TABLE_NAME_VEHICLES;
const CLIENTS_TABLE = process.env.AZURE_TABLE_NAME_CLIENTS;


const tableClient = new TableClient(accountUrl, TABLE_NAME, new AzureSASCredential(sasToken));


(async () => {
  try {
    await tableClient.createTable();
  } catch (err) {
    if (err.statusCode !== 409) {
      console.error('Erro ao criar tabela rentals:', err.message);
    }
  }
})();


router.get('/', async (req, res) => {
  try {
    const rentals = [];
    for await (const entity of tableClient.listEntities()) {
      rentals.push(entity);
    }
    res.render('rentals/list', { rentals });
  } catch (err) {
    console.error('Erro ao listar locações:', err);
    res.status(500).send('Erro ao listar locações');
  }
});


router.get('/new', async (req, res) => {
  try {

    const clientsClient = getTableClient(CLIENTS_TABLE);
    const clients = [];
    for await (const c of clientsClient.listEntities()) {
      clients.push(c);
    }


    const vehiclesClient = getTableClient(VEHICLES_TABLE);
    const vehicles = [];
    for await (const v of vehiclesClient.listEntities()) {
      if (v.available === true || v.available === 'true') vehicles.push(v);
    }

    res.render('rentals/new', { clients, vehicles });
  } catch (err) {
    console.error('Erro ao carregar formulário de locação:', err);
    req.flash('error_msg', 'Erro ao carregar formulário');
    res.redirect('/rentals');
  }
});

router.post('/new', async (req, res) => {
  try {
    const { vehicleId, clientId, startDate, endDate, price } = req.body;

    const partitionKey = 'rental';
    const rowKey = uuidv4(); 

    await tableClient.createEntity({
      partitionKey,
      rowKey,
      vehicleId,
      clientId,
      startDate,
      endDate,
      price: Number(price)
    });

    req.flash('success_msg', 'Locação criada com sucesso');
    res.redirect('/rentals');
  } catch (err) {
    console.error('Erro ao criar locação:', err);
    req.flash('error_msg', 'Erro ao criar locação');
    res.redirect('/rentals');
  }
});

router.get('/edit/:rowKey', async (req, res) => {
  try {
    const rowKey = req.params.rowKey;
    const entity = await tableClient.getEntity('rental', rowKey);

    const clientsClient = getTableClient(CLIENTS_TABLE);
    const clients = [];
    for await (const c of clientsClient.listEntities()) clients.push(c);

    const vehiclesClient = getTableClient(VEHICLES_TABLE);
    const vehicles = [];
    for await (const v of vehiclesClient.listEntities()) {
      if (v.available === true || v.available === 'true') vehicles.push(v);
    }

    res.render('rentals/edit', { rental: entity, clients, vehicles });
  } catch (err) {
    console.error('Erro ao buscar locação para edição:', err);
    res.status(500).send('Erro ao buscar locação');
  }
});


router.post('/edit/:rowKey', async (req, res) => {
  try {
    const rowKey = req.params.rowKey;
    const { vehicleId, clientId, startDate, endDate, price } = req.body;

    await tableClient.updateEntity({
      partitionKey: 'rental',
      rowKey,
      vehicleId,
      clientId,
      startDate,
      endDate,
      price: Number(price)
    }, "Replace");

    req.flash('success_msg', 'Locação atualizada com sucesso');
    res.redirect('/rentals');
  } catch (err) {
    console.error('Erro ao atualizar locação:', err);
    req.flash('error_msg', 'Erro ao atualizar locação');
    res.redirect('/rentals');
  }
});

router.post('/delete/:rowKey', async (req, res) => {
  try {
    const rowKey = req.params.rowKey;
    await tableClient.deleteEntity('rental', rowKey);
    req.flash('success_msg', 'Locação excluída');
    res.redirect('/rentals');
  } catch (err) {
    console.error('Erro ao excluir locação:', err);
    req.flash('error_msg', 'Erro ao excluir locação');
    res.redirect('/rentals');
  }
});

module.exports = router;
