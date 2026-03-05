FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app

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

# Tests are skipped in Docker builds because they require a live MongoDB instance.
# Run tests locally or in CI before building the image:
#   dotnet test -c Release --no-build --no-restore

FROM build AS publish
RUN dotnet publish ATMLocator.API/ATMLocator.API.csproj -c Release -o /app/publish --no-build

FROM base AS final
WORKDIR /app

# Create non-root user
RUN adduser --disabled-password --gecos "" appuser

# Fix OpenSSL 3.x compatibility with MongoDB Atlas TLS on Debian Bookworm.
# Without this, the SSL handshake fails with "tlsv1 alert internal error".
RUN sed -i 's/\(MinProtocol *= *\).*/\1TLSv1.2/' /etc/ssl/openssl.cnf \
    && sed -i 's/\(CipherString *= *\).*/\1DEFAULT:@SECLEVEL=1/' /etc/ssl/openssl.cnf

COPY --from=publish /app/publish .

# Create directories for logs and photos with proper permissions
RUN mkdir -p logs wwwroot/photos && chown -R appuser:appuser /app

USER appuser

# Render.com injects PORT env var. ASP.NET Core reads ASPNETCORE_URLS to determine
# which address/port to bind. The entrypoint script maps PORT -> ASPNETCORE_URLS.
# If PORT is not set (e.g., local Docker run), default to 8080.
ENV ASPNETCORE_ENVIRONMENT=Production

# Use a shell entrypoint so we can expand $PORT at runtime
ENTRYPOINT ["sh", "-c", "dotnet ATMLocator.API.dll --urls http://0.0.0.0:${PORT:-8080}"]
