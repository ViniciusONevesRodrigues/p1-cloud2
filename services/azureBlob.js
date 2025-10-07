const { BlobServiceClient } = require('@azure/storage-blob');

const blobSasUrl = 'https://stop1cn2.blob.core.windows.net/?sv=2024-11-04&ss=bft&srt=sco&sp=rwdlacuiytfx&se=2025-11-07T05:54:06Z&st=2025-10-06T21:39:06Z&spr=https,http&sig=lCWLP6OPnUByrISGDMxyDk%2FZdE1WdyFkXd0XO9KG5PA%3D';
const containerName = 'viniciusoliveiradasnevesrodriguesveiculos';
const folderPrefix = 'vehicles'; 

const blobServiceClient = new BlobServiceClient(blobSasUrl);
const containerClient = blobServiceClient.getContainerClient(containerName);

async function uploadStreamToBlob(buffer, originalName, mimetype) {
  const blobName = `${folderPrefix}/${Date.now()}-${originalName}`;
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  await blockBlobClient.uploadData(buffer, { blobHTTPHeaders: { blobContentType: mimetype } });
  return blockBlobClient.url; 
}

module.exports = { uploadStreamToBlob };
