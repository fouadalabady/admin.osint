#!/bin/bash

# OSINT Dashboard - Vercel Deployment Script
# Version: 1.0.0

# Colors for pretty output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to display header
show_header() {
  echo -e "${BLUE}============================================${NC}"
  echo -e "${BLUE}  OSINT Dashboard - Vercel Deployment Tool  ${NC}"
  echo -e "${BLUE}============================================${NC}"
  echo
}

# Function to check if vercel CLI is installed
check_vercel_cli() {
  echo -e "${YELLOW}Checking Vercel CLI installation...${NC}"
  if ! command -v vercel &> /dev/null
  then
    echo -e "${RED}Vercel CLI not found!${NC}"
    echo -e "Would you like to install it now? (y/n)"
    read -r install_vercel
    if [[ $install_vercel == "y" || $install_vercel == "Y" ]]; then
      echo -e "${YELLOW}Installing Vercel CLI...${NC}"
      npm install -g vercel
      if [ $? -eq 0 ]; then
        echo -e "${GREEN}Vercel CLI installed successfully.${NC}"
      else
        echo -e "${RED}Failed to install Vercel CLI. Please install it manually with: npm install -g vercel${NC}"
        exit 1
      fi
    else
      echo -e "${RED}Vercel CLI is required for deployment. Exiting.${NC}"
      exit 1
    fi
  else
    echo -e "${GREEN}Vercel CLI is installed.${NC}"
  fi
}

# Function to check if user is logged in to Vercel
check_vercel_login() {
  echo -e "${YELLOW}Checking Vercel login status...${NC}"
  vercel whoami &> /dev/null
  if [ $? -ne 0 ]; then
    echo -e "${RED}Not logged in to Vercel.${NC}"
    echo -e "${YELLOW}Please login to continue:${NC}"
    vercel login
    if [ $? -ne 0 ]; then
      echo -e "${RED}Failed to login to Vercel. Exiting.${NC}"
      exit 1
    fi
  else
    echo -e "${GREEN}Already logged in to Vercel.${NC}"
  fi
}

# Function to check for environment variables
check_env_vars() {
  echo -e "${YELLOW}Checking critical environment variables...${NC}"
  local missing_vars=0
  
  # Create a temporary file with the list of all environment variables
  env_file=".env.vercel.temp"
  
  # Check if .env.local exists and use it as a base
  if [ -f .env.local ]; then
    cp .env.local "$env_file"
    echo -e "${GREEN}Using .env.local as a base for environment variables.${NC}"
  elif [ -f .env.example ]; then
    cp .env.example "$env_file"
    echo -e "${YELLOW}Using .env.example as a base for environment variables.${NC}"
  else
    echo -e "${RED}Neither .env.local nor .env.example found. Creating a new environment file.${NC}"
    touch "$env_file"
  fi
  
  # Critical environment variables that must be set
  critical_vars=(
    "NEXTAUTH_URL"
    "NEXTAUTH_SECRET"
    "NEXT_PUBLIC_SUPABASE_URL"
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
    "SUPABASE_SERVICE_KEY"
  )
  
  # Check each critical variable
  for var in "${critical_vars[@]}"; do
    if ! grep -q "^$var=" "$env_file" && [ -z "${!var}" ]; then
      echo -e "${RED}Missing critical environment variable: $var${NC}"
      echo -e "${YELLOW}Would you like to set $var now? (y/n)${NC}"
      read -r set_var
      if [[ $set_var == "y" || $set_var == "Y" ]]; then
        echo -e "Enter value for $var:"
        read -r var_value
        echo "$var=$var_value" >> "$env_file"
        echo -e "${GREEN}Added $var to environment file.${NC}"
      else
        echo -e "${RED}$var is required for proper functionality.${NC}"
        missing_vars=$((missing_vars + 1))
      fi
    else
      echo -e "${GREEN}✓ $var is set.${NC}"
    fi
  done
  
  if [ $missing_vars -gt 0 ]; then
    echo -e "${YELLOW}Warning: $missing_vars critical environment variables are missing.${NC}"
    echo -e "${YELLOW}This may cause issues with your deployment.${NC}"
    echo -e "${YELLOW}Do you want to continue anyway? (y/n)${NC}"
    read -r continue_deploy
    if [[ $continue_deploy != "y" && $continue_deploy != "Y" ]]; then
      echo -e "${RED}Deployment aborted.${NC}"
      rm -f "$env_file"
      exit 1
    fi
  else
    echo -e "${GREEN}All critical environment variables are set.${NC}"
  fi
}

# Function to run tests and checks before deployment
run_pre_deploy_checks() {
  echo -e "${YELLOW}Running pre-deployment checks...${NC}"
  
  # Check for lint errors
  echo -e "${YELLOW}Running linting...${NC}"
  npm run lint
  if [ $? -ne 0 ]; then
    echo -e "${RED}Linting issues found. Would you like to try to fix them automatically? (y/n)${NC}"
    read -r fix_lint
    if [[ $fix_lint == "y" || $fix_lint == "Y" ]]; then
      npm run lint:fix
      # Re-check after fixing
      npm run lint
      if [ $? -ne 0 ]; then
        echo -e "${RED}Linting issues still present after attempting to fix. Please fix manually before deploying.${NC}"
        echo -e "${YELLOW}Do you want to continue anyway? (y/n)${NC}"
        read -r continue_lint
        if [[ $continue_lint != "y" && $continue_lint != "Y" ]]; then
          echo -e "${RED}Deployment aborted.${NC}"
          exit 1
        fi
      else
        echo -e "${GREEN}Linting issues fixed automatically.${NC}"
      fi
    else
      echo -e "${YELLOW}Proceeding with deployment despite linting issues.${NC}"
    fi
  else
    echo -e "${GREEN}Linting passed.${NC}"
  fi
  
  # Check TypeScript types
  echo -e "${YELLOW}Checking TypeScript types...${NC}"
  npm run typecheck
  if [ $? -ne 0 ]; then
    echo -e "${RED}TypeScript type errors found.${NC}"
    echo -e "${YELLOW}Do you want to continue anyway? (y/n)${NC}"
    read -r continue_ts
    if [[ $continue_ts != "y" && $continue_ts != "Y" ]]; then
      echo -e "${RED}Deployment aborted.${NC}"
      exit 1
    fi
  else
    echo -e "${GREEN}TypeScript type check passed.${NC}"
  fi
  
  echo -e "${GREEN}Pre-deployment checks completed.${NC}"
}

# Function to deploy to Vercel
deploy_to_vercel() {
  echo -e "${YELLOW}Preparing for deployment to Vercel...${NC}"
  
  # Ask for deployment environment
  echo -e "${BLUE}Select deployment environment:${NC}"
  echo "1) Production"
  echo "2) Preview (Staging)"
  echo "3) Development"
  read -r deploy_env
  
  local env_flag=""
  local env_name=""
  
  case $deploy_env in
    1)
      env_flag="--prod"
      env_name="production"
      ;;
    2)
      env_flag=""
      env_name="preview (staging)"
      ;;
    3)
      env_flag="--dev"
      env_name="development"
      ;;
    *)
      echo -e "${RED}Invalid selection. Using preview environment by default.${NC}"
      env_name="preview (staging)"
      ;;
  esac
  
  echo -e "${YELLOW}Deploying to ${env_name} environment...${NC}"
  
  # Confirm deployment
  echo -e "${YELLOW}Ready to deploy to Vercel ${env_name} environment.${NC}"
  echo -e "${YELLOW}Do you want to continue? (y/n)${NC}"
  read -r confirm_deploy
  
  if [[ $confirm_deploy == "y" || $confirm_deploy == "Y" ]]; then
    echo -e "${YELLOW}Starting deployment...${NC}"
    
    # Upload environment variables if we created a temp file
    if [ -f .env.vercel.temp ]; then
      echo -e "${YELLOW}Uploading environment variables to Vercel...${NC}"
      vercel env pull
      vercel env import .env.vercel.temp
    fi
    
    # Deploy with the appropriate environment flag
    vercel $env_flag
    
    if [ $? -eq 0 ]; then
      echo -e "${GREEN}Deployment to ${env_name} completed successfully!${NC}"
    else
      echo -e "${RED}Deployment failed. Please check the logs above for errors.${NC}"
      exit 1
    fi
  else
    echo -e "${RED}Deployment cancelled.${NC}"
    exit 1
  fi
}

# Function to clean up temporary files
cleanup() {
  echo -e "${YELLOW}Cleaning up temporary files...${NC}"
  rm -f .env.vercel.temp
  echo -e "${GREEN}Cleanup completed.${NC}"
}

# Main execution flow
main() {
  show_header
  check_vercel_cli
  check_vercel_login
  check_env_vars
  run_pre_deploy_checks
  deploy_to_vercel
  cleanup
  
  echo -e "${GREEN}Vercel deployment process completed!${NC}"
}

# Run the main function
main 