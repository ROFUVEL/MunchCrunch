const DatabaseAdapter = require('../adapters/DatabaseAdapter');

class BranchFacade {

  async getBranches() {
    return await DatabaseAdapter.getBranches();
  }
  
  async getBranchById(branchId) {
    const branches = await DatabaseAdapter.getBranches();
    return branches.find(b => b.id === parseInt(branchId));
  }
  
  async getStaffBranch(userId) {
    const user = await DatabaseAdapter.getUserById(userId);
    if (user && user.role === 'staff' && user.branch_id) {
      return await this.getBranchById(user.branch_id);
    }
    return null;
  }
  
  async branchExists(branchId) {
    const branch = await this.getBranchById(branchId);
    return !!branch;
  }
  
  async getBranchName(branchId) {
    const branch = await this.getBranchById(branchId);
    return branch ? branch.name : null;
  }
  
  async getBranchAddress(branchId) {
    const branch = await this.getBranchById(branchId);
    return branch ? branch.address : null;
  }

  async getBranchWorkingHours(branchId) {
    const branch = await this.getBranchById(branchId);
    return branch ? branch.working_hours : null;
  }
}

module.exports = new BranchFacade();