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
    public List<string> PhotoUrls { get; set; } = new();
    public WorkingHours? WorkingHours { get; set; }

    // kudi-cash-find fields
    public string LocationName { get; set; } = string.Empty;
    public string IsOnline { get; set; } = "online";
    public bool HasPaper { get; set; } = true;
    public int RecentReportsCount { get; set; } = 0;
    public DateTime? LastReportTime { get; set; }

    public string CreatedBy { get; set; } = string.Empty;

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

public class WorkingHours
{
    /// <summary>Opening time in HH:mm format, e.g. "08:00"</summary>
    public string? Opens { get; set; }
    /// <summary>Closing time in HH:mm format, e.g. "17:00"</summary>
    public string? Closes { get; set; }
    /// <summary>Days open: 0=Sun, 1=Mon, ..., 6=Sat</summary>
    public List<int> DaysOpen { get; set; } = [];
    public bool IsOpen24Hours { get; set; }
}