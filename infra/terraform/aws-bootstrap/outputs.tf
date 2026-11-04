output "ecr_repository_urls" {
  description = "Repository URLs for a future CI image-publishing workflow."
  value       = { for name, repository in aws_ecr_repository.service : name => repository.repository_url }
}
