const adminPathOverrides = require("./admin");
const authPathOverrides = require("./auth");
const chatPathOverrides = require("./chat");
const companyPathOverrides = require("./company");
const complaintPathOverrides = require("./complaint");
const customerPathOverrides = require("./customer");
const paymentPathOverrides = require("./payment");
const platformManagerPathOverrides = require("./platformManager");
const projectPathOverrides = require("./project");
const reviewPathOverrides = require("./review");
const workerPathOverrides = require("./worker");

const orderedPathGroups = [
  { file: "admin", paths: adminPathOverrides },
  { file: "auth", paths: authPathOverrides },
  { file: "chat", paths: chatPathOverrides },
  { file: "company", paths: companyPathOverrides },
  { file: "complaint", paths: complaintPathOverrides },
  { file: "customer", paths: customerPathOverrides },
  { file: "payment", paths: paymentPathOverrides },
  { file: "platformManager", paths: platformManagerPathOverrides },
  { file: "project", paths: projectPathOverrides },
  { file: "review", paths: reviewPathOverrides },
  { file: "worker", paths: workerPathOverrides },
];

const mergedPathOverrides = orderedPathGroups.reduce((acc, group) => {
  Object.assign(acc, group.paths);
  return acc;
}, {});

Object.defineProperty(mergedPathOverrides, "__orderedPathGroups", {
  value: orderedPathGroups,
  enumerable: false,
});

module.exports = mergedPathOverrides;
