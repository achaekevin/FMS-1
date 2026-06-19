'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('audit_logs', 'action', {
      type: Sequelize.ENUM(
        'CREATE','UPDATE','DELETE','LOGIN','LOGOUT',
        'EXPORT','MPESA','VIEW','APPROVE','REJECT'
      ),
      allowNull: false,
    });
    await queryInterface.changeColumn('audit_logs', 'module', {
      type: Sequelize.ENUM(
        'AUTH','INCOME','EXPENSE','MEMBER','FUND','REPORT','MPESA','USER',
        'BUDGET','RECEIPT','EVENT','ASSET','PAYROLL','BRANCH',
        'ANNOUNCEMENT','SETTINGS','BACKUP','NOTIFICATION'
      ),
      allowNull: false,
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('audit_logs', 'action', {
      type: Sequelize.ENUM('CREATE','UPDATE','DELETE','LOGIN','LOGOUT','EXPORT','MPESA','VIEW'),
      allowNull: false,
    });
    await queryInterface.changeColumn('audit_logs', 'module', {
      type: Sequelize.ENUM('AUTH','INCOME','EXPENSE','MEMBER','FUND','REPORT','MPESA','USER'),
      allowNull: false,
    });
  },
};
