const repo = require("./product.repo");

async function createProduct({ shopId, name, price, stock }) {
  return await repo.create({ shopId, name, price, stock });
}

async function listProducts({ shopId, limit, offset, q }) {
  return await repo.list({ shopId, limit, offset, q });
}

async function getProductById({ shopId, id }) {
  return await repo.findById({ shopId, id });
}

async function updateProduct({ shopId, id, patch }) {
  return await repo.updateById({ shopId, id, patch });
}

async function deleteProduct({ shopId, id }) {
  return await repo.deleteById({ shopId, id });
}

module.exports = {
  createProduct,
  listProducts,
  getProductById,
  updateProduct,
  deleteProduct,
};

