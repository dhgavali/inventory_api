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
  ],
};

const roles = Object.keys(allRoles);
const roleRights = new Map(Object.entries(allRoles));

module.exports = {
  roles,
  roleRights,
};
