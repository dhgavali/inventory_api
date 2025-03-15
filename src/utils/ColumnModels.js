const getUserColumns = (userRole) => {
  // Base columns for all users
  const baseColumns = [
    { field: 'employeeCode', headerName: 'Employee Code', width: 150 },
    { field: 'plantName', headerName: 'Plant', width: 150 },
    { field: 'name', headerName: 'Name', width: 150 },
    { field: 'mobileNumber', headerName: 'Mobile Number', width: 150 },
    { field: 'plainPassword', headerName: 'Password', width: 150 },
    { field: 'role', headerName: 'Role', width: 150 },
    { field: 'dateRegistered', headerName: 'Date Registered', width: 150 },
    { field: 'createdAt', headerName: 'Created At', width: 150 },

  ];
  
  // Add admin-specific columns
  if (userRole === 'ADMIN') {
    baseColumns.push({ field: 'handleProcess', headerName: 'Actions', width: 150 });
  }
  
  return baseColumns;
};

const getProductColumns = (userRole) => {
  // Base columns for all users
  const baseColumns = [
    { field: 'id', headerName: 'ID', width: 100 },
    { field: 'designName', headerName: 'Design Name', width: 150 },
    { field: 'designCode', headerName: 'Design Code', width: 150 },
    { field: 'colour', headerName: 'Colour', width: 150 },
    { field: 'itemCode', headerName: 'Item Code', width: 150 },
    { field: 'unitType', headerName: 'Unit Type', width: 150 },
    { field: 'buyPrice', headerName: 'Buy Price', width: 150 },
    { field: 'sellPrice', headerName: 'Sell Price', width: 150 },
    { field: 'minStockAlert', headerName: 'Min Stock Alert', width: 150 },
    { field: 'openingStock', headerName: 'Opening Stock', width: 150 },
    { field: 'createdAt', headerName: 'Created At', width: 150 },
    { field: 'updatedAt', headerName: 'Updated At', width: 150 },
  ];
  
  // Add admin-specific columns
  if (userRole === 'ADMIN') {
    baseColumns.push({ field: 'handleProcess', headerName: 'Actions', width: 150 });
  }
  
  return baseColumns;
};

// plant data
// {
//   "id": "eb585c99-f741-4659-b002-5d3fa65ad68f",
//   "name": "PUNE",
//   "code": "PUNE001",
//   "createdAt": "2025-03-15T13:24:26.961Z",
//   "updatedAt": "2025-03-15T13:24:26.961Z",
//   "createdById": "86222296-2eb0-4fa4-a599-00da4c7bbf35",
//   "updatedById": "86222296-2eb0-4fa4-a599-00da4c7bbf35"
// },

const getPlantColumns = (userRole) => {
  // Base columns for all users
  const baseColumns = [
    { field: 'name', headerName: 'Name', width: 150 },
    { field: 'code', headerName: 'Code', width: 150 },
    { field: 'createdAt', headerName: 'Created At', width: 150 },
    { field: 'updatedAt', headerName: 'Updated At', width: 150 },
  ];
  
  // Add admin-specific columns
  if (userRole === 'ADMIN') {
    baseColumns.push({ field: 'handleProcess', headerName: 'Actions', width: 150 });
  }
  
  return baseColumns;
};


const getInwardColumns = (userRole) => {
  // Base columns for all users
  const baseColumns = [
    { field: 'source', headerName: 'Source', width: 100 },
    { field: 'manufacturedQty', headerName: 'Manufactured Qty', width: 100 },
    { field: 'qtyIncharge', headerName: 'Qty Incharge', width: 100 },
    { field: 'qtySupervisor', headerName: 'Qty Supervisor', width: 100 },
    { field: 'finalQty', headerName: 'Final Qty', width: 100 },
    { field: 'date', headerName: 'Date', width: 150 },
    {field: 'status', headerName: 'Status', width: 100},
    {field: 'plantId', headerName: 'Plant', width: 100},
  ];

  if (userRole === 'ADMIN') {
    baseColumns.push({ field: 'handleProcess', headerName: 'Actions', width: 150 }); }
  
  return baseColumns;
};
  


module.exports = {
  getUserColumns,
  getProductColumns,
  getPlantColumns,
  getInwardColumns,
};
