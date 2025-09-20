'use strict';

const DeIDContract = require('./deid-contract');
const IncidentLogContract = require('./incident-contract');

module.exports.DeIDContract = DeIDContract;
module.exports.IncidentLogContract = IncidentLogContract;
module.exports.contracts = [DeIDContract, IncidentLogContract];