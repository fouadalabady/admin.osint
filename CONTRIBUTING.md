# Contributing Guide

Thank you for your interest in contributing to the OSINT Dashboard & Agency Website project. This document outlines the process and guidelines for contributing to this project.

## Development Workflow

### 1. Branching Strategy

We follow the Git Flow branching model:

- `main`: Production-ready code
- `develop`: Latest development changes
- `feature/*`: For new features
- `bugfix/*`: For bug fixes
- `hotfix/*`: For urgent production fixes
- `release/*`: For preparing releases

### 2. Setting Up Your Development Environment

1. Clone the repository:
   ```bash
   git clone https://github.com/fouadalabady/admin.osint.git
   cd admin.osint
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file based on `.env.example`:
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your local configuration
   ```

4. Setup Supabase locally following the [Supabase Local Development Guide](docs/supabase-local-development.md).

5. Start the development server:
   ```bash
   npm run dev
   ```

### 3. Making Changes

1. Create a new branch for your feature or bugfix:
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b bugfix/issue-description
   ```

2. Make your changes, following our coding standards.

3. Write tests for your changes when applicable.

4. Run linting and tests locally:
   ```bash
   npm run lint
   npm test
   ```

5. Commit your changes with clear, descriptive messages following the [Conventional Commits](https://www.conventionalcommits.org/) standard:
   ```bash
   git commit -m "feat: add new authentication feature"
   # or
   git commit -m "fix: resolve issue with password reset flow"
   ```

6. Push your branch to GitHub:
   ```bash
   git push -u origin your-branch-name
   ```

7. Open a Pull Request against the `develop` branch.

## Coding Standards

### 1. TypeScript and JavaScript

- Use TypeScript for all new code
- Follow the ESLint and Prettier configurations in the project
- Use strong typing, avoid `any` unless absolutely necessary
- Write self-documenting code with clear variable and function names

### 2. UI Components

- Use only components from [shadcn/ui](https://ui.shadcn.com) to maintain design consistency
- Do not create custom components if a shadcn/ui component already exists
- Follow the component structure and naming conventions in the project

### 3. Testing

- Write unit tests for critical functionality
- Cover edge cases in authentication, form handling, and email workflows
- Ensure tests are passing before submitting your PR

### 4. Documentation

- Update documentation when adding or changing features
- Document API endpoints, components, and complex logic
- Add comments for non-obvious code sections

## Pull Request Process

1. Fill out the PR template completely
2. Link any related issues
3. Ensure CI checks pass
4. Request review from appropriate team members
5. Address all review comments
6. Once approved, maintainers will merge your PR

## Code Review Guidelines

- Reviews should focus on code quality, readability, and correctness
- Be constructive and respectful in your feedback
- Use GitHub's suggestion feature for specific changes
- Check for security issues, especially in authentication flows

## Additional Resources

- [Project Architecture Documentation](docs/project-architecture.md)
- [Security Model Documentation](docs/security-model.md)
- [Supabase Local Development Guide](docs/supabase-local-development.md)
- [Testing Guidelines](docs/testing-guidelines.md)

## Questions?

If you have any questions, feel free to open an issue with the "question" label or reach out to the maintainers.

Thank you for contributing to making this project better! 