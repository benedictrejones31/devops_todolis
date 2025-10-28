terraform {
  required_version = ">= 1.0"
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.80"
    }
  }
}

provider "azurerm" {
  features {}
  skip_provider_registration = false
}

# Resource Group
resource "azurerm_resource_group" "todolist_rg" {
  name     = var.resource_group_name
  location = var.location
  
  tags = {
    Environment = var.environment
    Project     = "TodoList-DevOps"
    ManagedBy   = "Terraform"
  }
}

# Container Registry
resource "azurerm_container_registry" "acr" {
  name                = var.acr_name
  resource_group_name = azurerm_resource_group.todolist_rg.name
  location            = azurerm_resource_group.todolist_rg.location
  sku                 = "Basic"
  admin_enabled       = true
  
  tags = {
    Environment = var.environment
  }
}

# App Service Plan
resource "azurerm_service_plan" "app_plan" {
  name                = var.app_service_plan_name
  location            = azurerm_resource_group.todolist_rg.location
  resource_group_name = azurerm_resource_group.todolist_rg.name
  os_type             = "Linux"
  sku_name            = "B1"
  
  tags = {
    Environment = var.environment
  }
}

# App Service
resource "azurerm_linux_web_app" "todolist_app" {
  name                = var.app_service_name
  location            = azurerm_resource_group.todolist_rg.location
  resource_group_name = azurerm_resource_group.todolist_rg.name
  service_plan_id     = azurerm_service_plan.app_plan.id
  
  site_config {
    always_on = false
    
    application_stack {
      docker_image_name   = "nginx:latest"
      docker_registry_url = "https://index.docker.io"
    }
  }
  
  app_settings = {
    "WEBSITES_ENABLE_APP_SERVICE_STORAGE" = "false"
    "DOCKER_REGISTRY_SERVER_URL"          = azurerm_container_registry.acr.login_server
    "DOCKER_REGISTRY_SERVER_USERNAME"     = azurerm_container_registry.acr.admin_username
    "DOCKER_REGISTRY_SERVER_PASSWORD"     = azurerm_container_registry.acr.admin_password
  }
  
  tags = {
    Environment = var.environment
  }
}

# Storage Account for Data Persistence
resource "azurerm_storage_account" "storage" {
  name                     = var.storage_account_name
  resource_group_name      = azurerm_resource_group.todolist_rg.name
  location                 = azurerm_resource_group.todolist_rg.location
  account_tier             = "Standard"
  account_replication_type = "LRS"
  
  tags = {
    Environment = var.environment
  }
}

# Storage Container
resource "azurerm_storage_container" "data_container" {
  name                  = "todolist-data"
  storage_account_name  = azurerm_storage_account.storage.name
  container_access_type = "private"
}
