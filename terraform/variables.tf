variable "resource_group_name" {
  description = "Name of the resource group"
  type        = string
  default     = "todolist-devops-rg"
}

variable "location" {
  description = "Azure region for resources"
  type        = string
  default     = "centralindia"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "acr_name" {
  description = "Name of the Azure Container Registry"
  type        = string
  default     = "todolistacr2025"
}

variable "app_service_plan_name" {
  description = "Name of the App Service Plan"
  type        = string
  default     = "todolist-app-plan"
}

variable "app_service_name" {
  description = "Name of the App Service"
  type        = string
  default     = "todolist-webapp-2025"
}

variable "storage_account_name" {
  description = "Name of the storage account"
  type        = string
  default     = "todoliststorage2025"
}
