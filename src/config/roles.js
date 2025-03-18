const allRoles = {
  OPERATOR: ['getProducts', 'getSuppliers', 'getStock'],
  SHIFT_INCHARGE: ['getProducts', 'getSuppliers', 'getStock', 'createInward', 'createOutward', 'manageOwnInwards'],
  SUPERVISOR: [
    'getProducts',
    'getSuppliers',
    'getStock',
    'createInward',
    'createOutward',
    'approveInwards',
    'manageSupervisorInwards',
  ],
  MANAGER: [
    'getProducts',
    'getSuppliers',
    'manageSuppliers',
    'getStock',
    'createInward',
    'createOutward',
    'manageProducts',
    'getReports',
    'getCategories',
    'manageCategories',
  ],
  ADMIN: [
    'getUsers',
    'manageUsers',
    'getPlants',
    'managePlants',
    'getProducts',
    'manageProducts',
    'getSuppliers',
    'manageSuppliers',
    'getStock',
    'createInward',
    'createOutward',
    'approveInwards',
    'getReports',
    'getCategories',
    'manageCategories',
  ],
};

const roles = Object.keys(allRoles);
const roleRights = new Map(Object.entries(allRoles));

module.exports = {
  roles,
  roleRights,
};
