FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY PersonalFinance.sln ./
COPY src/PersonalFinance.Api/PersonalFinance.Api.csproj src/PersonalFinance.Api/
COPY src/PersonalFinance.Application/PersonalFinance.Application.csproj src/PersonalFinance.Application/
COPY src/PersonalFinance.Domain/PersonalFinance.Domain.csproj src/PersonalFinance.Domain/
COPY src/PersonalFinance.Infrastructure/PersonalFinance.Infrastructure.csproj src/PersonalFinance.Infrastructure/

RUN dotnet restore PersonalFinance.sln

COPY . .
RUN dotnet publish src/PersonalFinance.Api/PersonalFinance.Api.csproj -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /app/publish .
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
ENTRYPOINT ["dotnet", "PersonalFinance.Api.dll"]
