const Customer = require("./customerModel");
const Company = require("./companyModel");
const Worker = require("./workerModel");
const ArchitectHiring = require("./architectHiringModel");
const ConstructionProjectSchema = require("./constructionProjectModel");
const DesignRequest = require("./designRequestModel");
const Bid = require("./bidModel");
const WorkerToCompany = require("./workerToCompanyModel");
const CompanytoWorker = require("./companyToWorkerModel");
const ChatRoom = require("./chatModel");
const Complaint = require("./complaintModel");
const Transaction = require("./transactionModel");
const PlatformManager = require("./platformManagerModel");
const VerificationTask = require("./verificationTaskModel");
const TaskAssignmentCounter = require("./taskAssignmentCounterModel");
const SystemSettings = require("./SystemSettings");

module.exports = {
  Customer,
  Company,
  Worker,
  ArchitectHiring,
  ConstructionProjectSchema,
  DesignRequest,
  Bid,
  WorkerToCompany,
  CompanytoWorker,
  ChatRoom,
  Complaint,
  Transaction,
  PlatformManager,
  VerificationTask,
  TaskAssignmentCounter,
  SystemSettings,
};
