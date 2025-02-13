FROM golang:1.23-alpine

WORKDIR /app

# Install required system dependencies
RUN apk add --no-cache gcc musl-dev

# Copy only go.mod and go.sum first for better caching
COPY go.mod ./
# Remove go.sum from initial copy since it might not exist yet
# COPY go.sum ./

# Download dependencies
RUN go mod tidy

# Copy source code
COPY . .

# Build the application
RUN go build -o main .

# Expose port 8080
EXPOSE 8080

# Command to run the application
CMD ["./main"]