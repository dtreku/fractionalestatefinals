// SPDX-License-Identifier: MIT
/**
 * Initial Migration
 * Required by Truffle for tracking deployment state
 */

const Migrations = artifacts.require("Migrations");

module.exports = function (deployer) {
  deployer.deploy(Migrations);
};
