const swaggerJsdoc = require('swagger-jsdoc');

const churchName = process.env.CHURCH_NAME || 'Grace Life Church';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title:       `${churchName} Financial Management System API`,
      version:     '2.0.0',
      description: `REST API for ${churchName} — members, income, expenses, funds, M-Pesa, budgets, receipts, events, assets, payroll, branches, announcements, settings, and more.`,
      contact: { name: 'Admin', email: 'admin@gracelifechurch.org' },
    },
    servers: [
      { url: 'http://localhost:5000/api', description: 'Development' },
      { url: 'https://api.gracelifechurch.org/api', description: 'Production' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
      schemas: {
        User:    { type: 'object', properties: { id: { type: 'integer' }, name: { type: 'string' }, email: { type: 'string' }, role: { type: 'string' } } },
        Member:  { type: 'object', properties: { id: { type: 'integer' }, fullName: { type: 'string' }, phone: { type: 'string' }, email: { type: 'string' } } },
        Income:  { type: 'object', properties: { id: { type: 'integer' }, type: { type: 'string' }, amount: { type: 'number' }, paymentMethod: { type: 'string' }, date: { type: 'string', format: 'date' } } },
        Expense: { type: 'object', properties: { id: { type: 'integer' }, category: { type: 'string' }, amount: { type: 'number' }, approvedBy: { type: 'string' }, date: { type: 'string', format: 'date' } } },
        Budget:  { type: 'object', properties: { id: { type: 'integer' }, title: { type: 'string' }, amount: { type: 'number' }, spentAmount: { type: 'number' }, remainingAmount: { type: 'number' } } },
        Receipt: { type: 'object', properties: { id: { type: 'integer' }, receiptNumber: { type: 'string' }, memberName: { type: 'string' }, amount: { type: 'number' }, date: { type: 'string', format: 'date' } } },
        Event:   { type: 'object', properties: { id: { type: 'integer' }, title: { type: 'string' }, category: { type: 'string' }, eventDate: { type: 'string', format: 'date' }, status: { type: 'string' } } },
        Asset:   { type: 'object', properties: { id: { type: 'integer' }, assetName: { type: 'string' }, category: { type: 'string' }, value: { type: 'number' }, condition: { type: 'string' } } },
        Employee:{ type: 'object', properties: { id: { type: 'integer' }, name: { type: 'string' }, role: { type: 'string' }, department: { type: 'string' }, basicSalary: { type: 'number' } } },
        Branch:  { type: 'object', properties: { id: { type: 'integer' }, name: { type: 'string' }, location: { type: 'string' }, pastor: { type: 'string' } } },
        ApiResponse: { type: 'object', properties: { success: { type: 'boolean' }, message: { type: 'string' }, data: { type: 'object' } } },
        PaginatedResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' }, message: { type: 'string' },
            data:    { type: 'array', items: {} },
            meta:    { type: 'object', properties: { total: { type: 'integer' }, page: { type: 'integer' }, limit: { type: 'integer' }, totalPages: { type: 'integer' } } },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./routes/*.js', './controllers/*.js'],
};

module.exports = swaggerJsdoc(options);
