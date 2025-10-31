# Task Manager CLI

Command-line interface for the Task Manager system.

## Installation

```bash
npm install
npm link
```

## Configuration

Set your API URL and token:

```bash
export API_URL=http://localhost:3001/api
export API_TOKEN=your-auth-token
```

## Usage

### Task Management

```bash
# List all tasks
task-cli task list

# Filter by status
task-cli task list --status pending

# Limit results
task-cli task list --limit 20

# Create a new task
task-cli task create "Implement new feature" \
  --description "Add user authentication" \
  --priority 5

# Get task details
task-cli task get <task-id>

# Delete a task
task-cli task delete <task-id>
```

### Template Management

```bash
# List all templates
task-cli template list

# Export a template
task-cli template export <template-id> --format json
task-cli template export <template-id> --format yaml --output template.yaml
```

### Pipeline Management

```bash
# Execute pipeline for a task
task-cli pipeline execute <task-id>
```

### System Management

```bash
# Check system health
task-cli system health

# Get system statistics
task-cli system stats
```

## Development

```bash
# Run in development mode
npm run dev

# Build
npm run build

# Run built version
npm start
```

## Examples

### Complete Workflow

```bash
# 1. Check system health
task-cli system health

# 2. Create a new task
task-cli task create "Build new feature" \
  --description "Implement user dashboard" \
  --priority 8

# 3. List tasks
task-cli task list --status pending

# 4. Execute pipeline
task-cli pipeline execute <task-id>

# 5. Export template for reuse
task-cli template export <template-id> --output my-template.json
```

## Output Format

All commands provide colorized, formatted output:
- ✓ Green for success
- ✗ Red for errors
- Tables for list views
- Detailed information for single item views

## License

MIT
