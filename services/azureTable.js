const { TableClient, AzureNamedKeyCredential } = require('@azure/data-tables');

const tableAccount = process.env.AZURE_STORAGE_ACCOUNT || process.env.AZURE_STORAGE_CONNECTION_STRING;
const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME || process.env.AZURE_ACCOUNT_NAME; 

function getTableClient(tableName) {
  return TableClient.fromConnectionString(connectionString, tableName);
}

async function ensureTable(tableName) {
  const client = getTableClient(tableName);
  try {
    await client.createTable();
  } catch (err) {
    if (!err.message.includes('TableAlreadyExists')) {
    }
  }
  return client;
}

module.exports = {
  getTableClient,
  ensureTable
};
