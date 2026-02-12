namespace ATMLocator.Core.Entities;

public class ATM
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string BankName { get; set; } = string.Empty;
    public double Latitude { get; set; }
    public double Longitude { get; set; }

    /// <summary>
    /// GeoJSON Point for MongoDB 2dsphere spatial indexing.
    /// Coordinates are stored in GeoJSON order: [longitude, latitude].
    /// </summary>
    public GeoJsonPoint Location { get; set; } = new();

    public string Province { get; set; } = string.Empty;
    public string Municipality { get; set; } = string.Empty;
    public Address Address { get; set; } = new();
    public ATMStatus CurrentStatus { get; set; } = new();
    public List<string> SupportedServices { get; set; } = new();
    public List<string> PhotoUrls { get; set; } = new(); // NEW
    public WorkingHours? WorkingHours { get; set; } // NEW
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    /// <summary>
    /// Synchronizes the GeoJSON Location field from the Latitude and Longitude properties.
    /// </summary>
    public void SyncLocation()
    {
        Location = GeoJsonPoint.FromCoordinates(Longitude, Latitude);
    }
}

/// <summary>
/// GeoJSON Point geometry compatible with MongoDB 2dsphere indexes.
/// </summary>
public class GeoJsonPoint
{
    public string Type { get; set; } = "Point";
    public double[] Coordinates { get; set; } = [0, 0];

    public static GeoJsonPoint FromCoordinates(double longitude, double latitude)
    {
        return new GeoJsonPoint
        {
            Type = "Point",
            Coordinates = [longitude, latitude]
        };
    }
}

public class Address
{
    public string Street { get; set; } = string.Empty;
    public string Neighborhood { get; set; } = string.Empty;
    public string Landmark { get; set; } = string.Empty;
}

public class ATMStatus
{
    public bool HasCash { get; set; }
    public OperationalStatus OperationalStatus { get; set; } = OperationalStatus.Operational;
    public int ReliabilityScore { get; set; }
    public DateTime LastVerified { get; set; }
    public int TotalReports { get; set; }
}

public enum OperationalStatus
{
    Operational,
    Maintenance,
    Offline
}

// NEW: Working hours
public class WorkingHours
{
    public bool Is24Hours { get; set; }
    public string? OpenTime { get; set; } // "08:00"
    public string? CloseTime { get; set; } // "22:00"
    public List<string> ClosedDays { get; set; } = new(); // ["Sunday"]
}