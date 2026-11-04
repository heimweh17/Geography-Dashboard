variable "aws_region" {
  description = "AWS region used for container registry resources."
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Prefix used for ECR repositories and resource tags."
  type        = string
  default     = "geo-dashboard"
}

variable "environment" {
  description = "Environment tag for provisioned resources."
  type        = string
  default     = "staging"
}
