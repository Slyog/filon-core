# FILON Branch Model

- **main** → stable production (protected, PR only)  
- **dev** → default branch for active development  
- **feature/*** → temporary feature branches  
- **release/*** → version preparation branches  

All commits go dev → main via Pull Request.  
Main branch builds auto-deploy to production once CI passes.
