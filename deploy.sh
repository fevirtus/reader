#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${RED}Error: .env file not found!${NC}"
    echo -e "${YELLOW}Please copy env.example to .env and configure your environment variables.${NC}"
    exit 1
fi

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
}

# Function to check if Docker Compose is available
check_docker_compose() {
    if ! docker compose version > /dev/null 2>&1; then
        print_error "Docker Compose is not available. Please install Docker Compose and try again."
        exit 1
    fi
}

# Main script
case "$1" in
    "start")
        print_status "Starting Reader application..."
        check_docker
        check_docker_compose
        docker compose up -d
        print_status "Reader application started successfully!"
        print_status "Frontend: http://localhost:3000"
        print_status "Backend: http://localhost:8000"
        ;;
    "stop")
        print_status "Stopping Reader application..."
        docker compose down
        print_status "Reader application stopped successfully!"
        ;;
    "restart")
        print_status "Restarting Reader application..."
        docker compose down
        docker compose up -d
        print_status "Reader application restarted successfully!"
        ;;
    "logs")
        if [ -z "$2" ]; then
            print_status "Showing logs for all services..."
            docker compose logs -f
        else
            print_status "Showing logs for service: $2"
            docker compose logs -f "$2"
        fi
        ;;
    "build")
        print_status "Building Docker images..."
        docker compose build
        print_status "Docker images built successfully!"
        ;;
    "status")
        print_status "Checking service status..."
        docker compose ps
        ;;
    "cleanup")
        print_warning "This will remove all containers, networks, and volumes!"
        read -p "Are you sure? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            print_status "Cleaning up Docker resources..."
            docker compose down -v --remove-orphans
            docker system prune -f
            print_status "Cleanup completed!"
        else
            print_status "Cleanup cancelled."
        fi
        ;;
    "update")
        print_status "Pulling latest images..."
        docker compose pull
        print_status "Restarting services with latest images..."
        docker compose down
        docker compose up -d
        print_status "Update completed!"
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|logs|build|status|cleanup|update}"
        echo ""
        echo "Commands:"
        echo "  start     - Start the Reader application"
        echo "  stop      - Stop the Reader application"
        echo "  restart   - Restart the Reader application"
        echo "  logs      - Show logs (all services or specific service)"
        echo "  build     - Build Docker images"
        echo "  status    - Show service status"
        echo "  cleanup   - Remove all containers, networks, and volumes"
        echo "  update    - Pull latest images and restart services"
        echo ""
        echo "Examples:"
        echo "  $0 start"
        echo "  $0 logs frontend"
        echo "  $0 logs backend"
        exit 1
        ;;
esac 