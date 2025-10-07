const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getTableClient, ensureTable } = require('../services/azureTable');

const TABLE_NAME = process.env.AZURE_TABLE_NAME_CLIENTS || 'ViniciusONevesClientes';

ensureTable(TABLE_NAME).catch(e => console.error('Erro ao garantir tabela de clientes:', e));


router.get('/', async (req, res) => {
  try {
    const client = getTableClient(TABLE_NAME);
    const entities = [];
    for await (const e of client.listEntities()) {
      entities.push(e);
    }
    res.render('clients/list', { clients: entities });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Erro ao carregar clientes');
    res.redirect('/');
  }
});


router.get('/new', (req, res) => {
  res.render('clients/form', { client: {} });
});


router.post('/', async (req, res) => {
  try {
    const { name, email, phone, address } = req.body;
    const tableClient = getTableClient(TABLE_NAME);
    const entity = {
      partitionKey: 'Client',
      rowKey: uuidv4(),
      name,
      email,
      phone,
      address
    };
    await tableClient.createEntity(entity);
    req.flash('success_msg', 'Cliente cadastrado com sucesso');
    res.redirect('/clients');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Erro ao cadastrar cliente');
    res.redirect('/clients');
  }
});

router.get('/edit/:rowKey', async (req, res) => {
  try {
    const { rowKey } = req.params;
    const tableClient = getTableClient(TABLE_NAME);
    const entities = tableClient.listEntities({
      queryOptions: { filter: `RowKey eq '${rowKey}'` }
    });

    let found = null;
    for await (const e of entities) found = e;

    if (!found) {
      req.flash('error_msg', 'Cliente não encontrado');
      return res.redirect('/clients');
    }

    res.render('clients/form', { client: found });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Erro ao carregar cliente');
    res.redirect('/clients');
  }
});

router.put('/:rowKey', async (req, res) => {
  try {
    const { rowKey } = req.params;
    const { name, email, phone, address } = req.body;
    const tableClient = getTableClient(TABLE_NAME);

    const updatedEntity = {
      partitionKey: 'Client',
      rowKey,
      name,
      email,
      phone,
      address
    };

    await tableClient.updateEntity(updatedEntity, 'Replace');
    req.flash('success_msg', 'Cliente atualizado com sucesso');
    res.redirect('/clients');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Erro ao atualizar cliente');
    res.redirect('/clients');
  }
});

router.delete('/:rowKey', async (req, res) => {
  try {
    const { rowKey } = req.params;
    const tableClient = getTableClient(TABLE_NAME);
    await tableClient.deleteEntity('Client', rowKey);
    req.flash('success_msg', 'Cliente excluído com sucesso');
    res.redirect('/clients');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Erro ao excluir cliente');
    res.redirect('/clients');
  }
});

module.exports = router;
