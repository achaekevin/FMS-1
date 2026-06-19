const User             = require('./User');
const Member           = require('./Member');
const Fund             = require('./Fund');
const Income           = require('./Income');
const Expense          = require('./Expense');
const AuditLog         = require('./AuditLog');
const MpesaTransaction = require('./MpesaTransaction');
const Notification     = require('./Notification');
const Budget           = require('./Budget');
const Receipt          = require('./Receipt');
const Event            = require('./Event');
const Asset            = require('./Asset');
const Employee         = require('./Employee');
const SalaryRecord     = require('./SalaryRecord');
const { Branch, BranchUser } = require('./Branch');
const Announcement     = require('./Announcement');
const Setting          = require('./Setting');

// ── Income associations ───────────────────────────────────
Income.belongsTo(Member, { foreignKey: 'memberId',   as: 'member' });
Member.hasMany(Income,   { foreignKey: 'memberId',   as: 'incomes' });

Income.belongsTo(User,   { foreignKey: 'recordedBy', as: 'recorder' });
User.hasMany(Income,     { foreignKey: 'recordedBy', as: 'recordedIncomes' });

Income.belongsTo(Fund,   { foreignKey: 'fundId',     as: 'fund' });
Fund.hasMany(Income,     { foreignKey: 'fundId',     as: 'incomes' });

// ── Expense associations ──────────────────────────────────
Expense.belongsTo(User,  { foreignKey: 'recordedBy', as: 'recorder' });
User.hasMany(Expense,    { foreignKey: 'recordedBy', as: 'recordedExpenses' });

Expense.belongsTo(Fund,  { foreignKey: 'fundId',     as: 'fund' });
Fund.hasMany(Expense,    { foreignKey: 'fundId',     as: 'expenses' });

Expense.belongsTo(User,  { foreignKey: 'pastorId',   as: 'pastor' });
User.hasMany(Expense,    { foreignKey: 'pastorId',   as: 'pastorApprovals' });

Expense.belongsTo(User,  { foreignKey: 'adminId',    as: 'admin' });
User.hasMany(Expense,    { foreignKey: 'adminId',    as: 'adminFinalizations' });

// ── AuditLog associations ─────────────────────────────────
AuditLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(AuditLog,   { foreignKey: 'userId', as: 'auditLogs' });

// ── MpesaTransaction associations ────────────────────────
MpesaTransaction.belongsTo(User,   { foreignKey: 'initiatedBy', as: 'initiator' });
MpesaTransaction.belongsTo(Member, { foreignKey: 'memberId',    as: 'member' });
User.hasMany(MpesaTransaction,     { foreignKey: 'initiatedBy', as: 'mpesaTransactions' });
Member.hasMany(MpesaTransaction,   { foreignKey: 'memberId',    as: 'mpesaTransactions' });

// ── Notification associations ─────────────────────────────
Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(Notification,   { foreignKey: 'userId', as: 'notifications' });

// ── Budget associations ───────────────────────────────────
Budget.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
User.hasMany(Budget,   { foreignKey: 'createdBy', as: 'budgets' });
Budget.belongsTo(Fund, { foreignKey: 'fundId',    as: 'fund' });
Fund.hasMany(Budget,   { foreignKey: 'fundId',    as: 'budgets' });

// ── Receipt associations ──────────────────────────────────
Receipt.belongsTo(User,   { foreignKey: 'generatedBy', as: 'generator' });
Receipt.belongsTo(Member, { foreignKey: 'memberId',    as: 'member' });
Receipt.belongsTo(Income, { foreignKey: 'incomeId',    as: 'income' });
User.hasMany(Receipt,     { foreignKey: 'generatedBy', as: 'receipts' });
Member.hasMany(Receipt,   { foreignKey: 'memberId',    as: 'receipts' });

// ── Event associations ────────────────────────────────────
Event.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
User.hasMany(Event,   { foreignKey: 'createdBy', as: 'events' });

// ── Asset associations ────────────────────────────────────
Asset.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
User.hasMany(Asset,   { foreignKey: 'createdBy', as: 'assets' });

// ── Employee / SalaryRecord associations ─────────────────
Employee.belongsTo(User,      { foreignKey: 'createdBy',   as: 'creator' });
SalaryRecord.belongsTo(Employee, { foreignKey: 'employeeId',  as: 'employee' });
SalaryRecord.belongsTo(User,     { foreignKey: 'generatedBy', as: 'generator' });
Employee.hasMany(SalaryRecord,   { foreignKey: 'employeeId',  as: 'salaryRecords' });

// ── Branch associations ───────────────────────────────────
BranchUser.belongsTo(Branch, { foreignKey: 'branchId', as: 'branch' });
BranchUser.belongsTo(User,   { foreignKey: 'userId',   as: 'user' });
Branch.hasMany(BranchUser,   { foreignKey: 'branchId', as: 'branchUsers' });
User.hasMany(BranchUser,     { foreignKey: 'userId',   as: 'branchUsers' });

// ── Announcement associations ─────────────────────────────
Announcement.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
User.hasMany(Announcement,   { foreignKey: 'createdBy', as: 'announcements' });

module.exports = {
  User, Member, Fund, Income, Expense, AuditLog, MpesaTransaction,
  Notification, Budget, Receipt, Event, Asset, Employee, SalaryRecord,
  Branch, BranchUser, Announcement, Setting,
};
