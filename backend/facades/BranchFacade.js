const DatabaseAdapter = require('../adapters/DatabaseAdapter');

class BranchFacade {

  async getBranches() {
    return await DatabaseAdapter.getBranches();
  }

}

module.exports = new BranchFacade();