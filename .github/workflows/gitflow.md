# Git Flow Branching Strategy

This project follows the Git Flow branching model to manage the development workflow.

## Branch Structure

- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/*` - Individual feature branches (e.g., `feature/user-authentication`)
- `bugfix/*` - Bug fix branches (e.g., `bugfix/login-error`)
- `hotfix/*` - Emergency fixes for production (e.g., `hotfix/critical-security-issue`)
- `release/*` - Release preparation branches (e.g., `release/v1.0.0`)

## Workflow Guidelines

### Feature Development

1. Create a feature branch from `develop`:

   ```bash
   git checkout develop
   git pull
   git checkout -b feature/your-feature-name
   ```

2. Work on your feature, committing changes with clear messages
3. Push your branch to the remote repository:

   ```bash
   git push -u origin feature/your-feature-name
   ```

4. When complete, create a Pull Request to merge into `develop`
5. After code review, merge the feature into `develop`

### Bug Fixes

1. Create a bugfix branch from `develop`:

   ```bash
   git checkout develop
   git pull
   git checkout -b bugfix/bug-description
   ```

2. Fix the bug and push your branch
3. Create a Pull Request to merge into `develop`

### Releases

1. When `develop` is ready for release, create a release branch:

   ```bash
   git checkout develop
   git pull
   git checkout -b release/vX.Y.Z
   ```

2. Make any final adjustments and version updates
3. Create a Pull Request to merge into `main`
4. After merging to `main`, tag the release:
   ```bash
   git checkout main
   git pull
   git tag -a vX.Y.Z -m "Version X.Y.Z"
   git push origin vX.Y.Z
   ```
5. Merge changes back to `develop`:
   ```bash
   git checkout develop
   git merge main
   git push
   ```

### Hotfixes

1. For critical issues in production, create a hotfix branch from `main`:

   ```bash
   git checkout main
   git pull
   git checkout -b hotfix/critical-issue
   ```

2. Fix the issue and push your branch
3. Create Pull Requests to merge into both `main` AND `develop`
4. Tag the hotfix version

## Branch Protection Rules

- `main` and `develop` branches are protected
- Direct pushes to `main` and `develop` are not allowed
- Pull Requests require at least one reviewer approval
- Status checks must pass before merging
