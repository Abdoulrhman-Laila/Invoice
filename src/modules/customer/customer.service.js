const repo = require("./customer.repo");

async function createCustomer({ shopId, name, phone, email, address }) {
  return await repo.create({ shopId, name, phone, email, address });
}

async function listCustomers({ shopId, limit, offset, q }) {
  return await repo.list({ shopId, limit, offset, q });
}

async function getCustomerById({ shopId, id }) {
  return await repo.findById({ shopId, id });
}

async function updateCustomer({ shopId, id, patch }) {
  return await repo.updateById({ shopId, id, patch });
}

async function deleteCustomer({ shopId, id }) {
  return await repo.deleteById({ shopId, id });
}

module.exports = {
  createCustomer,
  listCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
};

