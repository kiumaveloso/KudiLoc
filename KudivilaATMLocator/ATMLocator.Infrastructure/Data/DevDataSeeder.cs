using ATMLocator.Core.Entities;
using Microsoft.Extensions.Logging;
using MongoDB.Bson;
using MongoDB.Driver;

namespace ATMLocator.Infrastructure.Data;

public static class DevDataSeeder
{
    /// <summary>
    /// Seeds development sample data into MongoDB.
    /// This method is resilient to MongoDB being unavailable -- it logs a
    /// warning and returns gracefully so that the application can still start.
    /// </summary>
    public static async Task SeedAsync(MongoDbContext context, ILogger? logger = null)
    {
        try
        {
            // Only seed if the ATMs collection is empty
            var existingCount = await context.ATMs.CountDocumentsAsync(FilterDefinition<ATM>.Empty);
            if (existingCount > 0)
                return;

            var now = DateTime.UtcNow;
            var atms = GetSampleATMs(now);
            await context.ATMs.InsertManyAsync(atms);

            var users = GetSampleUsers(now);
            foreach (var user in users)
            {
                // Use upsert to avoid duplicate key errors on phone number
                var filter = Builders<User>.Filter.Eq(u => u.PhoneNumber, user.PhoneNumber);
                await context.Users.ReplaceOneAsync(filter, user, new ReplaceOptions { IsUpsert = true });
            }

            logger?.LogInformation("Development seed data inserted successfully");
        }
        catch (Exception ex) when (ex is MongoConnectionException or TimeoutException or MongoCommandException or MongoBulkWriteException or MongoWriteException)
        {
            logger?.LogWarning(ex,
                "Failed to seed development data — MongoDB may be unavailable. " +
                "The application will continue without seed data");
        }
    }

    private static List<ATM> GetSampleATMs(DateTime now)
    {
        var atms = new List<ATM>
        {
            // Luanda - Talatona
            CreateATM("ATM BAI Talatona", "BAI", -8.9147, 13.1885,
                "Luanda", "Talatona", "Av. Pedro de Castro Van-Dúnem Loy", "Talatona", "Junto ao Xyami Shopping",
                true, OperationalStatus.Operational, 85, now,
                ["Levantamento", "Consulta de Saldo", "Transferência"]),

            // Luanda - Maculusso
            CreateATM("ATM BFA Maculusso", "BFA", -8.8368, 13.2344,
                "Luanda", "Luanda", "Rua Rainha Ginga", "Maculusso", "Perto do Hotel Presidente",
                true, OperationalStatus.Operational, 72, now,
                ["Levantamento", "Consulta de Saldo"]),

            // Luanda - Maianga
            CreateATM("ATM BIC Maianga", "BIC", -8.8400, 13.2310,
                "Luanda", "Luanda", "Av. Comandante Gika", "Maianga", "Frente ao Mercado do Kinaxixe",
                false, OperationalStatus.Operational, 45, now,
                ["Levantamento", "Consulta de Saldo", "Pagamentos"]),

            // Luanda - Viana
            CreateATM("ATM BPC Viana", "BPC", -8.9033, 13.3744,
                "Luanda", "Viana", "Estrada de Catete", "Viana", "Junto ao Mercado do Panguila",
                false, OperationalStatus.Maintenance, 30, now,
                ["Levantamento"]),

            // Luanda - Kilamba
            CreateATM("ATM Atlantico Kilamba", "Atlântico", -8.9650, 13.2550,
                "Luanda", "Belas", "Centralidade do Kilamba, Bloco Q", "Kilamba", "Perto da Escola Primária",
                true, OperationalStatus.Operational, 90, now,
                ["Levantamento", "Consulta de Saldo", "Transferência", "Pagamentos"]),

            // Benguela
            CreateATM("ATM BAI Benguela Centro", "BAI", -12.5763, 13.4055,
                "Benguela", "Benguela", "Rua 5 de Outubro", "Centro", "Junto à Câmara Municipal",
                true, OperationalStatus.Operational, 68, now,
                ["Levantamento", "Consulta de Saldo"]),

            // Lobito
            CreateATM("ATM BFA Lobito", "BFA", -12.3477, 13.5361,
                "Benguela", "Lobito", "Av. da Independência", "Centro", "Perto do Porto do Lobito",
                false, OperationalStatus.Offline, 20, now,
                ["Levantamento"]),

            // Huambo
            CreateATM("ATM BIC Huambo", "BIC", -12.7761, 15.7394,
                "Huambo", "Huambo", "Av. Norton de Matos", "Centro", "Junto ao Mercado Central",
                true, OperationalStatus.Operational, 55, now,
                ["Levantamento", "Consulta de Saldo"]),

            // Cabinda
            CreateATM("ATM BAI Cabinda", "BAI", -5.5500, 12.1900,
                "Cabinda", "Cabinda", "Rua Comandante Kwenha", "Centro", "Perto do Governo Provincial",
                true, OperationalStatus.Operational, 60, now,
                ["Levantamento", "Consulta de Saldo", "Transferência"]),

            // Lubango (Huíla)
            CreateATM("ATM BPC Lubango", "BPC", -14.9167, 13.5000,
                "Huíla", "Lubango", "Av. 4 de Fevereiro", "Centro", "Junto à Catedral",
                false, OperationalStatus.Operational, 40, now,
                ["Levantamento", "Consulta de Saldo"]),

            // Malanje
            CreateATM("ATM Atlântico Malanje", "Atlântico", -9.5402, 16.3410,
                "Malanje", "Malanje", "Rua Principal", "Centro", "Frente à Praça da Independência",
                true, OperationalStatus.Operational, 50, now,
                ["Levantamento"]),

            // Namibe
            CreateATM("ATM BFA Namibe", "BFA", -15.1961, 12.1522,
                "Namibe", "Namibe", "Av. da Praia", "Centro", "Junto ao Porto",
                true, OperationalStatus.Operational, 65, now,
                ["Levantamento", "Consulta de Saldo"]),

            // Luanda - Ilha
            CreateATM("ATM BAI Ilha de Luanda", "BAI", -8.7964, 13.2428,
                "Luanda", "Luanda", "Av. Murtala Mohamed", "Ilha de Luanda", "Perto do Restaurante Chill Out",
                true, OperationalStatus.Operational, 78, now,
                ["Levantamento", "Consulta de Saldo", "Transferência"]),

            // Luanda - Alvalade
            CreateATM("ATM BIC Alvalade", "BIC", -8.8450, 13.2550,
                "Luanda", "Luanda", "Rua do Alvalade", "Alvalade", "Junto ao Intermarket",
                false, OperationalStatus.Operational, 35, now,
                ["Levantamento", "Consulta de Saldo"]),

            // Soyo (Zaire)
            CreateATM("ATM BAI Soyo", "BAI", -6.1349, 12.3714,
                "Zaire", "Soyo", "Rua Principal", "Centro", "Perto da Base da Sonangol",
                true, OperationalStatus.Operational, 58, now,
                ["Levantamento"]),
        };

        return atms;
    }

    private static ATM CreateATM(
        string name, string bankName, double lat, double lng,
        string province, string municipality, string street, string neighborhood, string landmark,
        bool hasCash, OperationalStatus status, int reliability, DateTime now,
        List<string> services)
    {
        var atm = new ATM
        {
            Id = ObjectId.GenerateNewId().ToString(),
            Name = name,
            BankName = bankName,
            Latitude = lat,
            Longitude = lng,
            Province = province,
            Municipality = municipality,
            Address = new Address
            {
                Street = street,
                Neighborhood = neighborhood,
                Landmark = landmark
            },
            CurrentStatus = new ATMStatus
            {
                HasCash = hasCash,
                OperationalStatus = status,
                ReliabilityScore = reliability,
                LastVerified = now.AddMinutes(-Random.Shared.Next(5, 120)),
                TotalReports = Random.Shared.Next(1, 50)
            },
            SupportedServices = services,
            PhotoUrls = [],
            WorkingHours = new WorkingHours { IsOpen24Hours = true },
            CreatedAt = now,
            UpdatedAt = now
        };

        atm.SyncLocation();
        return atm;
    }

    private static List<User> GetSampleUsers(DateTime now)
    {
        return
        [
            new User
            {
                Id = ObjectId.GenerateNewId().ToString(),
                PhoneNumber = "+244923000001",
                Name = "Utilizador Demo",
                ReputationScore = 100,
                TotalReports = 25,
                AccurateReports = 22,
                Role = "admin",
                CreatedAt = now
            },
            new User
            {
                Id = ObjectId.GenerateNewId().ToString(),
                PhoneNumber = "+244912000002",
                Name = "Maria Silva",
                ReputationScore = 75,
                TotalReports = 12,
                AccurateReports = 9,
                CreatedAt = now
            }
        ];
    }
}
