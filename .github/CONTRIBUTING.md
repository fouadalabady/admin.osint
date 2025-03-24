# Contributing to OSINT Dashboard

Thank you for considering contributing to the OSINT Dashboard! This document outlines the process for contributing to this project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Commit Message Guidelines](#commit-message-guidelines)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)

## Code of Conduct

This project adheres to a Code of Conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally
3. **Set up the development environment**:
   ```bash
   npm install
   ```
4. **Create a local .env file** using `.env.example` as a template
5. **Start the development server**:
   ```bash
   npm run dev
   ```

## Development Workflow

We follow the Git Flow branching model. Please refer to [our Git Flow documentation](.github/workflows/gitflow.md) for detailed information.

### Branch Naming Convention

- Feature branches: `feature/short-description`
- Bug fix branches: `bugfix/short-description`
- Hotfix branches: `hotfix/short-description`
- Release branches: `release/vX.Y.Z`

## Pull Request Process

1. **Create a branch** from `develop` following our branch naming conventions
2. **Make your changes** and commit them with clear, descriptive commit messages
3. **Test your changes** thoroughly, including adding new tests as appropriate
4. **Update documentation** to reflect any changes
5. **Push your branch** to your fork on GitHub
6. **Submit a pull request** to the `develop` branch of the original repository
7. **Respond to feedback** and make necessary changes
8. Once approved, your PR will be merged by a maintainer

## Coding Standards

We maintain consistent coding standards through automation:

- **ESLint**: For JavaScript/TypeScript code quality
- **Prettier**: For code formatting
- **TypeScript**: For type safety

The project has pre-configured settings for these tools. To check your code:

```bash
# Run linting
npm run lint

# Fix automatic linting issues
npm run lint:fix

# Format code
npm run format
```

## Commit Message Guidelines

We follow conventional commits for clear, machine-readable commit messages:

```
<type>(<scope>): <subject>

<body>

<footer>
```

Types include:
- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, etc.)
- **refactor**: Code changes that neither fix a bug nor add a feature
- **perf**: Performance improvements
- **test**: Adding or fixing tests
- **chore**: Changes to the build process or auxiliary tools

Example:
```
feat(auth): add email verification flow

- Implement token generation
- Add email templates
- Create verification API endpoint

Closes #123
```

## Testing Guidelines

All new features and bug fixes should include tests:

- **Unit tests** for individual functions and components
- **Integration tests** for API endpoints and complex interactions
- **End-to-end tests** for critical user journeys

Run tests with:
```bash
# Run all tests
npm test

# Run tests in watch mode during development
npm run test:watch
```

## Documentation

- Update the README.md with details of changes to the interface
- Document new features, API endpoints, or configuration options
- Include code examples where appropriate
- Keep documentation up to date with code changes

Thank you for contributing! 