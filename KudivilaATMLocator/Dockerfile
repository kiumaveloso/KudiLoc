FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy solution and project files first for layer caching
COPY KudiLoc.sln .
COPY ATMLocator.API/ATMLocator.API.csproj ATMLocator.API/
COPY ATMLocator.Application/ATMLocator.Application.csproj ATMLocator.Application/
COPY ATMLocator.Core/ATMLocator.Core.csproj ATMLocator.Core/
COPY ATMLocator.Infrastructure/ATMLocator.Infrastructure.csproj ATMLocator.Infrastructure/
COPY ATMLocator.Tests/ATMLocator.Tests.csproj ATMLocator.Tests/

RUN dotnet restore

# Copy everything and build
COPY . .
RUN dotnet build -c Release --no-restore
RUN dotnet test -c Release --no-build --no-restore

FROM build AS publish
RUN dotnet publish ATMLocator.API/ATMLocator.API.csproj -c Release -o /app/publish --no-build

FROM base AS final
WORKDIR /app

# Create non-root user
RUN adduser --disabled-password --gecos "" appuser

COPY --from=publish /app/publish .

# Create directories for logs and photos with proper permissions
RUN mkdir -p logs wwwroot/photos && chown -R appuser:appuser /app

USER appuser

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

ENTRYPOINT ["dotnet", "ATMLocator.API.dll"]
